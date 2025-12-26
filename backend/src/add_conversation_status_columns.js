const { pool } = require('./config/db');

async function addConversationStatusColumns() {
    const client = await pool.connect();
    try {
        console.log('Beginning database schema update...');

        // Define columns to add
        const columns = [
            'recruiter_pinned BOOLEAN DEFAULT FALSE',
            'recruiter_hidden BOOLEAN DEFAULT FALSE',
            'candidate_pinned BOOLEAN DEFAULT FALSE',
            'candidate_hidden BOOLEAN DEFAULT FALSE'
        ];

        for (const columnDef of columns) {
            const columnName = columnDef.split(' ')[0];
            // Check if column exists
            const checkRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='conversations' AND column_name=$1;
        `, [columnName]);

            if (checkRes.rows.length === 0) {
                console.log(`Adding column: ${columnName}`);
                await client.query(`ALTER TABLE conversations ADD COLUMN ${columnDef};`);
            } else {
                console.log(`Column ${columnName} already exists. Skipping.`);
            }
        }

        console.log('Database schema update completed successfully.');
    } catch (error) {
        console.error('Error updating database schema:', error);
    } finally {
        client.release();
        pool.end(); // Close the pool to exit the script
    }
}

addConversationStatusColumns();
