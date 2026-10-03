import { Router } from 'express';
import { listDestinations, getDestination } from '../controllers/destinations.js';
import { listPackages, getPackage } from '../controllers/packages.js';
import { listExperiences } from '../controllers/experiences.js';
import { validate } from '../middleware/validate.js';
import { packagesQuerySchema } from '../validators/packages.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' }, message: 'Healthy.' }));
router.get('/destinations', listDestinations);
router.get('/destinations/:slug', getDestination);
router.get('/packages', validate(packagesQuerySchema, 'query'), listPackages);
router.get('/packages/:slug', getPackage);
router.get('/experiences', listExperiences);

export default router;
