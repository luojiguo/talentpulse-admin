
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api'; // Assuming the backend runs on port 3001

async function testGetAllJobs() {
    console.log('--- Testing GET /api/jobs (with pagination) ---');
    const startTime = Date.now();
    try {
        const response = await fetch(`${API_BASE_URL}/jobs?page=1&limit=10`);
        const data = await response.json();
        const duration = Date.now() - startTime;
        console.log(`Status: ${response.status}`);
        console.log(`Response time: ${duration}ms`);
        console.log(`Total jobs: ${data.total}`);
        console.log(`Fetched jobs: ${data.data.length}`);
        console.log('--------------------------------------------------');
        return duration;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Error after ${duration}ms:`, error.message);
        console.log('--------------------------------------------------');
        return duration;
    }
}

async function testGetRecommendedJobs(userId) {
    console.log(`--- Testing GET /api/jobs/recommended/${userId} (async) ---`);
    let startTime = Date.now();
    try {
        // Initial request
        const initialResponse = await fetch(`${API_BASE_URL}/jobs/recommended/${userId}?useAI=true`);
        let duration = Date.now() - startTime;
        console.log(`Initial request status: ${initialResponse.status}`);
        console.log(`Initial response time: ${duration}ms`);
        const initialData = await initialResponse.json();
        console.log(`Initial response message: ${initialData.message}`);
        console.log(`Returned ${initialData.count} keyword-matched jobs immediately.`);

        // Polling for AI result
        console.log('Polling for AI results...');
        startTime = Date.now();
        let pollCount = 0;
        let isCompleted = false;
        while (pollCount < 15 && !isCompleted) { // Poll for max 30 seconds
            pollCount++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s between polls
            const statusResponse = await fetch(`${API_BASE_URL}/jobs/recommended/${userId}/status`);
            const statusData = await statusResponse.json();
            duration = Date.now() - startTime;
            console.log(`Poll #${pollCount}: Status is '${statusData.status}' after ${duration}ms`);
            if (statusData.status === 'completed') {
                isCompleted = true;
                console.log(`AI recommendations received! Total jobs: ${statusData.count}`);
            } else if (statusData.status === 'failed') {
                isCompleted = true;
                console.error('AI recommendation failed.');
            }
        }
        duration = Date.now() - startTime;
        console.log(`Total polling time: ${duration}ms`);
        if (!isCompleted) {
            console.log('Polling timed out after 30 seconds.');
        }

        console.log('--------------------------------------------------');
        return duration;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Error after ${duration}ms:`, error.message);
        console.log('--------------------------------------------------');
        return duration;
    }
}

async function runTests() {
    console.log('Starting performance verification tests...\n');
    
    // I will need a userId to test, I will assume 1 exists. 
    const TEST_USER_ID = 1; 

    await testGetAllJobs();
    await testGetRecommendedJobs(TEST_USER_ID);

    console.log('\nPerformance verification tests finished.');
}

runTests();
