const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// ---------- REGISTER (Customer only) ----------
// Body: { name, contact, password, region_id, address }
router.post('/register', async (req, res) => {
  const { name, contact, password, region_id, address } = req.body;

  if (!name || !contact || !password || !region_id) {
    return res.status(400).json({ error: 'name, contact, password, region_id are required' });
  }

  // VALIDATION CHECKS
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return res.status(400).json({ error: 'Name must contain only alphabets and spaces' });
  }
  
  // Contact number check: Sirf digits, dashes allowed. Aur total digits 11 hone chahiye.
  // Ye regex dashes ko ignore karke sirf numbers count karta hai.
  const digitsOnly = contact.replace(/\D/g, ''); // Sirf numbers nikalta hai
  if (!/^[0-9-]+$/.test(contact) || digitsOnly.length !== 11) {
    return res.status(400).json({ error: 'Contact must be a valid 11-digit phone number (e.g., 0300-1234567)' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // check duplicate contact
    const dup = await client.query('SELECT 1 FROM users WHERE contact = $1', [contact]);
    if (dup.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Contact already registered' });
    }

    // check region exists
    const reg = await client.query('SELECT 1 FROM regions WHERE region_id = $1', [region_id]);
    if (reg.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid region_id' });
    }

    const hash = await bcrypt.hash(password, 10);

    const userRes = await client.query(
      `INSERT INTO users (name, contact, password_hash, role)
       VALUES ($1, $2, $3, 'Customer')
       RETURNING user_id`,
      [name, contact, hash]
    );
    const user_id = userRes.rows[0].user_id;

    await client.query(
      `INSERT INTO customers (customer_id, region_id, address)
       VALUES ($1, $2, $3)`,
      [user_id, region_id, address || null]
    );

    await client.query('COMMIT');

    const token = jwt.sign(
      { user_id, role: 'Customer', name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Customer registered',
      token,
      user: { user_id, name, contact, role: 'Customer', region_id, address }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ---------- LOGIN (all roles) ----------
// Body: { contact, password }
router.post('/login', async (req, res) => {
  const { contact, password } = req.body;
  if (!contact || !password) {
    return res.status(400).json({ error: 'contact and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT user_id, name, contact, password_hash, role
       FROM users WHERE contact = $1`,
      [contact]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid contact or password' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid contact or password' });
    }

    // fetch role-specific extra info
    let extra = {};
    if (user.role === 'Customer') {
      const c = await pool.query('SELECT region_id, address FROM customers WHERE customer_id = $1', [user.user_id]);
      if (c.rowCount > 0) extra = c.rows[0];
    } else if (user.role === 'Agent') {
      const a = await pool.query('SELECT region_id FROM agents WHERE agent_id = $1', [user.user_id]);
      if (a.rowCount > 0) extra = a.rows[0];
    } else if (user.role === 'Admin') {
      const ad = await pool.query('SELECT access_level FROM admins WHERE admin_id = $1', [user.user_id]);
      if (ad.rowCount > 0) extra = ad.rows[0];
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        contact: user.contact,
        role: user.role,
        ...extra
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;