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

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY);
app.use(requestLogger);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === env.CLIENT_URL) return callback(null, true);
    const error = new Error('Origin not allowed');
    error.code = 'CORS_REJECTED';
    return callback(error);
  },
  credentials: true
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.method === 'GET' && ['/api/health', '/api/health/ready'].includes(req.path)) return next();
  return globalRateLimit(req, res, next);
});

app.use('/api', publicRoutes);
app.use('/api', leadRoutes);
app.use('/api', adminRoutes);
app.use('/api', contentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
