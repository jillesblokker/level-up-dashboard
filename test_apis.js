const https = require('https');

const endpoints = [
  '/api/kingdom-grid',
  '/api/kingdom-timers',
  '/api/kingdom-items',
  '/api/kingdom-tile-states',
  '/api/kingdom-stats-v2'
];

endpoints.forEach(endpoint => {
  https.get(`https://lvlup.jillesblokker.com${endpoint}`, (res) => {
    console.log(`${endpoint}: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`${endpoint}: ${e.message}`);
  });
});
