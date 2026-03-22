/**
 * HomeNest Dashboard API Proxy
 * Proxies requests to Home Assistant, keeping the token server-side.
 * Also serves camera MJPEG streams.
 */
import http from 'http';
import https from 'https';

const HA_URL = 'http://homeassistant.local:8123';
const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjNjQ1OGFlMDVmMzM0MGM3YmZjZmJmNzgxMTdhYjQ2MSIsImlhdCI6MTc3MTQ3MDc0MiwiZXhwIjoyMDg2ODMwNzQyfQ.Kk2xCkX6UMLOCss6LcWxgpmDF7oatYv8yIn_8FX7m2Q';
const PORT = 3200;

function proxyToHA(path, res, method = 'GET', body = null) {
  const url = new URL(path, HA_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method,
    headers: {
      'Authorization': `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, (haRes) => {
    // For camera streams, pipe directly
    if (haRes.headers['content-type']?.includes('multipart')) {
      res.writeHead(haRes.statusCode, {
        'Content-Type': haRes.headers['content-type'],
        'Access-Control-Allow-Origin': '*',
      });
      haRes.pipe(res);
      return;
    }

    let data = '';
    haRes.on('data', chunk => data += chunk);
    haRes.on('end', () => {
      res.writeHead(haRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end(data);
    });
  });

  req.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: err.message }));
  });

  if (body) req.write(body);
  req.end();
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /api/states — all entities
  if (url.pathname === '/api/states') {
    proxyToHA('/api/states', res);
    return;
  }

  // POST /api/services/{domain}/{service} — call a service (toggle light etc)
  if (url.pathname.startsWith('/api/services/')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      proxyToHA(url.pathname, res, 'POST', body);
    });
    return;
  }

  // GET /api/camera_proxy/{entity_id} — camera snapshot
  if (url.pathname.startsWith('/api/camera_proxy/')) {
    const entityId = url.pathname.split('/').pop();
    const haUrl = new URL(`/api/camera_proxy/${entityId}`, HA_URL);
    const options = {
      hostname: haUrl.hostname,
      port: haUrl.port,
      path: haUrl.pathname,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${HA_TOKEN}` },
    };
    const haReq = http.request(options, (haRes) => {
      res.writeHead(haRes.statusCode, {
        'Content-Type': haRes.headers['content-type'] || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
      });
      haRes.pipe(res);
    });
    haReq.on('error', () => {
      res.writeHead(502);
      res.end('Camera unavailable');
    });
    haReq.end();
    return;
  }

  // GET /api/camera_proxy_stream/{entity_id} — MJPEG stream
  if (url.pathname.startsWith('/api/camera_proxy_stream/')) {
    const entityId = url.pathname.split('/').pop();
    const haUrl = new URL(`/api/camera_proxy_stream/${entityId}`, HA_URL);
    const options = {
      hostname: haUrl.hostname,
      port: haUrl.port,
      path: haUrl.pathname,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${HA_TOKEN}` },
    };
    const haReq = http.request(options, (haRes) => {
      res.writeHead(200, {
        'Content-Type': haRes.headers['content-type'] || 'multipart/x-mixed-replace; boundary=frame',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });
      haRes.pipe(res);
      res.on('close', () => haRes.destroy());
    });
    haReq.on('error', () => {
      res.writeHead(502);
      res.end('Stream unavailable');
    });
    haReq.end();
    return;
  }

  // GET /api/states/{entity_id} — single entity
  if (url.pathname.startsWith('/api/states/')) {
    proxyToHA(url.pathname, res);
    return;
  }

  // POST /api/states/{entity_id} — update entity state
  if (req.method === 'POST' && url.pathname.startsWith('/api/states/')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => proxyToHA(url.pathname, res, 'POST', body));
    return;
  }

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ha_url: HA_URL }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HomeNest API Proxy on :${PORT} → ${HA_URL}`);
});
