const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finance');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // En producción puedes cambiarlo por la URL de tu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-timezone']
}));
app.use(express.json());

// Auto-migrate position column and tags column if they don't exist
db.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;')
  .catch(err => console.error('Migration error (position):', err));
db.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS "tags" TEXT DEFAULT \'\';')
  .catch(err => console.error('Migration error (tags):', err));
db.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS "is_one_time" BOOLEAN DEFAULT FALSE;')
  .catch(err => console.error('Migration error (is_one_time):', err));
db.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS "reminder_date" DATE;')
  .catch(err => console.error('Migration error (reminder_date):', err));

// Savings Goals Table
db.query(`
  CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    deadline DATE,
    color TEXT DEFAULT 'var(--primary)',
    icon TEXT DEFAULT '💰',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error('Migration error (savings_goals):', err));

// Transactions Table
db.query(`
  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    category TEXT NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    goal_id INTEGER REFERENCES savings_goals(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error('Migration error (transactions):', err));

// Add currency column if it doesn't exist (for existing tables)
db.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT \'USD\';')
  .catch(err => console.error('Migration error (transactions currency):', err));

db.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "source" TEXT;')
  .catch(err => console.error('Migration error (transactions source):', err));

// User Settings Table (for exchange rates, etc.)
db.query(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error('Migration error (user_settings):', err));

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/finance', financeRoutes);

// Servir archivos estáticos del cliente (Vite dist) para producción/fallback
app.use(express.static(path.join(__dirname, '../client/dist')));

// Endpoint de salud 
app.get('/api/health', (req, res) => {
    res.status(200).send('Servidor Despierto 🚀');
});

// Vercel Cron Endpoint: Se ejecuta automáticamente 1 vez al día (00:00 UTC)
app.get('/api/cron', async (req, res) => {
  // Verificamos el header de autorización que Vercel inyecta (CRON_SECRET)
  // para asegurarnos de que nadie más llame a esta ruta accidentalmente o maliciosamente.
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized execution.');
  }
  
  try {
    // Aquí puedes incluir cualquier otra lógica que quisieras que corra automáticamente
    // Por ahora, el chequeo diario se hace cuando el usuario consulta sus hábitos en routes/habits.js
    res.status(200).send('Cron ejecutado (Actualización pendiente).');
  } catch (error) {
    console.error('Error ejecutando cron manual:', error);
    res.status(500).send('Hubo un error al procesar el cron.');
  }
});

// Cualquier otra ruta no-API debe servir el index.html del frontend (SPA Fallback)
// Usamos una expresión regular para atrapar todo lo que no sea una ruta de la API
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

// Exportamos la app para Vercel Serverless Functions
module.exports = app;
