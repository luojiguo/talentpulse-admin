// 修复招聘者数据脚本
// 确保recruiter_user表中的每个用户都在recruiters表中有对应记录

const { pool } = require('./src/config/db');

async function fixRecruiterData() {
    try {
        console.log('开始修复招聘者数据...');
        
        // 1. 获取所有recruiter_user记录
        const recruiterUserResult = await pool.query(
            'SELECT user_id, company_id, is_verified, created_at FROM recruiter_user'
        );
        
        const recruiterUsers = recruiterUserResult.rows;
        console.log(`找到 ${recruiterUsers.length} 条recruiter_user记录`);
        
        // 2. 获取所有recruiters记录的user_id列表
        const recruitersResult = await pool.query(
            'SELECT user_id FROM recruiters'
        );
        
        const existingRecruiterUserIds = new Set(
            recruitersResult.rows.map(row => row.user_id)
        );
        console.log(`recruiters表中已有 ${existingRecruiterUserIds.size} 个用户`);
        
        // 3. 找出需要插入的记录
        const missingRecruiters = recruiterUsers.filter(
            recruiterUser => !existingRecruiterUserIds.has(recruiterUser.user_id)
        );
        
        console.log(`需要插入 ${missingRecruiters.length} 条记录到recruiters表`);
        
        // 4. 批量插入缺失的记录
        if (missingRecruiters.length > 0) {
            const insertQuery = `
                INSERT INTO recruiters (user_id, company_id, is_verified, created_at, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            `;
            
            for (const recruiter of missingRecruiters) {
                await pool.query(insertQuery, [
                    recruiter.user_id,
                    recruiter.company_id,
                    recruiter.is_verified,
                    recruiter.created_at
                ]);
            }
            
            console.log(`成功插入 ${missingRecruiters.length} 条记录到recruiters表`);
        }
        
        // 5. 检查修复后的结果
        const finalRecruitersResult = await pool.query(
            'SELECT COUNT(*) FROM recruiters'
        );
        
        console.log(`修复完成！recruiters表中现在有 ${finalRecruitersResult.rows[0].count} 条记录`);
        
        // 6. 检查是否有重复记录
        const duplicateCheckResult = await pool.query(
            `SELECT user_id, COUNT(*) as count 
             FROM recruiters 
             GROUP BY user_id 
             HAVING COUNT(*) > 1`
        );
        
        if (duplicateCheckResult.rows.length > 0) {
            console.log('警告：recruiters表中存在重复记录：');
            console.log(duplicateCheckResult.rows);
        } else {
            console.log('✅ recruiters表中没有重复记录');
        }
        
    } catch (error) {
        console.error('修复招聘者数据失败：', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// 执行修复脚本
fixRecruiterData();
