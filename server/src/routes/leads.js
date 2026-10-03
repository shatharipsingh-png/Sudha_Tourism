import { Router } from 'express';
import { createLead } from '../controllers/leads.js';
import { validate } from '../middleware/validate.js';
import { leadsRateLimit } from '../middleware/rateLimits.js';
import { leadSchema } from '../validators/leads.js';

const router = Router();
router.post('/leads', leadsRateLimit, validate(leadSchema), createLead);
export default router;
