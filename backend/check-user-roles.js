const { Client } = require('pg');

async function checkUserRoles() {
    const client = new Client({
        connectionString: 'postgresql://postgres:123456@localhost:5432/Talent'
    });
    
    try {
        await client.connect();
        
        // 查询于吉用户的信息
        const userResult = await client.query('SELECT id, name, email FROM users WHERE name = $1', ['于吉']);
        console.log('用户信息:', userResult.rows);
        
        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            console.log('用户ID:', userId);
            
            // 查询用户的角色
            const rolesResult = await client.query(
                'SELECT role FROM user_roles WHERE user_id = $1',
                [userId]
            );
            console.log('用户角色:', rolesResult.rows);
            
            // 查询用户的招聘者信息
            const recruiterResult = await client.query(
                'SELECT ru.*, c.name AS company_name, c.is_verified FROM recruiter_user ru JOIN companies c ON ru.company_id = c.id WHERE ru.user_id = $1',
                [userId]
            );
            console.log('招聘者信息:', recruiterResult.rows);
        }
    } catch (error) {
        console.error('查询错误:', error);
    } finally {
        await client.end();
    }
}

checkUserRoles();