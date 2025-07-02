const { invoke } = require('@tauri-apps/api/tauri');

async function testBackendConnection() {
    try {
        console.log('Testing backend connection...');
        
        // Test 1: Health check
        const healthResponse = await invoke('make_api_request', {
            url: 'http://localhost:8001/health',
            method: 'GET',
            body: null
        });
        console.log('Health check response:', healthResponse);
        
        // Test 2: Agent execution
        const agentResponse = await invoke('make_api_request', {
            url: 'http://localhost:8001/api/agents/execute',
            method: 'POST',
            body: JSON.stringify({
                task: 'Jaka jest pogoda na dziś?',
                session_id: 'test-connection'
            })
        });
        console.log('Agent response:', agentResponse);
        
        console.log('✅ Backend connection successful!');
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
    }
}

testBackendConnection(); 