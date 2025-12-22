const { Client } = require('pg');

async function checkUserCompany() {
    const client = new Client({
        connectionString: 'postgresql://postgres:123456@localhost:5432/Talent'
    });
    
    try {
        await client.connect();
        
        // 查询用户ID
        const userResult = await client.query('SELECT id FROM users WHERE email = $1', ['yuji@163.com']);
        console.log('用户查询结果:', userResult.rows);
        
        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            console.log('用户ID:', userId);
            
            // 查询公司关联信息
            const companyResult = await client.query(
                'SELECT c.*, ru.is_verified FROM companies c JOIN recruiter_user ru ON c.id = ru.company_id WHERE ru.user_id = $1',
                [userId]
            );
            console.log('公司关联信息:', companyResult.rows);
        }
    } catch (error) {
        console.error('查询错误:', error);
    } finally {
        await client.end();
    }
}

checkUserCompany();