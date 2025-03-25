const express = require("express");
const { ExpressPeerServer } = require("peer");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 9000;
const HOST = "0.0.0.0"; // Listen on all interfaces

app.use(cors({
  origin: 'https://ai-mock-interview-ten-omega.vercel.app', // Adjust for your client
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.static("public"));

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/myapp',
  allow_discovery: true,
  alive_timeout: 60000,
  expire_timeout: 10000,
  concurrent_limit: 2,
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
});

// Map to store peers per call: callId -> Set of peerIds
const activeCalls = new Map();

peerServer.on('connection', (client) => {
  const peerId = client.getId();
  const callId = peerId.split('-')[0] || 'default';

  console.log(`[${new Date().toISOString()}] Checking connection for peer: ${peerId}`);

  // Get or initialize the set of peers for this call
  let peers = activeCalls.get(callId);
  if (!peers) {
    peers = new Set();
    activeCalls.set(callId, peers);
  }

  // Check if call is full
  if (peers.size >= 2) {
    console.log(`[${new Date().toISOString()}] Call ${callId} is full (${peers.size} connections)`);
    client.close();
    return;
  }

  // Add peer to the call
  peers.add(peerId);
  console.log(`[${new Date().toISOString()}] Peer connected: ${peerId}`);
  console.log(`[${new Date().toISOString()}] Call ${callId} has ${peers.size} peer(s)`);
});

peerServer.on('disconnect', (client) => {
  const peerId = client.getId();
  const callId = peerId.split('-')[0] || 'default';
  const peers = activeCalls.get(callId);

  if (peers) {
    peers.delete(peerId);
    if (peers.size === 0) {
      activeCalls.delete(callId);
      console.log(`[${new Date().toISOString()}] Call ${callId} ended (no participants)`);
    } else {
      console.log(`[${new Date().toISOString()}] Call ${callId} has ${peers.size} peer(s) remaining`);
    }
  }
  console.log(`[${new Date().toISOString()}] Peer disconnected: ${peerId}`);
});

peerServer.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] PeerJS Error:`, err);
});

app.use('/myapp', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] HTTP request to /myapp: ${req.method} ${req.url}`);
  next();
}, peerServer);

// Endpoint to get peers in a call
app.get('/myapp/peers/:callId', (req, res) => {
  const callId = req.params.callId;
  const peersSet = activeCalls.get(callId) || new Set();
  const peers = Array.from(peersSet).map(id => ({ id }));
  console.log(`[${new Date().toISOString()}] Returning peers for call ${callId}:`, peers);
  res.json({ peers });
});

app.get('/', (req, res) => {
  res.status(200).send('PeerJS Server is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    activeCalls: activeCalls.size,
    totalConnections: Array.from(activeCalls.values()).reduce((sum, peers) => sum + peers.size, 0),
    uptime: process.uptime()
  });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Server Error:`, err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, HOST, () => {
  console.log(`[${new Date().toISOString()}] PeerJS server running on http://${HOST}:${PORT}/myapp`);
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Shutting down server...`);
  server.close(() => {
    console.log(`[${new Date().toISOString()}] Server shut down`);
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
});
