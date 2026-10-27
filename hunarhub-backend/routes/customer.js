const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
 
const router = express.Router();
 
// All routes require Customer role
router.use(authenticate, requireRole('Customer'));

// Flat nationwide shipping fee. Set by the server so the client can't change it.
const SHIPPING_FEE = 200.0;
 
// ---------- POST /api/customer/orders ----------
// Body: { seller_id, items: [{product_id, quantity}] }
// BR-3: one order = one seller
router.post('/orders', async (req, res) => {
  // Validate + coerce input, merge duplicate product lines
  const seller_id = Number(req.body.seller_id);
  const merged = new Map();
  for (const it of Array.isArray(req.body.items) ? req.body.items : []) {
    const pid = Number(it.product_id);
    const qty = Number(it.quantity);
    if (!Number.isInteger(pid) || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'each item needs integer product_id and quantity > 0' });
    }
    merged.set(pid, (merged.get(pid) || 0) + qty);
  }
  if (!Number.isInteger(seller_id) || merged.size === 0) {
    return res.status(400).json({ error: 'seller_id and items[] required' });
  }
  const items = [...merged].map(([product_id, quantity]) => ({ product_id, quantity }));
 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
 
    // 1. seller must be Verified (BR-2)
    const seller = await client.query(
      `SELECT seller_id, managed_by_agent_id FROM sellers
       WHERE seller_id = $1 AND status = 'Verified'`,
      [seller_id]
    );
    if (seller.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Seller not found or not Verified' });
    }
    const agent_id = seller.rows[0].managed_by_agent_id;
 
    // 2. lock + validate each product (same seller, active, stock)
    //    ORDER BY avoids deadlocks between concurrent orders
    const productIds = items.map(i => i.product_id);
    const prodRes = await client.query(
      `SELECT product_id, seller_id, price, available_qty, is_active
       FROM products WHERE product_id = ANY($1::int[])
       ORDER BY product_id FOR UPDATE`,
      [productIds]
    );
    const prodMap = new Map(prodRes.rows.map(p => [p.product_id, p]));
 
    for (const it of items) {
      const p = prodMap.get(it.product_id);
      if (!p) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product ${it.product_id} not found` });
      }
      if (p.seller_id !== seller_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'All items must belong to the same seller (BR-3)' });
      }
      if (!p.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product ${it.product_id} is inactive` });
      }
      if (p.available_qty < it.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for product ${it.product_id} (available ${p.available_qty})` });
      }
    }
 
    // 3. insert order
    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, seller_id, agent_id, status, shipping_fee)
       VALUES ($1, $2, $3, 'Placed', $4) RETURNING order_id, order_date`,
      [req.user.user_id, seller_id, agent_id, SHIPPING_FEE]
    );
    const order_id = orderRes.rows[0].order_id;
 
    // 4. insert order_items with snapshot unit_price
    for (const it of items) {
      const p = prodMap.get(it.product_id);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order_id, it.product_id, it.quantity, p.price]
      );
      // 5. decrement stock
      await client.query(
        `UPDATE products SET available_qty = available_qty - $1 WHERE product_id = $2`,
        [it.quantity, it.product_id]
      );
    }
 
    // 6. audit trail
    await client.query(
      `INSERT INTO order_status_history (order_id, status, changed_by_user_id)
       VALUES ($1, 'Placed', $2)`,
      [order_id, req.user.user_id]
    );
 
    // 7. summary
    const summary = await client.query(
      `SELECT oi.product_id, oi.quantity, oi.unit_price,
              (oi.quantity * oi.unit_price) AS line_total
       FROM order_items oi WHERE oi.order_id = $1`,
      [order_id]
    );
    const itemsTotal = summary.rows.reduce((s, r) => s + Number(r.line_total), 0);
    const total = itemsTotal + SHIPPING_FEE; // items + shipping
 
    await client.query('COMMIT');
    res.status(201).json({
      message: 'Order placed',
      order_id,
      order_date: orderRes.rows[0].order_date,
      seller_id,
      agent_id,
      items: summary.rows,
      items_total: itemsTotal.toFixed(2),
      shipping_fee: SHIPPING_FEE.toFixed(2),
      total_amount: total.toFixed(2),
      status: 'Placed'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});
 
