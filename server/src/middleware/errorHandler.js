import { fail } from '../utils/response.js';

export function notFound(req, res) {
  return fail(res, 404, 'Route not found.');
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  return fail(res, 500, 'Something went wrong.');
}
