import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import publicRoutes from './routes/public.js';
import leadRoutes from './routes/leads.js';
import adminRoutes from './routes/admin.js';
import { globalRateLimit } from './middleware/rateLimits.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import contentRoutes from './routes/content.js';
import seoRoutes from './routes/seo.js';
import { adminOrigin } from './middleware/adminOrigin.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY);
app.use(requestLogger);
app.use(helmet());
app.use((req,res,next) => {
  if (req.path.startsWith('/api/')) res.set('X-Robots-Tag','noindex, nofollow');
  if (req.path.startsWith('/api/admin/') || req.path === '/api/leads' || req.path.startsWith('/api/health')) res.set('Cache-Control','no-store');
  return next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === env.CLIENT_URL) return callback(null, true);
    const error = new Error('Origin not allowed');
    error.code = 'CORS_REJECTED';
    return callback(error);
  },
  methods:['GET','HEAD','POST','PATCH','DELETE'],
  allowedHeaders:['Content-Type'],
  exposedHeaders:['X-Request-ID'],
  credentials: true
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(adminOrigin);
app.use((req, res, next) => {
  if (req.method === 'GET' && ['/api/health', '/api/health/ready'].includes(req.path)) return next();
  return globalRateLimit(req, res, next);
});

app.use('/api', publicRoutes);
app.use('/api', leadRoutes);
app.use('/api', adminRoutes);
app.use('/api', contentRoutes);
app.use(seoRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
