import { fail } from '../utils/response.js';

export function notFound(req, res) {
  return fail(res, 404, 'Route not found.');
}
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'Malformed JSON.');
  if (err.type === 'entity.too.large') return fail(res, 413, 'Request body too large.');
  if (['request.aborted', 'request.size.invalid'].includes(err.type)) return fail(res, 400, 'Invalid request body.');
  if (['encoding.unsupported', 'charset.unsupported'].includes(err.type)) return fail(res, 415, 'Unsupported request encoding.');
  if (err.code === 'CORS_REJECTED') return fail(res, 403, 'Origin not allowed.');
  const messages = { 400: 'Invalid request.', 401: 'Unauthorized.', 403: 'Forbidden.', 404: 'Resource not found.', 413: 'Request body too large.', 429: 'Too many requests.' };
  if (err.expose === true && messages[err.status]) return fail(res, err.status, messages[err.status]);
  console.error(JSON.stringify({ event: 'request_error', status: 500 }));
  return fail(res, 500, 'Something went wrong.');
}
