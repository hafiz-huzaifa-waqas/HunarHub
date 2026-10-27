const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
 
const router = express.Router();
 
// All routes require Admin role
router.use(authenticate, requireRole('Admin'));
 
// ---------- GET /api/admin/dashboard ----------
router.get('/dashboard', async (req, res) => {
  try {
    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)       AS total_users,
        (SELECT COUNT(*) FROM sellers)     AS total_sellers,
        (SELECT COUNT(*) FROM sellers WHERE status='Pending')  AS pending_sellers,
        (SELECT COUNT(*) FROM sellers WHERE status='Verified') AS verified_sellers,
        (SELECT COUNT(*) FROM products)    AS total_products,
        (SELECT COUNT(*) FROM orders)      AS total_orders,
        (SELECT COUNT(*) FROM orders WHERE status='Delivered') AS delivered_orders,
        (SELECT COUNT(*) FROM orders WHERE status NOT IN ('Delivered','Cancelled')) AS pending_orders,
        (SELECT COUNT(*) FROM reports WHERE status='Open') AS open_reports
    `);
    res.json({ summary: counts.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- GET /api/admin/sellers/pending ----------
router.get('/sellers/pending', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.seller_id, s.name, s.contact, s.status, s.consent_date,
              r.name AS region_name, c.name AS category_name,
              u.name AS managed_by_agent
       FROM sellers s
       JOIN regions r ON r.region_id = s.region_id
       JOIN categories c ON c.category_id = s.category_id
       JOIN agents a ON a.agent_id = s.managed_by_agent_id
       JOIN users u ON u.user_id = a.agent_id
       WHERE s.status = 'Pending'
       ORDER BY s.seller_id`
    );
    res.json({ count: result.rowCount, sellers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- PUT /api/admin/sellers/:id/verify ----------
router.put('/sellers/:id/verify', async (req, res) => {
  const sellerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(sellerId)) {
    return res.status(400).json({ error: 'Invalid seller id' });
  }
  try {
    const result = await pool.query(
      `UPDATE sellers
       SET status = 'Verified', verified_by_admin_id = $1
       WHERE seller_id = $2 AND status = 'Pending'
       RETURNING seller_id, name, status, verified_by_admin_id`,
      [req.user.user_id, sellerId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Seller not found or not in Pending status' });
    }
    res.json({ message: 'Seller verified', seller: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- PUT /api/admin/sellers/:id/inactivate ----------
router.put('/sellers/:id/inactivate', async (req, res) => {
  const sellerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(sellerId)) {
    return res.status(400).json({ error: 'Invalid seller id' });
  }
  try {
    const result = await pool.query(
      `UPDATE sellers SET status = 'Inactive'
       WHERE seller_id = $1 AND status = 'Verified'
       RETURNING seller_id, name, status`,
      [sellerId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Seller not found or not Verified' });
    }
    res.json({ message: 'Seller set to Inactive', seller: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- GET /api/admin/commission-rules ----------
router.get('/commission-rules', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.rule_id, cr.category_id, c.name AS category_name,
              cr.commission_percentage
       FROM commission_rules cr
       JOIN categories c ON c.category_id = cr.category_id
       ORDER BY cr.category_id`
    );
    res.json({ count: result.rowCount, rules: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- PUT /api/admin/commission-rules/:category_id ----------
router.put('/commission-rules/:category_id', async (req, res) => {
  const catId = parseInt(req.params.category_id, 10);
  if (!Number.isInteger(catId)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }
  const { commission_percentage } = req.body;
  const pct = Number(commission_percentage);
  if (commission_percentage == null || !Number.isFinite(pct) || pct < 0 || pct > 100) {
    return res.status(400).json({ error: 'commission_percentage must be a number 0-100' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO commission_rules (category_id, commission_percentage)
       VALUES ($1, $2)
       ON CONFLICT (category_id)
       DO UPDATE SET commission_percentage = EXCLUDED.commission_percentage
       RETURNING rule_id, category_id, commission_percentage`,
      [catId, pct]
    );
    res.json({ message: 'Commission rule saved', rule: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid category_id' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- GET /api/admin/reports ----------
router.get('/reports', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.report_id, r.order_id, r.description, r.status,
              r.created_at, u.name AS filed_by
       FROM reports r
       JOIN users u ON u.user_id = r.filed_by_user_id
       ORDER BY r.status, r.report_id DESC`
    );
    res.json({ count: result.rowCount, reports: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- PUT /api/admin/reports/:id/resolve ----------
router.put('/reports/:id/resolve', async (req, res) => {
  const reportId = parseInt(req.params.id, 10);
  if (!Number.isInteger(reportId)) {
    return res.status(400).json({ error: 'Invalid report id' });
  }
  try {
    const result = await pool.query(
      `UPDATE reports
       SET status = 'Resolved', resolved_by_admin_id = $1
       WHERE report_id = $2 AND status = 'Open'
       RETURNING report_id, status, resolved_by_admin_id`,
      [req.user.user_id, reportId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found or already resolved' });
    }
    res.json({ message: 'Report resolved', report: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- POST /api/admin/payouts ----------
router.post('/payouts', async (req, res) => {
  const { paid_on } = req.body;
  const agent_id = Number(req.body.agent_id);
  const amt = Number(req.body.amount);
 
  if (!Number.isInteger(agent_id) || req.body.amount == null || !paid_on) {
    return res.status(400).json({ error: 'agent_id, amount, paid_on required' });
  }
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'amount must be a number > 0' });
  }
  if (isNaN(Date.parse(paid_on))) {
    return res.status(400).json({ error: 'paid_on must be a valid date (YYYY-MM-DD)' });
  }
  try {
    const agentCheck = await pool.query('SELECT 1 FROM agents WHERE agent_id = $1', [agent_id]);
    if (agentCheck.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid agent_id' });
    }
    const result = await pool.query(
      `INSERT INTO payouts (agent_id, amount, paid_on, recorded_by_admin_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [agent_id, amt, paid_on, req.user.user_id]
    );
    res.status(201).json({ message: 'Payout recorded', payout: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ---------- GET /api/admin/payouts ----------
router.get('/payouts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.payout_id, p.agent_id, u.name AS agent_name,
              p.amount, p.paid_on, p.recorded_by_admin_id
       FROM payouts p
       JOIN agents a ON a.agent_id = p.agent_id
       JOIN users u ON u.user_id = a.agent_id
       ORDER BY p.payout_id DESC`
    );
    res.json({ count: result.rowCount, payouts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
// GET /api/admin/agents (Agents list for dropdown)
router.get('/agents', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.agent_id, u.name 
       FROM agents a
       JOIN users u ON u.user_id = a.agent_id
       ORDER BY u.name`
    );
    res.json({ count: result.rowCount, agents: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 1. GET ALL SELLERS
router.get('/sellers/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.seller_id, s.name, s.contact, s.status, s.consent_date,
              r.name AS region_name, c.name AS category_name,
              u.name AS managed_by_agent
       FROM sellers s
       JOIN regions r ON r.region_id = s.region_id
       JOIN categories c ON c.category_id = s.category_id
       JOIN agents a ON a.agent_id = s.managed_by_agent_id
       JOIN users u ON u.user_id = a.agent_id
       ORDER BY s.seller_id DESC`
    );
    res.json({ count: result.rowCount, sellers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. REMOVE/INACTIVATE SELLER
router.put('/sellers/:id/remove', async (req, res) => {
  const sellerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(sellerId)) return res.status(400).json({ error: 'Invalid seller id' });
  try {
    const result = await pool.query(
      `UPDATE sellers SET status = 'Inactive' WHERE seller_id = $1 RETURNING seller_id, name, status`,
      [sellerId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Seller not found' });
    res.json({ message: 'Seller removed (inactivated)', seller: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. GET ALL AGENTS (Detailed) - FIXED QUERY
router.get('/agents/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.agent_id, u.name, u.contact, r.name AS region_name,
              (SELECT COUNT(*) FROM sellers s WHERE s.managed_by_agent_id = a.agent_id) AS total_sellers,
              COALESCE(ae.total_earned, 0) AS total_earned,
              COALESCE(ae.total_paid, 0) AS total_paid
       FROM agents a
       JOIN users u ON u.user_id = a.agent_id
       JOIN regions r ON r.region_id = a.region_id
       LEFT JOIN agent_earnings ae ON ae.agent_id = a.agent_id
       ORDER BY a.agent_id DESC`
    );
    res.json({ count: result.rowCount, agents: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. DELETE AGENT
router.delete('/agents/:id', async (req, res) => {
  const agentId = parseInt(req.params.id, 10);
  if (!Number.isInteger(agentId)) return res.status(400).json({ error: 'Invalid agent id' });
  try {
    const check = await pool.query('SELECT 1 FROM sellers WHERE managed_by_agent_id = $1', [agentId]);
    if (check.rowCount > 0) {
      return res.status(400).json({ error: 'Cannot delete agent with active sellers. Remove sellers first.' });
    }
    await pool.query('DELETE FROM agents WHERE agent_id = $1', [agentId]);
    await pool.query('DELETE FROM users WHERE user_id = $1', [agentId]);
    res.json({ message: 'Agent deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. ADD NEW AGENT
const bcrypt = require('bcrypt'); 

router.post('/agents', async (req, res) => {
  const { name, contact, password, region_id } = req.body;
  if (!name || !contact || !password || !region_id) {
    return res.status(400).json({ error: 'name, contact, password, region_id required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (name, contact, password_hash, role) VALUES ($1, $2, $3, 'Agent') RETURNING user_id`,
      [name, contact, hash]
    );
    const agentId = userRes.rows[0].user_id;
    await client.query(`INSERT INTO agents (agent_id, region_id) VALUES ($1, $2)`, [agentId, region_id]);
    await client.query('COMMIT');
    res.status(201).json({ message: 'Agent created', agent: { agent_id: agentId, name, contact } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Contact already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ==========================================
// UNVERIFY SELLER (Move back to Pending)
// ==========================================
router.put('/sellers/:id/unverify', async (req, res) => {
  const sellerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(sellerId)) return res.status(400).json({ error: 'Invalid seller id' });
  
  try {
    const result = await pool.query(
      `UPDATE sellers 
       SET status = 'Pending', verified_by_admin_id = NULL 
       WHERE seller_id = $1 AND status = 'Verified' 
       RETURNING seller_id, name, status`,
      [sellerId]
    );
    
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Seller not found or not in Verified status' });
    }
    
    res.json({ message: 'Seller unverified', seller: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;