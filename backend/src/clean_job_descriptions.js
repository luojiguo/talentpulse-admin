// 清理数据库中已发布职位的AI生成占位符号
const { pool } = require('./config/db');

/**
 * 清理AI生成内容中的占位符号和优化排版
 * 移除 {""}, {}, *, 等AI识别生成的符号,并优化换行和格式
 */
function cleanAIGeneratedContent(text) {
    if (!text || typeof text !== 'string') return text;

    return text
        // 1. 移除各种JSON占位符
        .replace(/\{\s*""\s*\}/g, '')
        .replace(/\{\s*\}/g, '')
        .replace(/\[\s*\]/g, '')

        // 2. 移除各种引号占位符
        .replace(/\s*""\s*/g, ' ')
        .replace(/\s*''\s*/g, ' ')
        .replace(/\s*``\s*/g, ' ')

        // 3. 移除Markdown符号
        .replace(/\*\*/g, '')  // 粗体标记
        .replace(/\*/g, '')    // 斜体标记或列表符号
        .replace(/~~(.+?)~~/g, '$1')  // 删除线
        .replace(/`([^`]+)`/g, '$1')  // 行内代码

        // 4. 移除多余的特殊符号
        .replace(/[【】]/g, '')  // 中文方括号
        .replace(/[《》]/g, '')  // 书名号
        .replace(/[""]/g, '"')   // 统一引号
        .replace(/['']/g, "'")   // 统一单引号
        .replace(/…+/g, '...')   // 省略号统一
        .replace(/—+/g, '-')     // 破折号统一

        // 5. 优化换行:保留有意义的换行,移除多余的空行
        .replace(/\n{3,}/g, '\n\n')  // 最多保留一个空行
        .replace(/\r\n/g, '\n')      // 统一换行符

        // 6. 优化列表格式:确保列表项前有换行
        .replace(/([^\n])([-•·])\s*/g, '$1\n$2 ')

        // 7. 优化标题格式:确保标题前后有换行
        .replace(/([^\n])(职位描述|岗位职责|任职要求|工作职责|职责描述|加分项|福利待遇|公司福利)[:：]/g, '\n\n$2:')

        // 8. 移除行首行尾的空格
        .split('\n')
        .map(line => line.trim())
        .join('\n')

        // 9. 移除多余的空格(但保留换行)
        .replace(/ {2,}/g, ' ')

        // 10. 移除开头和结尾的空白
        .trim()

        // 11. 确保冒号后有空格(中英文冒号)
        .replace(/([：:])\s*/g, '$1 ')

        // 12. 移除重复的标点符号
        .replace(/([。！？,.!?])\1+/g, '$1');
}

async function cleanJobDescriptions() {
    const client = await pool.connect();

    try {
        console.log('开始清理职位描述中的AI占位符号...\n');

        // 获取所有包含占位符号的职位
        const result = await client.query(`
      SELECT id, title, description 
      FROM jobs 
      WHERE description LIKE '%{""}%' 
         OR description LIKE '%{}%'
         OR description LIKE '%""%'
         OR description LIKE '%*%'
      ORDER BY id
    `);

        if (result.rows.length === 0) {
            console.log('✅ 没有找到需要清理的职位描述');
            return;
        }

        console.log(`找到 ${result.rows.length} 个需要清理的职位描述\n`);

        let updatedCount = 0;

        // 逐个清理并更新
        for (const job of result.rows) {
            const cleanedDescription = cleanAIGeneratedContent(job.description);

            // 只有当清理后的内容与原内容不同时才更新
            if (cleanedDescription !== job.description) {
                await client.query(
                    'UPDATE jobs SET description = $1 WHERE id = $2',
                    [cleanedDescription, job.id]
                );

                updatedCount++;
                console.log(`✅ 已清理职位 #${job.id}: ${job.title}`);
                console.log(`   原文: ${job.description.substring(0, 100)}...`);
                console.log(`   清理后: ${cleanedDescription.substring(0, 100)}...\n`);
            }
        }

        console.log(`\n✅ 清理完成！共更新了 ${updatedCount} 个职位描述`);

    } catch (error) {
        console.error('❌ 清理过程中出错:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// 执行清理
cleanJobDescriptions()
    .then(() => {
        console.log('\n脚本执行完成');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n脚本执行失败:', error);
        process.exit(1);
    });
