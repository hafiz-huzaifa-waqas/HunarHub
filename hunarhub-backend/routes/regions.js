// Save as: routes/regions.js  (in your backend)
const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET /api/regions  (public — the Signup page needs it before anyone is logged in)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT region_id, name FROM regions ORDER BY name`
    );
    res.json({ count: result.rowCount, regions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// Then in server.js add (next to the products line):
//   app.use('/api/regions', require('./routes/regions'));