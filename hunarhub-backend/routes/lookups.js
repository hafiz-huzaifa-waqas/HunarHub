const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/regions', async (req, res) => {
  try {
    const r = await pool.query('SELECT region_id, name FROM regions ORDER BY name');
    res.json({ count: r.rowCount, regions: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const r = await pool.query('SELECT category_id, name FROM categories ORDER BY name');
    res.json({ count: r.rowCount, categories: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;