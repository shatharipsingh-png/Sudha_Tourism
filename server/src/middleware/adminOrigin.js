import { env } from '../config/env.js';
import { fail } from '../utils/response.js';
export function adminOrigin(req, res, next) {
  // Cookie-bearing writes must carry the exact approved browser Origin.
  // This supplements Strict cookies and CORS; it does not replace authorization.
  if (
    req.path.startsWith('/api/admin/') &&
    ['POST', 'PATCH', 'DELETE'].includes(req.method) &&
    req.cookies?.st_admin &&
    req.get('Origin') !== env.CLIENT_URL
  )
    return fail(res, 403, 'Origin not allowed.');
  return next();
}
