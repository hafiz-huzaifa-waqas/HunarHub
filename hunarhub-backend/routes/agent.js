const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes below require Agent role
router.use(authenticate, requireRole('Agent'));

// Allowed order status transitions (state machine)
const TRANSITIONS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Ready', 'Cancelled'],
  Ready: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: []
};

// ---------- GET /api/agent/sellers ----------
router.get('/sellers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT seller_id, name, contact, region_id, category_id,
              status, consent_date, verified_by_admin_id
       FROM sellers
       WHERE managed_by_agent_id = $1
       ORDER BY seller_id DESC`,
      [req.user.user_id]
    );
    res.json({ count: result.rowCount, sellers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- POST /api/agent/sellers ----------
router.post('/sellers', async (req, res) => {
  const { name, contact, region_id, category_id, consent_given } = req.body;
  if (!name || !contact || !region_id || !category_id) {
    return res.status(400).json({ error: 'name, contact, region_id, category_id required' });
  }
  if (!consent_given) {
    return res.status(400).json({ error: 'Seller consent is required (BR-1)' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sellers
         (name, contact, region_id, category_id, managed_by_agent_id, status, consent_date)
       VALUES ($1, $2, $3, $4, $5, 'Pending', CURRENT_DATE)
       RETURNING seller_id, name, contact, status, consent_date`,
      [name, contact, region_id, category_id, req.user.user_id]
    );
    res.status(201).json({ message: 'Seller registered (Pending verification)', seller: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid region_id or category_id' });
    }
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Seller already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- POST /api/agent/products ----------
router.post('/products', async (req, res) => {
  const { seller_id, category_id, name, product_type, price, available_qty, image_url } = req.body;

  if (!seller_id || !category_id || !name || !product_type || price == null || available_qty == null) {
    return res.status(400).json({ error: 'seller_id, category_id, name, product_type, price, available_qty required' });
  }
  if (!['Product', 'Service'].includes(product_type)) {
    return res.status(400).json({ error: "product_type must be 'Product' or 'Service'" });
  }

  const priceNum = Number(price);
  const qtyNum = Number(available_qty);
  const sellerIdNum = Number(seller_id);
  const categoryIdNum = Number(category_id);

  if (!Number.isInteger(sellerIdNum) || !Number.isInteger(categoryIdNum)) {
    return res.status(400).json({ error: 'seller_id and category_id must be integers' });
  }
  if (!Number.isFinite(priceNum) || priceNum < 0 || !Number.isInteger(qtyNum) || qtyNum < 0) {
    return res.status(400).json({ error: 'price must be >= 0 and available_qty a non-negative integer' });
  }

  try {
    const own = await pool.query(
      `SELECT 1 FROM sellers WHERE seller_id = $1 AND managed_by_agent_id = $2`,
      [sellerIdNum, req.user.user_id]
    );
    if (own.rowCount === 0) {
      return res.status(403).json({ error: 'This seller is not managed by you' });
    }

    const result = await pool.query(
      `INSERT INTO products (seller_id, category_id, name, product_type, price, available_qty, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [sellerIdNum, categoryIdNum, name, product_type, priceNum, qtyNum, image_url || null]
    );
    res.status(201).json({ message: 'Product added', product: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid category_id' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- GET /api/agent/orders ----------
// Includes items[] with product image + name for UI display
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.order_id, o.customer_id, o.seller_id, o.agent_id, o.status, o.order_date,
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
       LEFT JOIN order_items oi ON oi.order_id = o.order_id
       WHERE o.agent_id = $1
       GROUP BY o.order_id, o.customer_id, o.seller_id, o.agent_id, o.status, o.order_date, o.shipping_fee
       ORDER BY o.order_id DESC`,
      [req.user.user_id]
    );
    res.json({ count: result.rowCount, orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- PUT /api/agent/orders/:id/status ----------
router.put('/orders/:id/status', async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }

  const { status } = req.body;
  const valid = ['Placed', 'Confirmed', 'Ready', 'Delivered', 'Cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ord = await client.query(
      `SELECT order_id, status, agent_id FROM orders WHERE order_id = $1 FOR UPDATE`,
      [orderId]
    );
    if (ord.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    if (ord.rows[0].agent_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not your order' });
    }

    const oldStatus = ord.rows[0].status;
    if (!TRANSITIONS[oldStatus]?.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Cannot change status from ${oldStatus} to ${status}` });
    }

    await client.query(`UPDATE orders SET status = $1 WHERE order_id = $2`, [status, orderId]);

    await client.query(
      `INSERT INTO order_status_history (order_id, status, changed_by_user_id)
       VALUES ($1, $2, $3)`,
      [orderId, status, req.user.user_id]
    );

    // If cancelling, return stock to products (aggregated per product)
    if (status === 'Cancelled') {
      await client.query(
        `UPDATE products p
         SET available_qty = p.available_qty + t.qty
         FROM (SELECT product_id, SUM(quantity) AS qty
               FROM order_items WHERE order_id = $1
               GROUP BY product_id) t
         WHERE p.product_id = t.product_id`,
        [orderId]
      );
    }

    const updated = await client.query(
      `SELECT order_id, status FROM orders WHERE order_id = $1`,
      [orderId]
    );
    const items = await client.query(
      `SELECT product_id, quantity, unit_price, commission_rate, commission_amount
       FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Order status updated', order: updated.rows[0], items: items.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ---------- GET /api/agent/earnings ----------
router.get('/earnings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT agent_id, total_earned, total_paid,
              (total_earned - total_paid) AS pending
       FROM agent_earnings WHERE agent_id = $1`,
      [req.user.user_id]
    );
    res.json({ earnings: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- GET /api/agent/sellers/:id/products ----------
router.get('/sellers/:id/products', async (req, res) => {
  const sellerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(sellerId)) return res.status(400).json({ error: 'Invalid seller id' });
  try {
    const own = await pool.query(
      `SELECT 1 FROM sellers WHERE seller_id = $1 AND managed_by_agent_id = $2`,
      [sellerId, req.user.user_id]
    );
    if (own.rowCount === 0) return res.status(403).json({ error: 'Not your seller' });

    const result = await pool.query(
      `SELECT product_id, seller_id, category_id, name, product_type,
              price, available_qty, image_url, is_active
       FROM products WHERE seller_id = $1 ORDER BY product_id DESC`,
      [sellerId]
    );
    res.json({ count: result.rowCount, products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- PUT /api/agent/products/:id ----------
router.put('/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (!Number.isInteger(productId)) return res.status(400).json({ error: 'Invalid product id' });

  const { name, product_type, price, category_id, available_qty, image_url, is_active } = req.body;
  try {
    const own = await pool.query(
      `SELECT 1 FROM products p
       JOIN sellers s ON s.seller_id = p.seller_id
       WHERE p.product_id = $1 AND s.managed_by_agent_id = $2`,
      [productId, req.user.user_id]
    );
    if (own.rowCount === 0) return res.status(403).json({ error: 'Not your product' });

    const result = await pool.query(
      `UPDATE products SET
         name = COALESCE($1, name),
         product_type = COALESCE($2, product_type),
         price = COALESCE($3, price),
         category_id = COALESCE($4, category_id),
         available_qty = COALESCE($5, available_qty),
         image_url = COALESCE($6, image_url),
         is_active = COALESCE($7, is_active)
       WHERE product_id = $8
       RETURNING *`,
      [name, product_type, price, category_id, available_qty, image_url, is_active, productId]
    );
    res.json({ message: 'Product updated', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- GET /api/agent/orders/:id/history ----------
router.get('/orders/:id/history', async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'Invalid order id' });
  try {
    const own = await pool.query(
      `SELECT 1 FROM orders WHERE order_id = $1 AND agent_id = $2`,
      [orderId, req.user.user_id]
    );
    if (own.rowCount === 0) return res.status(403).json({ error: 'Not your order' });

    const result = await pool.query(
      `SELECT h.history_id, h.status, h.changed_at, h.changed_by_user_id,
              u.name AS changed_by_name
       FROM order_status_history h
       LEFT JOIN users u ON u.user_id = h.changed_by_user_id
       WHERE h.order_id = $1 ORDER BY h.changed_at`,
      [orderId]
    );
    res.json({ count: result.rowCount, history: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- POST /api/agent/reports ----------
router.post('/reports', async (req, res) => {
  const { description } = req.body;
  const orderId = Number(req.body.order_id);
  if (!Number.isInteger(orderId) || !description) {
    return res.status(400).json({ error: 'order_id and description required' });
  }
  try {
    const own = await pool.query(
      `SELECT 1 FROM orders WHERE order_id = $1 AND agent_id = $2`,
      [orderId, req.user.user_id]
    );
    if (own.rowCount === 0) return res.status(403).json({ error: 'Not your order' });

    const result = await pool.query(
      `INSERT INTO reports (order_id, filed_by_user_id, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [orderId, req.user.user_id, description]
    );
    res.status(201).json({ message: 'Report filed', report: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;