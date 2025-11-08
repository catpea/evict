import { createServer } from 'node:http';

const PORT = 3000;

const server = createServer((req, res) => {
  // Parse URL and query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const params = url.searchParams;

  // Set common headers
  res.setHeader('Content-Type', 'application/json');

  // Route handling
  switch (path) {
    case '/':
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Welcome to the tiny HTTP server!',
        endpoints: ['/hello', '/user', '/search']
      }));
      break;

    case '/hello':
      const name = params.get('name') || 'World';
      res.writeHead(200);
      res.end(JSON.stringify({
        greeting: `Hello, ${name}!`
      }));
      break;

    case '/user':
      const userId = params.get('id');
      const role = params.get('role') || 'guest';

      if (!userId) {
        res.writeHead(400);
        res.end(JSON.stringify({
          error: 'Missing required parameter: id'
        }));
        break;
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        userId,
        role,
        timestamp: new Date().toISOString()
      }));
      break;

    case '/search':
      const query = params.get('q');
      const limit = parseInt(params.get('limit') || '10');
      const page = parseInt(params.get('page') || '1');

      res.writeHead(200);
      res.end(JSON.stringify({
        query,
        limit,
        page,
        results: `Found results for "${query}"`
      }));
      break;

    default:
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Route not found',
        path
      }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('\nTry these URLs:');
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  http://localhost:${PORT}/hello?name=Alice`);
  console.log(`  http://localhost:${PORT}/user?id=123&role=admin`);
  console.log(`  http://localhost:${PORT}/search?q=nodejs&limit=5&page=2`);
});
