require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/error');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 4000;

// --- CORS ---
const allowedOrigins = (process.env.CLIENT_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  cors({
    origin: (origin, cb) => {
      // Allow REST tools / same-origin (no Origin header)
      if (!origin) return cb(null, true);
      const isSameHost = (() => {
        try {
          return new URL(origin).host === req.get('host');
        } catch {
          return false;
        }
      })();
      const isRailwayApp = (() => {
        try {
          return process.env.NODE_ENV === 'production' && new URL(origin).hostname.endsWith('.up.railway.app');
        } catch {
          return false;
        }
      })();
      if (isSameHost || isRailwayApp || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })(req, res, next);
});

app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic rate limit on auth to prevent brute-force
app.use(
  '/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) =>
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
    message: 'TeamFlow API is running',
  })
);

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes);

if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(frontendDistPath));
  app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/auth') || _req.path.startsWith('/projects') || _req.path.startsWith('/tasks') || _req.path.startsWith('/users')) {
      return next();
    }
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => logger.info(`TeamFlow API listening on :${PORT}`));
  })
  .catch((err) => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
