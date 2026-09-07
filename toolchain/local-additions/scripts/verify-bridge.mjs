import assert from 'node:assert/strict';
import WebSocket from 'ws';

const port = Number(process.argv[2] || 49620);
const base = `http://127.0.0.1:${port}`;
const healthResponse = await fetch(`${base}/health`);
assert.equal(healthResponse.status, 200);
assert.equal(healthResponse.headers.get('access-control-allow-origin'), null);
assert.equal((await healthResponse.json()).service, 'easyeda-bridge');

for (const headers of [{ Origin: 'https://example.invalid' }, { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
  const response = await fetch(`${base}/execute`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'return 1;' }),
  });
  assert.equal(response.status, 403, JSON.stringify(headers));
}

function verifyWs(path, origin, expectedStatus) {
  return new Promise((resolve, reject) => {
    const options = { handshakeTimeout: 2000 };
    if (origin !== undefined) options.origin = origin;
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`, options);
    ws.on('message', raw => {
      try {
        assert.equal(expectedStatus, 101, `${path} unexpectedly connected`);
        assert.equal(JSON.parse(raw.toString()).service, 'easyeda-bridge');
        ws.close();
        resolve();
      } catch (error) { ws.close(); reject(error); }
    });
    ws.on('unexpected-response', (_req, response) => {
      response.resume();
      ws.terminate();
      try { assert.equal(response.statusCode, expectedStatus); resolve(); }
      catch (error) { reject(error); }
    });
    ws.on('error', error => {
      if (!error.message.includes('closed before the connection was established')) reject(error);
    });
  });
}

await verifyWs('/agent', undefined, 101);
await verifyWs('/agent', 'https://example.invalid', 403);
await verifyWs('/agent', 'null', 403);
await verifyWs('/eda', 'https://example.invalid', 403);
await verifyWs('/eda', 'https://client', 101);
await verifyWs('/eda', 'https://pro.lceda.cn', 101);
await verifyWs('/unexpected', undefined, 403);
console.log('PASS: health, no wildcard CORS, HTTP origin gates, WebSocket origin/path gates. No EDA project calls made.');
