/**
 * 头像路径修复脚本
 * 功能：
 * 1. 遍历所有用户的头像路径
 * 2. 检查物理文件是否存在于 /avatars/ 或 /companies_logo/ 目录下
 * 3. 自动修复存放位置错误的路径（例如：实际在 companies_logo 但数据库写着 avatars）
 * 4. 对于彻底丢失的文件，将路径重置为 null，防止浏览器 404 报错
 */

const { pool, query } = require('./config/db');
const path = require('path');
const fs = require('fs');

// 定义物理目录
const ROOT_DIR = path.join(__dirname, '../../');
const AVATARS_DIR = path.join(__dirname, '../../Front_End/public/avatars');
const LOGOS_DIR = path.join(__dirname, '../../Front_End/public/companies_logo');

async function fixAvatarPaths() {
    console.log('🚀 开始修复头像路径...');

    try {
        // 1. 获取所有有头像的用户
        const result = await query('SELECT id, name, avatar FROM users WHERE avatar IS NOT NULL AND avatar != \'\'');
        const users = result.rows;
        console.log(`📊 找到 ${users.length} 个带头像的用户记录`);

        let fixedCount = 0;
        let resetCount = 0;
        let okCount = 0;

        for (const user of users) {
            const avatarPath = user.avatar;
            const filename = path.basename(avatarPath);

            // 检查当前路径是否有效
            const currentFullPath = path.join(path.join(__dirname, '../../Front_End/public'), avatarPath);

            if (fs.existsSync(currentFullPath)) {
                okCount++;
                continue;
            }

            // 如果当前路径无效，尝试在其他目录寻找
            console.log(`\n🔍 检查用户 [${user.name}] 的失效路径: ${avatarPath}`);

            let found = false;
            const possibleLocations = [
                { dir: AVATARS_DIR, prefix: '/avatars/' },
                { dir: LOGOS_DIR, prefix: '/companies_logo/' }
            ];

            for (const loc of possibleLocations) {
                const testPath = path.join(loc.dir, filename);
                if (fs.existsSync(testPath)) {
                    const newPath = `${loc.prefix}${filename}`;
                    console.log(`✅ 找到文件！修正路径: ${avatarPath} -> ${newPath}`);

                    await query('UPDATE users SET avatar = $1 WHERE id = $2', [newPath, user.id]);
                    fixedCount++;
                    found = true;
                    break;
                }
            }

            if (!found) {
                console.log(`❌ 物理文件彻底丢失: ${filename}。重置为 NULL。`);
                await query('UPDATE users SET avatar = NULL WHERE id = $1', [user.id]);
                resetCount++;
            }
        }

        console.log('\n✨ 修复完成！');
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ 有效路径: ${okCount}`);
        console.log(`🔧 已修复路径: ${fixedCount}`);
        console.log(`🗑️ 已重置路径: ${resetCount}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    } catch (error) {
        console.error('🔴 修复过程中出错:', error);
    } finally {
        await pool.end();
    }
}

fixAvatarPaths();
