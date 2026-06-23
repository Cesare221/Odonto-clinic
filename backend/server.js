import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { isAllowedClientOrigin } from './config/runtime.js';

import { apiLimiter } from './middleware/rateLimiter.js';
import errorHandler, { notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import transactionRoutes from './routes/transactions.js';
import treatmentRoutes from './routes/treatments.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

// Trust proxy when running behind Railway / Vercel / any reverse proxy
// This is required for express-rate-limit to read the real client IP from X-Forwarded-For
app.set('trust proxy', 1);

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://viacep.com.br"],
    }
  }
}));

// CORS com origens configuráveis e credentials
const corsOptions = {
  origin(origin, callback) {
    if (isAllowedClientOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origem não permitida pelo CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' })); // Limita tamanho do payload
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting global
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Servidor operacional',
    timestamp: new Date().toISOString()
  });
});

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/admin', adminRoutes);

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== SERVER START =====
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando em modo ${process.env.NODE_ENV || 'development'} na porta ${PORT}`);
  });
};

startServer();
