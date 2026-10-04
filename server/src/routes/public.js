import { Router } from 'express';
import { listDestinations, getDestination } from '../controllers/destinations.js';
import { listPackages, getPackage } from '../controllers/packages.js';
import { listExperiences } from '../controllers/experiences.js';
import { validate } from '../middleware/validate.js';
import { packagesQuerySchema } from '../validators/packages.js';
import { slugParams } from '../validators/common.js';
import { pool } from '../db/pool.js';
import { ok, fail } from '../utils/response.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' }, message: 'Healthy.' }));
router.get('/health/ready', async (req, res) => {
  try {
    await pool.query({ sql: 'SELECT 1', timeout: 3000 });
    return ok(res, { status: 'ready', database: 'connected' }, 'Ready.');
  } catch {
    return fail(res, 503, 'Service not ready.');
  }
});
router.get('/destinations', listDestinations);
router.get('/destinations/:slug', validate(slugParams, 'params'), getDestination);
router.get('/packages', validate(packagesQuerySchema, 'query'), listPackages);
router.get('/packages/:slug', validate(slugParams, 'params'), getPackage);
router.get('/experiences', listExperiences);

export default router;
