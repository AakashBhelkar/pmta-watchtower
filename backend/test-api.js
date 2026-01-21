async function testApi() {
    try {
        const baseUrl = 'http://localhost:4000/api/analytics';

        console.log('--- Testing /stats ---');
        const statsRes = await fetch(`${baseUrl}/stats`);
        const stats = await statsRes.json();
        console.log(JSON.stringify(stats, null, 2));

        console.log('\n--- Testing /latency ---');
        // I'll try to catch the exact error if I can through the route if it returned one,
        // but for now let's just log the response.
        const latencyRes = await fetch(`${baseUrl}/latency`);
        const latency = await latencyRes.json();
        console.log('Latency Response:', latency);

    } catch (error) {
        console.error('API Test Error:', error.message);
    }
}

testApi();
