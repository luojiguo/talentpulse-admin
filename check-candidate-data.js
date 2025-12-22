// 检查候选人管理相关表的数据量
const { pool } = require('./backend/src/config/db');

async function checkCandidateData() {
    try {
        console.log('正在检查候选人管理相关表的数据...');
        
        // 查询候选人表数据量
        const candidatesResult = await pool.query('SELECT COUNT(*) as count FROM candidates');
        console.log(`候选人表 (candidates): ${candidatesResult.rows[0].count} 条记录`);
        
        // 查询申请表数据量
        const applicationsResult = await pool.query('SELECT COUNT(*) as count FROM applications');
        console.log(`申请表 (applications): ${applicationsResult.rows[0].count} 条记录`);
        
        // 查询面试表数据量
        const interviewsResult = await pool.query('SELECT COUNT(*) as count FROM interviews');
        console.log(`面试表 (interviews): ${interviewsResult.rows[0].count} 条记录`);
        
        // 查询候选人详细数据示例
        console.log('\n候选人表前5条数据示例:');
        const candidatesSample = await pool.query('SELECT * FROM candidates LIMIT 5');
        console.table(candidatesSample.rows);
        
        // 查询申请表详细数据示例
        console.log('\n申请表前5条数据示例:');
        const applicationsSample = await pool.query('SELECT * FROM applications LIMIT 5');
        console.table(applicationsSample.rows);
        
        // 查询面试表详细数据示例
        console.log('\n面试表前5条数据示例:');
        const interviewsSample = await pool.query('SELECT * FROM interviews LIMIT 5');
        console.table(interviewsSample.rows);
        
        // 查询关联数据示例
        console.log('\n关联查询示例 (申请记录 + 候选人 + 职位):');
        const joinSample = await pool.query(`
            SELECT 
                a.id,
                a.candidate_id,
                a.job_id,
                a.status,
                a.created_at as applied_date,
                c.id as candidate_table_id,
                u.name as candidate_name,
                j.title as job_title,
                j.company_id
            FROM applications a
            LEFT JOIN candidates c ON a.candidate_id = c.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN jobs j ON a.job_id = j.id
            LIMIT 5
        `);
        console.table(joinSample.rows);
        
        // 查询招聘者相关的候选人数据
        console.log('\n招聘者相关的候选人数据示例:');
        const recruiterCandidatesSample = await pool.query(`
            SELECT 
                a.id,
                a.status as stage,
                a.created_at as appliedDate,
                u.name as candidateName,
                j.title as jobTitle,
                co.name as companyName
            FROM applications a
            LEFT JOIN candidates c ON a.candidate_id = c.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN jobs j ON a.job_id = j.id
            LEFT JOIN companies co ON j.company_id = co.id
            LIMIT 5
        `);
        console.table(recruiterCandidatesSample.rows);
        
    } catch (error) {
        console.error('查询数据失败:', error.message);
    } finally {
        await pool.end();
    }
}

checkCandidateData();