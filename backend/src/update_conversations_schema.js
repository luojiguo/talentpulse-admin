
const { pool } = require('./config/db');

async function checkAndAlterTable() {
    try {
        // Check columns
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversations';
    `);

        const columns = res.rows.map(r => r.column_name);
        console.log('Current columns:', columns);

        if (!columns.includes('recruiter_deleted_at')) {
            console.log('Adding recruiter_deleted_at...');
            await pool.query('ALTER TABLE conversations ADD COLUMN recruiter_deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL');
        }

        if (!columns.includes('candidate_deleted_at')) {
            console.log('Adding candidate_deleted_at...');
            await pool.query('ALTER TABLE conversations ADD COLUMN candidate_deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL');
        }

        console.log('Schema update complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkAndAlterTable();
