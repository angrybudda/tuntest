const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Health check (Render requires this for proper monitoring)
app.get('/healthz', (req, res) => res.sendStatus(200));

// WebSocket: send client IP on connect
wss.on('connection', (ws, req) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0].trim();
  ws.send(JSON.stringify({ ip }));
});

// Graceful shutdown (Render sends SIGTERM on redeploy)
process.on('SIGTERM', () => {
  wss.clients.forEach(ws => ws.close(1001, 'Server shutting down'));
  server.close(() => process.exit(0));
});

const port = process.env.PORT || 10000;
server.listen(port, () => console.log(`Listening on ${port}`));

