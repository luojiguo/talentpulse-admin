const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'talentpulse',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
});

async function checkSchema() {
    try {
        console.log('--- Checking Companies Table Schema ---');
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companies'
    `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkSchema();
