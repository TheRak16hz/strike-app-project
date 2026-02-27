-- Migración para Strike v2.0

-- 1. Añadir campos para días específicos (0=Dom, 1=Lun, ..., 6=Sab)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_days VARCHAR(50) DEFAULT '[]'; 

-- 2. Añadir campos para hábitos cuantificables
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_quantifiable BOOLEAN DEFAULT false;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 1;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT '';
