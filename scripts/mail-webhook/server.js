#!/usr/bin/env node
/**
 * Mail Server Webhook - Creates mailboxes via docker-mailserver
 *
 * Run on your mail server (172.86.89.39):
 * 1. Copy to /opt/mailserver/webhook/
 * 2. node server.js
 *
 * Or use systemd - see README.md
 */
const http = require('http');
const { exec } = require('child_process');
const PORT = process.env.PORT || 3333;
const API_KEY = process.env.MAIL_WEBHOOK_API_KEY || 'change-me-in-production';
const SETUP_PATH = process.env.SETUP_PATH || '/opt/mailserver';
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}
function executeSetup(args) {
  return new Promise((resolve, reject) => {
    const cmd = `cd ${SETUP_PATH} && ./setup.sh ${args}`;
    console.log(`[Webhook] Executing: ${cmd}`);
    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Webhook] Error: ${stderr || error.message}`);
        reject(new Error(stderr || error.message));
      } else {
        console.log(`[Webhook] Success: ${stdout}`);
        resolve(stdout);
      }
    });
  });
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    console.log(`[Webhook] Invalid API key`);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }
  try {
    const body = await parseBody(req);
    const { action, email, password } = body;
    console.log(`[Webhook] Action: ${action}, Email: ${email}`);
    if (!action || !email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing action or email' }));
    }
    let result;
    switch (action) {
      case 'create':
        if (!password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing password' }));
        }
        const escapedPassword = password.replace(/'/g, "'\\''");
        result = await executeSetup(`email add ${email} '${escapedPassword}'`);
        break;
      case 'delete':
        result = await executeSetup(`email del ${email}`);
        break;
      case 'list':
        result = await executeSetup('email list');
        break;
      default:
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Unknown action: ${action}` }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: result.trim() }));
  } catch (error) {
    console.error(`[Webhook] Error:`, error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Webhook] Mail webhook running on port ${PORT}`);
  console.log(`[Webhook] Setup path: ${SETUP_PATH}`);
});
