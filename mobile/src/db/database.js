import * as SQLite from 'expo-sqlite';

let dbPromise = null;

export const getDb = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('strike.db');
  }
  return await dbPromise;
};

export const initDB = async () => {
  try {
    const db = await getDb();
    
    // Configurar pragmas para mejor rendimiento
    await db.execAsync(`PRAGMA journal_mode = WAL;`);

    // Crear tabla de hábitos (basado en v3.0)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        frequency_type TEXT DEFAULT 'daily',
        frequency_count INTEGER DEFAULT 1,
        color TEXT DEFAULT '#3b82f6',
        target_days TEXT DEFAULT '[]',
        type TEXT DEFAULT 'regular',
        target_value INTEGER DEFAULT 1,
        unit TEXT DEFAULT '',
        icon TEXT DEFAULT '🎯',
        reminder_time TEXT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de registros (logs)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        log_date TEXT NOT NULL,
        completed_count INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database', error);
  }
};
