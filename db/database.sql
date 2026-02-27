-- 1. Crear tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de Hábitos
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    frequency_type VARCHAR(50) NOT NULL DEFAULT 'daily',
    frequency_count INTEGER NOT NULL DEFAULT 1,
    color VARCHAR(50) DEFAULT 'var(--primary)',
    target_days VARCHAR(50) DEFAULT '[]', 
    type VARCHAR(50) DEFAULT 'regular',
    target_value INTEGER DEFAULT 1,
    unit VARCHAR(50) DEFAULT '',
    icon VARCHAR(50) DEFAULT '🎯',
    reminder_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear tabla de Registros de cumplimiento
CREATE TABLE IF NOT EXISTS habit_logs (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(habit_id, log_date)
);

-- 4. Crear los índices de la base de datos (Para velocidad de lectura)
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
