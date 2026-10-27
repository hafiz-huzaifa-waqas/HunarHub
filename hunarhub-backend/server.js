const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agent');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'HunarHub API is running 🚀' });
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);

// Products & Lookups
app.use('/api/products', require('./routes/products'));
app.use('/api', require('./routes/lookups'));

// ✅ PUBLIC ROUTE — seller profile & products
app.get('/api/sellers/:id', async (req, res) => {
  const sellerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(sellerId)) return res.status(400).json({ error: 'Invalid seller id' });
  
  try {
    const sellerRes = await pool.query(
      `SELECT s.seller_id, s.name, s.contact, r.name AS region_name, c.name AS category_name,
              COALESCE(sr.avg_rating, 0) AS avg_rating, COALESCE(sr.review_count, 0) AS review_count
       FROM sellers s
       JOIN regions r ON r.region_id = s.region_id
       JOIN categories c ON c.category_id = s.category_id
       LEFT JOIN seller_ratings sr ON sr.seller_id = s.seller_id
       WHERE s.seller_id = $1 AND s.status = 'Verified'`,
      [sellerId]
    );
    
    if (sellerRes.rowCount === 0) return res.status(404).json({ error: 'Seller not found or not verified' });
    
    const productsRes = await pool.query(
      `SELECT product_id, name, product_type, price, available_qty, image_url, category_id
       FROM products 
       WHERE seller_id = $1 AND is_active = TRUE 
       ORDER BY product_id DESC`,
      [sellerId]
    );
    
    res.json({ seller: sellerRes.rows[0], products: productsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ PUBLIC ROUTE — seller reviews (no auth)
app.get('/api/sellers/:id/reviews', async (req, res) => {
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

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});