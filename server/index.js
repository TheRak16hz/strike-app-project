const express = require('express');
const cors = require('cors');
require('dotenv').config();
const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

// Endpoint de salud para que Render no se duerma
app.get('/api/health', (req, res) => {
    res.status(200).send('Servidor Despierto 🚀');
});

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);

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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

// Exportamos la app para Vercel Serverless Functions
module.exports = app;
