import { Router } from 'express';
import { login, logout, me, listLeads, stats, updateLead } from '../controllers/admin.js';
import { requireAuth } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/rateLimits.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, adminLeadsQuerySchema, leadStatusSchema } from '../validators/admin.js';
import { z } from 'zod';
import { positiveId } from '../validators/common.js';

const router = Router();
const idSchema = z.object({ id: positiveId });

router.post('/admin/login', loginRateLimit, validate(loginSchema), login);
router.post('/admin/logout', requireAuth, logout);
router.get('/admin/me', requireAuth, me);
router.get('/admin/leads', requireAuth, validate(adminLeadsQuerySchema, 'query'), listLeads);
router.get('/admin/stats', requireAuth, stats);
router.patch('/admin/leads/:id', requireAuth, validate(idSchema, 'params'), validate(leadStatusSchema), updateLead);

export default router;
