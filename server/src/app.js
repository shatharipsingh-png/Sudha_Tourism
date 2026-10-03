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

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(globalRateLimit);

app.use('/api', publicRoutes);
app.use('/api', leadRoutes);
app.use('/api', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
