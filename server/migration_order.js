const db = require('./db');

const addPositionColumn = async () => {
  try {
    console.log('Adding position column to habits table...');
    await db.query(`
      ALTER TABLE habits 
      ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;
    `);

    // Actualizar las posiciones actuales para que coincidan con su orden de creación (id)
    const result = await db.query('SELECT id FROM habits ORDER BY created_at ASC');
    const habits = result.rows;
    for (let i = 0; i < habits.length; i++) {
        await db.query('UPDATE habits SET position = $1 WHERE id = $2', [i, habits[i].id]);
    }
    console.log('✅ Column added and positions initialized.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating DB:', error);
    process.exit(1);
  }
};

addPositionColumn();
