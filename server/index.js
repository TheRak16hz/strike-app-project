const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finance');
const trainingRoutes = require('./routes/training');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // En producción puedes cambiarlo por la URL de tu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-timezone']
}));
app.use(express.json());

// Database Migrations (Sequenced)
const runMigrations = async () => {
  try {
    await db.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;');
    await db.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS "tags" TEXT DEFAULT \'\';');
    await db.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS "is_one_time" BOOLEAN DEFAULT FALSE;');
    await db.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS "reminder_date" DATE;');

    await db.query(`
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
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('income', 'expense', 'saving')) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        category TEXT NOT NULL,
        description TEXT,
        date DATE DEFAULT CURRENT_DATE,
        goal_id INTEGER REFERENCES savings_goals(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT \'USD\';');
    await db.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "source" TEXT;');

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        settings JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- TRAINING TRACKER TABLES (v3 - Enhanced Categories) ---
    // 1. Exercise Library Catalog (Enhanced)
    await db.query(`
      CREATE TABLE IF NOT EXISTS exercises_library (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        zone TEXT NOT NULL, -- e.g., 'Tren Superior', 'Tren Inferior', 'Core'
        muscle TEXT NOT NULL, -- e.g., 'Pecho', 'Glúteos'
        equipment TEXT NOT NULL, -- e.g., 'Peso Corporal', 'Mancuernas', 'Banda'
        is_compound BOOLEAN DEFAULT FALSE,
        calories_per_rep DECIMAL(8, 2) DEFAULT 0.5,
        description TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NULL -- If NULL, it's a global preset.
      );
    `);

    // Seed Initial Exercises
    const checkLibrary = await db.query('SELECT COUNT(*) FROM exercises_library');
    if (parseInt(checkLibrary.rows[0].count) === 0) {
      const initialExercises = [
        // Name, Zone, Muscle, Equipment, Is_Compound, Calories, Description
        
        // --- Peso Corporal (Calistenia) ---
        ['Flexiones (Push-ups)', 'Tren Superior', 'Pecho', 'Peso Corporal', true, 0.5, 'Flexiones de pecho regulares, activa pectorales, hombros y tríceps.'],
        ['Flexiones Declinadas', 'Tren Superior', 'Pecho', 'Peso Corporal', true, 0.6, 'Pies elevados en una silla o banco, mayor énfasis en pecho superior y hombros.'],
        ['Fondos (Dips)', 'Tren Superior', 'Tríceps', 'Peso Corporal', true, 0.8, 'Fondos en paralelas o apoyando manos atrás en una silla. Trabaja tríceps y pecho inferior.'],
        ['Dominadas (Pull-ups)', 'Tren Superior', 'Espalda', 'Peso Corporal', true, 1.0, 'Agarre prono, manos separadas. Excelente para amplitud de espalda (dorsales).'],
        ['Dominadas Supinas (Chin-ups)', 'Tren Superior', 'Espalda', 'Peso Corporal', true, 1.0, 'Agarre supino. Involucra fuertemente los bíceps además de la espalda.'],
        
        ['Sentadillas (Squats)', 'Tren Inferior', 'Piernas', 'Peso Corporal', true, 0.4, 'Sentadillas libres bajando por debajo del paralelo. Activa cuádriceps y glúteos.'],
        ['Zancadas (Lunges)', 'Tren Inferior', 'Piernas', 'Peso Corporal', true, 0.5, 'Zancadas alternas paso a paso. Requiere equilibrio y trabaja toda la pierna.'],
        ['Sentadilla Búlgara', 'Tren Inferior', 'Glúteos', 'Peso Corporal', true, 0.6, 'Sentadilla a una pierna con pie trasero elevado. Ideal para glúteo y cuádriceps.'],
        ['Puente de Glúteo', 'Tren Inferior', 'Glúteos', 'Peso Corporal', false, 0.3, 'Elevación de pelvis acostado boca arriba. Foco directo en contracción de glúteos.'],
        ['Elevación de Talones', 'Tren Inferior', 'Pantorrillas', 'Peso Corporal', false, 0.2, 'Elevaciones sobre puntas de los pies en un escalón.'],

        ['Plancha Isométrica (Seg)', 'Core', 'Abdomen', 'Peso Corporal', true, 0.05, '1 Repetición = 1 Segundo. Postura de plancha apretando todo el cuerpo.'],
        ['Crunch Abdominal', 'Core', 'Abdomen', 'Peso Corporal', false, 0.2, 'Elevación corta de tronco acostado boca arriba.'],
        ['Elevación de Piernas', 'Core', 'Abdomen', 'Peso Corporal', false, 0.3, 'Acostado o colgado, elevación de ambas piernas rectas. Trabaja zona inferior.'],
        
        // --- Mancuernas (Dumbbells) ---
        ['Press de Banca', 'Tren Superior', 'Pecho', 'Mancuernas', true, 0.6, 'Press acostado con mancuernas para pecho.'],
        ['Aperturas (Flyes)', 'Tren Superior', 'Pecho', 'Mancuernas', false, 0.4, 'Aperturas acostado, movimiento de aislamiento para pectorales.'],
        ['Press Militar (Hombros)', 'Tren Superior', 'Hombros', 'Mancuernas', true, 0.5, 'Press sobre la cabeza sentado o de pie.'],
        ['Elevaciones Laterales', 'Tren Superior', 'Hombros', 'Mancuernas', false, 0.3, 'Vuelos laterales con brazos ligeramente flexionados para deltoides medio.'],
        ['Pájaros (Deltoides Post)', 'Tren Superior', 'Hombros', 'Mancuernas', false, 0.3, 'Elevaciones laterales inclinado hacia adelante. Posterior del hombro.'],
        ['Remo con Mancuerna', 'Tren Superior', 'Espalda', 'Mancuernas', true, 0.5, 'Remo a una mano apoyado en banco/silla. Fuerza dorsal.'],
        ['Encogimientos (Trapecios)', 'Tren Superior', 'Espalda', 'Mancuernas', false, 0.3, 'Elevación de hombros sosteniendo peso.'],
        ['Curl de Bíceps', 'Tren Superior', 'Bíceps', 'Mancuernas', false, 0.3, 'Curl alterno o al mismo tiempo. Aislamiento para brazo.'],
        ['Curl Martillo', 'Tren Superior', 'Bíceps', 'Mancuernas', false, 0.3, 'Agarre neutro. Foco en braquial y antebrazo.'],
        ['Extensión de Tríceps', 'Tren Superior', 'Tríceps', 'Mancuernas', false, 0.3, 'Copa a dos manos sobre la cabeza o patada de tríceps.'],
        
        ['Goblet Squat (Mancuerna)', 'Tren Inferior', 'Piernas', 'Mancuernas', true, 0.5, 'Sentadilla sosteniendo peso frente al pecho. Mayor estabilidad.'],
        ['Peso Muerto Rumano', 'Tren Inferior', 'Femorales', 'Mancuernas', true, 0.6, 'Flexión de cadera con piernas semi-rectas. Isquiotibiales y glúteos.'],
        ['Zancadas con Mancuernas', 'Tren Inferior', 'Piernas', 'Mancuernas', true, 0.6, 'Zancadas sosteniendo el peso a los lados para mayor resistencia.']
      ];
      
      for (const ex of initialExercises) {
        await db.query(`
          INSERT INTO exercises_library (name, zone, muscle, equipment, is_compound, calories_per_rep, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (name) DO NOTHING
        `, ex);
      }
      console.log('📚 Librería de ejercicios inicializada (Categorías Mejoradas).');
    }

    // 2. Scheduled Routines
    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_routines (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        days JSONB DEFAULT '[]',
        color TEXT DEFAULT 'var(--primary)',
        icon TEXT DEFAULT '💪',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Exercises within a Routine
    await db.query(`
      CREATE TABLE IF NOT EXISTS routine_exercises (
        id SERIAL PRIMARY KEY,
        routine_id INTEGER REFERENCES workout_routines(id) ON DELETE CASCADE,
        exercise_library_id INTEGER REFERENCES exercises_library(id) ON DELETE CASCADE,
        target_sets INTEGER NOT NULL DEFAULT 3,
        target_reps INTEGER NOT NULL DEFAULT 10,
        target_weight DECIMAL(8, 2) DEFAULT 0, -- 0 for bodyweight
        order_index INTEGER DEFAULT 0
      );
    `);

    // 4. Workout Logs (Daily completion)
    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        routine_id INTEGER REFERENCES workout_routines(id) ON DELETE SET NULL,
        date DATE DEFAULT CURRENT_DATE,
        total_calories_burned DECIMAL(8, 2) DEFAULT 0,
        perceived_effort INTEGER DEFAULT 5, -- Scale 1-10
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Exercises actually performed in the log
    await db.query(`
      CREATE TABLE IF NOT EXISTS workout_log_exercises (
        id SERIAL PRIMARY KEY,
        log_id INTEGER REFERENCES workout_logs(id) ON DELETE CASCADE,
        routine_exercise_id INTEGER REFERENCES routine_exercises(id) ON DELETE SET NULL,
        actual_sets INTEGER NOT NULL,
        actual_reps INTEGER NOT NULL,
        actual_weight DECIMAL(8, 2) DEFAULT 0
      );
    `);
    console.log('✅ Migraciones completadas exitosamente.');
  } catch (err) {
    console.error('❌ Error en migraciones:', err);
  }
};

runMigrations();

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/training', trainingRoutes);

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
