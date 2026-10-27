const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Default password for every existing sample user — change after logging in if you want
const DEFAULT_PASSWORD = 'password123';

(async () => {
  try {
    const result = await pool.query(
      "SELECT user_id, contact FROM users WHERE password_hash = 'hash'"
    );
    if (result.rowCount === 0) {
      console.log('No users with placeholder hash. Nothing to do.');
      process.exit(0);
    }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const row of result.rows) {
      await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hash, row.user_id]);
      console.log(`Updated user ${row.user_id} (${row.contact})`);
    }

    console.log(`\n✅ Done. All updated users now have password: "${DEFAULT_PASSWORD}"`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();