// ---------- GET /api/customer/orders ----------
// ⭐ UPDATED: now includes items[] (name, image, quantity) for UI display
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.order_id, o.seller_id, s.name AS seller_name,
              o.status, o.order_date,
              o.shipping_fee,
              COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS items_total,
              COALESCE(SUM(oi.quantity * oi.unit_price), 0) + o.shipping_fee AS total_amount,
              (
                SELECT json_agg(json_build_object(
                  'product_id', p.product_id,
                  'name', p.name,
                  'image_url', p.image_url,
                  'quantity', oi2.quantity
                ) ORDER BY oi2.order_item_id)
                FROM order_items oi2
                JOIN products p ON p.product_id = oi2.product_id
                WHERE oi2.order_id = o.order_id
              ) AS items
       FROM orders o
       JOIN sellers s ON s.seller_id = o.seller_id
       LEFT JOIN order_items oi ON oi.order_id = o.order_id
       WHERE o.customer_id = $1
       GROUP BY o.order_id, o.seller_id, s.name, o.status, o.order_date, o.shipping_fee
       ORDER BY o.order_id DESC`,
      [req.user.user_id]
    );
    res.json({ count: result.rowCount, orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- GET /api/customer/orders/:id ----------
router.get('/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  try {
    const ord = await pool.query(
      `SELECT o.order_id, o.seller_id, o.agent_id, o.status, o.order_date,
              o.shipping_fee,
              COALESCE((SELECT SUM(quantity * unit_price) FROM order_items
                        WHERE order_id = o.order_id), 0) AS items_total,
              COALESCE((SELECT SUM(quantity * unit_price) FROM order_items
                        WHERE order_id = o.order_id), 0) + o.shipping_fee AS total_amount
       FROM orders o WHERE o.order_id = $1 AND o.customer_id = $2`,
      [id, req.user.user_id]
    );
    if (ord.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
 
    const items = await pool.query(
      `SELECT oi.product_id, p.name AS product_name,
              p.image_url,
              oi.quantity, oi.unit_price,
              (oi.quantity * oi.unit_price) AS line_total
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    );
 
    const history = await pool.query(
      `SELECT status, changed_at, changed_by_user_id
       FROM order_status_history WHERE order_id = $1
       ORDER BY changed_at`,
      [id]
    );
 
    res.json({ order: ord.rows[0], items: items.rows, history: history.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- POST /api/customer/reviews ----------
// Body: { order_id, rating, comment }
// Trigger rejects if order not Delivered
router.post('/reviews', async (req, res) => {
  const { comment } = req.body;
  const order_id = Number(req.body.order_id);
  const rating = Number(req.body.rating);
 
  if (!Number.isInteger(order_id) || req.body.rating == null) {
    return res.status(400).json({ error: 'order_id and rating required' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be an integer 1-5' });
  }
  try {
    // customer must own the order
    const own = await pool.query(
      `SELECT 1 FROM orders WHERE order_id = $1 AND customer_id = $2`,
      [order_id, req.user.user_id]
    );
    if (own.rowCount === 0) {
      return res.status(403).json({ error: 'Not your order' });
    }
    const result = await pool.query(
      `INSERT INTO reviews (order_id, rating, comment)
       VALUES ($1, $2, $3) RETURNING *`,
      [order_id, rating, comment || null]
    );
    res.status(201).json({ message: 'Review submitted', review: result.rows[0] });
  } catch (err) {
    // trigger error (not Delivered) or duplicate (one review per order)
    if (err.message.includes('Review allowed only for Delivered')) {
      return res.status(400).json({ error: 'Review allowed only for Delivered orders (BR-5)' });
    }
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already reviewed this order' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- POST /api/customer/reports ----------
// Body: { order_id, description }
router.post('/reports', async (req, res) => {
  const { description } = req.body;
  const order_id = Number(req.body.order_id);
  if (!Number.isInteger(order_id) || !description) {
    return res.status(400).json({ error: 'order_id and description required' });
  }
  try {
    const own = await pool.query(
      `SELECT 1 FROM orders WHERE order_id = $1 AND customer_id = $2`,
      [order_id, req.user.user_id]
    );
    if (own.rowCount === 0) {
      return res.status(403).json({ error: 'Not your order' });
    }
    const result = await pool.query(
      `INSERT INTO reports (order_id, filed_by_user_id, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [order_id, req.user.user_id, description]
    );
    res.status(201).json({ message: 'Report filed', report: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// GET /api/customer/sellers/:id/reviews — public reviews list for a seller
router.get('/sellers/:id/reviews', async (req, res) => {
  const sellerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(sellerId)) {
    return res.status(400).json({ error: 'Invalid seller id' });
  }
  try {
    const result = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at
       FROM reviews r
       JOIN orders o ON o.order_id = r.order_id
       WHERE o.seller_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [sellerId]
    );
    res.json({ count: result.rowCount, reviews: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/customer/orders/:id/cancel — Customer cancels a Placed order
router.put('/orders/:id/cancel', async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the order row
    const ord = await client.query(
      `SELECT order_id, status, customer_id FROM orders
       WHERE order_id = $1 FOR UPDATE`,
      [orderId]
    );

    if (ord.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ownership check
    if (ord.rows[0].customer_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not your order' });
    }

    // Only 'Placed' can be cancelled by customer (FR-9)
    if (ord.rows[0].status !== 'Placed') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot cancel order in '${ord.rows[0].status}' status. Only 'Placed' orders can be cancelled.`,
      });
    }

    // Update status
    await client.query(
      `UPDATE orders SET status = 'Cancelled' WHERE order_id = $1`,
      [orderId]
    );

    // Return stock (aggregated per product)
    await client.query(
      `UPDATE products p
       SET available_qty = p.available_qty + t.qty
       FROM (SELECT product_id, SUM(quantity) AS qty
             FROM order_items WHERE order_id = $1
             GROUP BY product_id) t
       WHERE p.product_id = t.product_id`,
      [orderId]
    );

    // Status history
    await client.query(
      `INSERT INTO order_status_history (order_id, status, changed_by_user_id)
       VALUES ($1, 'Cancelled', $2)`,
      [orderId, req.user.user_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Order cancelled', order_id: orderId, status: 'Cancelled' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;