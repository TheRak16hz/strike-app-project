-- Migración para Strike v3.0

-- 1. Unificar tipos de hábitos
ALTER TABLE habits ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'regular';

-- Ajustar los hábitos antiguos según si eran cuantificables
UPDATE habits SET type = 'quantifiable' WHERE is_quantifiable = true;

-- (Opcional) Eliminar la columna vieja si se desea limpiar
-- ALTER TABLE habits DROP COLUMN is_quantifiable;

-- 2. Añadir recordatorios y Emojis
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '🎯';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS reminder_time TIME NULL;
