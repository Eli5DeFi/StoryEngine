// Quick WebSocket test
const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:8545');

ws.on('open', function open() {
  console.log('✅ WebSocket connected!');
  
  // Send eth_blockNumber request
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  }));
});

ws.on('message', function message(data) {
  console.log('✅ Response:', data.toString());
  ws.close();
  process.exit(0);
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket disconnected');
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('⏱️ Timeout - WebSocket did not connect');
  process.exit(1);
}, 5000);
