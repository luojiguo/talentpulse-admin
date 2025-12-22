// Script to insert a test company if it does not exist
const { pool } = require('./src/config/db');

async function ensureCompany() {
    const companyName = 'Tech Corp';
    try {
        const result = await pool.query('SELECT id FROM companies WHERE name = $1', [companyName]);
        if (result.rows.length > 0) {
            console.log('Company already exists with id:', result.rows[0].id);
        } else {
            const insertRes = await pool.query(`
        INSERT INTO companies (
          name, industry, size, address, description, logo, company_type, establishment_date, registered_capital, social_credit_code, company_website, company_phone, company_email, is_verified, verification_date, status, job_count, follower_count, created_at, updated_at, business_license, contact_info
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        ) RETURNING id;
      `, [
                companyName,
                'Technology',
                'Medium',
                'Shanghai',
                'Test company for job posting',
                'C',
                'Private',
                '2020-01-01',
                '1000000',
                '1234567890',
                'https://techcorp.example.com',
                '021-12345678',
                'contact@techcorp.example.com',
                false,
                null,
                'active',
                0,
                0,
                new Date().toISOString(),
                new Date().toISOString(),
                '',
                ''
            ]);
            console.log('Inserted company with id:', insertRes.rows[0].id);
        }
    } catch (err) {
        console.error('Error ensuring company:', err);
    } finally {
        await pool.end();
    }
}

ensureCompany();
