const { pool } = require('./config/db');

async function measureLatency() {
    console.log('正在测量数据库连接延迟...');
    const results = [];
    for (let i = 0; i < 10; i++) {
        const start = Date.now();
        const client = await pool.connect();
        const connectTime = Date.now() - start;
        
        const queryStart = Date.now();
        await client.query('SELECT 1');
        const queryTime = Date.now() - queryStart;
        
        client.release();
        results.push({ connectTime, queryTime });
        console.log(`第 ${i + 1} 次: 连接耗时 ${connectTime}ms, 查询耗时 ${queryTime}ms`);
    }
    
    const avgConnect = results.reduce((acc, r) => acc + r.connectTime, 0) / results.length;
    const avgQuery = results.reduce((acc, r) => acc + r.queryTime, 0) / results.length;
    
    console.log(`\n平均连接耗时: ${avgConnect.toFixed(2)}ms`);
    console.log(`平均查询耗时: ${avgQuery.toFixed(2)}ms`);
    
    if (avgConnect > 100) {
        console.warn('⚠️ 警告: 数据库连接延迟较高，请检查数据库主机网络。');
    }
    if (avgQuery > 50) {
        console.warn('⚠️ 警告: 简单查询耗时较高，请检查数据库负载。');
    }
    
    process.exit(0);
}

measureLatency();
