// const db = require('./db');

// const resetDatabase = async () => {
//   try {
//     console.log('Empezando reset de la base de datos para Auth...');

//     const createTablesQuery = `
//       -- Borrar tablas antiguas
//       DROP TABLE IF EXISTS habit_logs CASCADE;
//       DROP TABLE IF EXISTS habits CASCADE;
//       DROP TABLE IF EXISTS users CASCADE;

//       -- Crear tabla de usuarios
//       CREATE TABLE users (
//           id SERIAL PRIMARY KEY,
//           username VARCHAR(100) UNIQUE NOT NULL,
//           password_hash VARCHAR(255) NOT NULL,
//           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       );

//       -- Crear tabla de Hábitos con referencia al usuario
//       CREATE TABLE habits (
//           id SERIAL PRIMARY KEY,
//           user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
//           title VARCHAR(255) NOT NULL,
//           description TEXT,
//           frequency_type VARCHAR(50) NOT NULL DEFAULT 'daily',
//           frequency_count INTEGER NOT NULL DEFAULT 1,
//           color VARCHAR(50) DEFAULT 'var(--primary)',
//           target_days VARCHAR(50) DEFAULT '[]', 
//           type VARCHAR(50) DEFAULT 'regular',
//           target_value INTEGER DEFAULT 1,
//           unit VARCHAR(50) DEFAULT '',
//           icon VARCHAR(50) DEFAULT '🎯',
//           reminder_time TIME,
//           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       );

//       -- Crear tabla de Registros de cumplimiento
//       CREATE TABLE habit_logs (
//           id SERIAL PRIMARY KEY,
//           habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
//           log_date DATE NOT NULL DEFAULT CURRENT_DATE,
//           completed_count INTEGER NOT NULL DEFAULT 1,
//           UNIQUE(habit_id, log_date)
//       );

//       -- Crear los índices de la base de datos (Para velocidad de lectura)
//       CREATE INDEX idx_habit_logs_date ON habit_logs(log_date);
//       CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
//       CREATE INDEX idx_habits_user_id ON habits(user_id);
//     `;

//     await db.query(createTablesQuery);
//     console.log('✅ Base de datos recreada exitosamente con autenticación multiusuario.');
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error recreando la BD:', error);
//     process.exit(1);
//   }
// };

// resetDatabase();
