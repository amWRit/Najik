// server.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const certDir = path.join(__dirname, 'cert');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost-cert.pem');

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  const server = express();

  // Serve static files (including service worker)
  server.use(express.static(path.join(__dirname, 'public')));


  // Next.js request handler (Express 5+ wildcard fix)
  server.use((req, res) => {
    return handle(req, res);
  });

  https.createServer(httpsOptions, server).listen(3001, () => {
    console.log('> HTTPS server ready on https://localhost:3001');
  });
});
