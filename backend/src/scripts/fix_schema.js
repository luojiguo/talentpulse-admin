const { pool } = require('../config/db');

async function runMigration() {
    const client = await pool.connect();
    console.log('Starting database schema migration...');

    try {
        await client.query('BEGIN');

        // 1. candidates table - add missing columns
        console.log('Updating candidates table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        summary TEXT,
        expected_salary_min INTEGER,
        expected_salary_max INTEGER,
        availability_status VARCHAR(50) DEFAULT 'available',
        preferred_locations VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await client.query(`
      ALTER TABLE candidates
      ADD COLUMN IF NOT EXISTS summary TEXT,
      ADD COLUMN IF NOT EXISTS expected_salary_min INTEGER,
      ADD COLUMN IF NOT EXISTS expected_salary_max INTEGER,
      ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'available',
      ADD COLUMN IF NOT EXISTS preferred_locations VARCHAR(255);
    `);

        // 2. users table - ensure columns exist
        console.log('Updating users table...');
        await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar VARCHAR(255),
      ADD COLUMN IF NOT EXISTS position VARCHAR(255),
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
      ADD COLUMN IF NOT EXISTS birth_date DATE,
      ADD COLUMN IF NOT EXISTS education VARCHAR(255),
      ADD COLUMN IF NOT EXISTS major VARCHAR(255),
      ADD COLUMN IF NOT EXISTS school VARCHAR(255),
      ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
      ADD COLUMN IF NOT EXISTS work_experience_years INTEGER,
      ADD COLUMN IF NOT EXISTS desired_position VARCHAR(255),
      ADD COLUMN IF NOT EXISTS skills JSONB,
      ADD COLUMN IF NOT EXISTS languages JSONB,
      ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255),
      ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address VARCHAR(255),
      ADD COLUMN IF NOT EXISTS wechat VARCHAR(255),
      ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255),
      ADD COLUMN IF NOT EXISTS github VARCHAR(255),
      ADD COLUMN IF NOT EXISTS personal_website VARCHAR(255);
    `);

        // 3. companies table
        console.log('Updating companies table...');
        await client.query(`
      ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS business_license VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_info VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS social_credit_code VARCHAR(255),
      ADD COLUMN IF NOT EXISTS company_website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS company_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS registered_capital VARCHAR(50),
      ADD COLUMN IF NOT EXISTS establishment_date DATE,
      ADD COLUMN IF NOT EXISTS company_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS logo VARCHAR(255),
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS address VARCHAR(255),
      ADD COLUMN IF NOT EXISTS size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
    `);

        // 4. recruiter_user table
        console.log('Updating recruiter_user table...');
        await client.query(`
      ALTER TABLE recruiter_user
      ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS business_license VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_info VARCHAR(255);
    `);

        // 5. jobs table
        console.log('Updating jobs table...');
        await client.query(`
      ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS required_skills JSONB,
      ADD COLUMN IF NOT EXISTS preferred_skills JSONB,
      ADD COLUMN IF NOT EXISTS benefits JSONB,
      ADD COLUMN IF NOT EXISTS experience VARCHAR(100),
      ADD COLUMN IF NOT EXISTS degree VARCHAR(100),
      ADD COLUMN IF NOT EXISTS type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50),
      ADD COLUMN IF NOT EXISTS job_level VARCHAR(50),
      ADD COLUMN IF NOT EXISTS hiring_count INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS urgency VARCHAR(50),
      ADD COLUMN IF NOT EXISTS department VARCHAR(100),
      ADD COLUMN IF NOT EXISTS expire_date TIMESTAMP;
    `);

        // 6. conversations table
        console.log('Updating conversations table...');
        await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS recruiter_unread INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS candidate_unread INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;
    `);

        // 7. messages table
        console.log('Updating messages table...');
        await client.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS deleted_by INTEGER,
      ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text',
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';
    `);

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        // End the pool to exit the script
        pool.end();
    }
}

runMigration();
