## Key Performance Tips for Raspberry Pi:

- Use --max-old-space-size to limit memory: node --max-old-space-size=512 build.js
- Batch processing prevents memory exhaustion
- Worker threads > cluster module for I/O-heavy tasks
- Avoid blocking operations in the main thread
- Cache parsed results if rebuilding frequently
- Use Promise.allSettled over Promise.all for resilience
- Monitor with process.memoryUsage() to tune batch sizes
