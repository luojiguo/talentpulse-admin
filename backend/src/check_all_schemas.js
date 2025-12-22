const { query } = require('./config/db');

async function checkSchemas() {
    const tables = ['resumes', 'conversations', 'users', 'jobs', 'messages'];
    for (const table of tables) {
        console.log(`\n--- ${table} ---`);
        try {
            const result = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            result.rows.forEach(row => {
                console.log(`- ${row.column_name} (${row.data_type})`);
            });
        } catch (e) {
            console.log(`Error reading ${table}: ${e.message}`);
        }
    }
    process.exit(0);
}

checkSchemas();
