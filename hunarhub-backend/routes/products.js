const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET /api/products  (public)
// Now includes seller rating (avg_rating + review_count) from Seller_Ratings view
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.product_id, p.seller_id, s.name AS seller_name,
              p.category_id, c.name AS category_name,
              p.name, p.product_type, p.price, p.available_qty, p.image_url,
              COALESCE(sr.avg_rating, 0) AS avg_rating,
              COALESCE(sr.review_count, 0) AS review_count
       FROM products p
       JOIN sellers s    ON s.seller_id = p.seller_id
       JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN seller_ratings sr ON sr.seller_id = p.seller_id
       WHERE p.is_active = TRUE AND s.status = 'Verified'
       ORDER BY p.product_id DESC`
    );
    res.json({ count: result.rowCount, products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;