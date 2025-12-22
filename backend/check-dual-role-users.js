const { Client } = require('pg');

async function checkDualRoleUsers() {
    const client = new Client({
        connectionString: 'postgresql://postgres:123456@localhost:5432/Talent'
    });
    
    try {
        await client.connect();
        
        // 查询同时拥有求职者和招聘者角色的用户
        const dualRoleUsersQuery = `
            SELECT u.id, u.name, u.email, u.phone
            FROM users u
            WHERE EXISTS (
                SELECT 1 FROM user_roles ur1 WHERE ur1.user_id = u.id AND ur1.role = 'candidate'
            ) AND EXISTS (
                SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = u.id AND ur2.role = 'recruiter'
            )
            ORDER BY u.id;
        `;
        
        const dualRoleUsersResult = await client.query(dualRoleUsersQuery);
        console.log('=== 同时拥有求职者和招聘者两种身份的用户 ===');
        console.log('总计:', dualRoleUsersResult.rows.length, '个用户');
        console.log('详细信息:');
        dualRoleUsersResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, 姓名: ${user.name}, 邮箱: ${user.email}, 电话: ${user.phone}`);
        });
        
        // 可选：查询所有用户的角色分布
        console.log('\n=== 所有用户的角色分布 ===');
        const roleDistributionQuery = `
            SELECT u.id, u.name, u.email, ARRAY_AGG(ur.role) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            GROUP BY u.id, u.name, u.email
            ORDER BY u.id;
        `;
        
        const roleDistributionResult = await client.query(roleDistributionQuery);
        roleDistributionResult.rows.forEach((user) => {
            console.log(`ID: ${user.id}, 姓名: ${user.name}, 邮箱: ${user.email}, 角色: [${user.roles.join(', ')}]`);
        });
        
    } catch (error) {
        console.error('查询错误:', error);
    } finally {
        await client.end();
    }
}

checkDualRoleUsers();