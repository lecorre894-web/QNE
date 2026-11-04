'use strict';
const http = require('http');
const os = require('os');

const PORT = 8080;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/qpu') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const cpus = os.cpus();
      const response = {
        status: 'OK',
        chipset: 'Snapdragon (SoC)',
        cores: cpus.length,
        model: cpus[0] ? cpus[0].model : 'Armv8/Armv9',
        timestamp: Date.now()
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[QPU Driver] Interface matérielle active sur http://127.0.0.1:${PORT}`);
});
