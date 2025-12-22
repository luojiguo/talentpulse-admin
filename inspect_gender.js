const { pool } = require('./backend/src/config/db');

async function inspectConstraint() {
    try {
        const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'users_gender_check';
    `);
        console.log('Constraint Definition:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

inspectConstraint();
