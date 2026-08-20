/**
 * LaboraGT Backend - Servidor principal
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const permissionRoutes = require('./routes/permissions');
const { ahoraGT, TZ } = require('./utils/time');
const data = require('./repositories');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Demasiadas solicitudes. Intente más tarde.' }
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Demasiados intentos de autenticación.' }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  const gt = ahoraGT();
  res.json({
    status: 'ok',
    service: 'LaboraGT API',
    version: '0.2.0',
    timezone: TZ,
    hora_guatemala: gt.fecha_hora,
    data_source: data.dataSource || 'mock',
    data_ready: typeof data.isReady === 'function' ? data.isReady() : true,
    timestamp_utc: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/permissions', permissionRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

app.listen(PORT, () => {
  const gt = ahoraGT();
  console.log(`LaboraGT API en puerto ${PORT}`);
  console.log(`Zona horaria: ${TZ} · ${gt.fecha_hora}`);
  console.log(`Fuente de datos: ${data.dataSource || 'mock'}`);
});

module.exports = app;
