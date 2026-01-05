const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log('Connecting to database...');

        // 1. Drop existing constraint
        console.log('Dropping existing constraint messages_type_check...');
        await pool.query(`
      ALTER TABLE messages 
      DROP CONSTRAINT IF EXISTS messages_type_check;
    `);

        // 2. Add new constraint with updated types
        console.log('Adding new constraint messages_type_check...');
        // Types: 'text', 'image', 'file', 'system' (standard)
        //        'exchange_request' (new feature)
        //        'exchange_accept', 'exchange_reject' (legacy compatibility)
        //        'location' (potential future use)
        await pool.query(`
      ALTER TABLE messages 
      ADD CONSTRAINT messages_type_check 
      CHECK (type IN ('text', 'image', 'file', 'system', 'exchange_request', 'exchange_accept', 'exchange_reject', 'location', 'wechat_card'));
    `);

        console.log('Successfully updated messages_type_check constraint.');

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
