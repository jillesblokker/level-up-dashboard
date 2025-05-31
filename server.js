const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
// Always use port 3005 for consistency
const PORT = 3005;

// Initialize Next.js
const app = next({ dev, hostname, port: PORT });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      if (typeof window !== 'undefined') {
        // IndexedDB/Dexie code here
      }
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${PORT}`);
  });
}); 