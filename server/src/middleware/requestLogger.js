import { randomUUID } from 'node:crypto';
export function requestLogger(req, res, next) {
  req.requestId = randomUUID();
  res.set('X-Request-ID', req.requestId);
  const start = performance.now();
  res.on('finish', () => {
    // Express clears baseUrl when an error escapes a router. The fixed API
    // mount prefix keeps error logs accurate without logging supplied values.
    const path = req.route ? `${req.originalUrl.startsWith('/api/') ? '/api' : ''}${req.route.path}` : '[unmatched]';
    console.log(JSON.stringify({
      requestId:req.requestId, method: req.method, path, status: res.statusCode,
      durationMs: Math.round(performance.now() - start)
    }));
  });
  next();
}
