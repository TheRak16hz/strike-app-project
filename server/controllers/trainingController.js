const db = require('../db');

// --- Exercise Library ---
exports.getExerciseLibrary = async (req, res) => {
  try {
    const result = await db.query(
        'SELECT * FROM exercises_library WHERE user_id IS NULL OR user_id = $1 ORDER BY zone, muscle, name',
        [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener librería de ejercicios' });
  }
};

exports.createExercise = async (req, res) => {
    try {
        const { name, zone, muscle, equipment, is_compound, calories_per_rep, description } = req.body;
        const result = await db.query(
            `INSERT INTO exercises_library 
            (name, zone, muscle, equipment, is_compound, calories_per_rep, description, user_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, zone, muscle, equipment, is_compound || false, calories_per_rep || 0.5, description || '', req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al crear ejercicio personalizado' });
    }
};

exports.updateExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, zone, muscle, equipment, is_compound, calories_per_rep, description } = req.body;
        
        // In this version, we allow the user to update any exercise (including global ones)
        // Since it's a personal productivity app environment.
        const result = await db.query(
            `UPDATE exercises_library 
             SET name = $1, zone = $2, muscle = $3, equipment = $4, is_compound = $5, calories_per_rep = $6, description = $7
             WHERE id = $8 RETURNING *`,
            [name, zone, muscle, equipment, is_compound, calories_per_rep, description, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Ejercicio no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar ejercicio' });
    }
};

exports.deleteExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'DELETE FROM exercises_library WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Ejercicio no encontrado' });
        res.json({ message: 'Ejercicio eliminado' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al eliminar ejercicio' });
    }
};

// --- Routines ---
exports.getRoutines = async (req, res) => {
  try {
    const routinesResult = await db.query(
      'SELECT * FROM workout_routines WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );

    const routines = routinesResult.rows;

    for (const routine of routines) {
      const exercisesResult = await db.query(
        `SELECT re.*, el.name, el.zone, el.muscle, el.equipment, el.calories_per_rep
         FROM routine_exercises re
         JOIN exercises_library el ON re.exercise_library_id = el.id
         WHERE re.routine_id = $1
         ORDER BY re.order_index ASC`,
        [routine.id]
      );
      routine.exercises = exercisesResult.rows;
    }

    res.json(routines);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener rutinas' });
  }
};

exports.createRoutine = async (req, res) => {
  try {
    const { name, days, color, icon, exercises } = req.body;
    
    await db.query('BEGIN');

    const routineRes = await db.query(
      'INSERT INTO workout_routines (user_id, name, days, color, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, JSON.stringify(days || []), color, icon]
    );
    const routine = routineRes.rows[0];

    if (exercises && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await db.query(
          `INSERT INTO routine_exercises 
          (routine_id, exercise_library_id, target_sets, target_reps, target_weight, order_index) 
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [routine.id, ex.exercise_library_id, ex.target_sets, ex.target_reps, ex.target_weight || 0, i]
        );
      }
    }

    await db.query('COMMIT');
    
    // Fetch the complete new routine
    routine.exercises = (await db.query(
        `SELECT re.*, el.name, el.zone, el.muscle, el.equipment, el.calories_per_rep
         FROM routine_exercises re
         JOIN exercises_library el ON re.exercise_library_id = el.id
         WHERE re.routine_id = $1
         ORDER BY re.order_index ASC`,
        [routine.id]
    )).rows;

    res.json(routine);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Error al crear rutina' });
  }
};

exports.deleteRoutine = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM workout_routines WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rutina no encontrada' });
    res.json({ message: 'Rutina eliminada' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar rutina' });
  }
};

// --- Logs & Tracking ---
exports.logWorkout = async (req, res) => {
  try {
    const { routine_id, date, perceived_effort, notes, exercises } = req.body;
    
    await db.query('BEGIN');

    // 1. Calculate Calories based on executed exercises
    let totalCalories = 0;
    
    for (const ex of exercises) { // exercises contains: routine_exercise_id, actual_sets, actual_reps, actual_weight
        // We need the calories_per_rep from library
        const libData = await db.query(
            `SELECT el.calories_per_rep 
             FROM routine_exercises re 
             JOIN exercises_library el ON re.exercise_library_id = el.id 
             WHERE re.id = $1`,
             [ex.routine_exercise_id]
        );
        if (libData.rows.length > 0) {
            const calPerRep = parseFloat(libData.rows[0].calories_per_rep);
            totalCalories += calPerRep * parseFloat(ex.actual_reps) * parseFloat(ex.actual_sets);
        }
    }

    // 2. Insert Log
    const logRes = await db.query(
      `INSERT INTO workout_logs (user_id, routine_id, date, total_calories_burned, perceived_effort, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, routine_id, date || new Date(), totalCalories, perceived_effort || 5, notes || '']
    );
    const logId = logRes.rows[0].id;

    // 3. Insert specific executed exercises
    if (exercises && exercises.length > 0) {
        for (const ex of exercises) {
            await db.query(
                `INSERT INTO workout_log_exercises (log_id, routine_exercise_id, actual_sets, actual_reps, actual_weight)
                 VALUES ($1, $2, $3, $4, $5)`,
                [logId, ex.routine_exercise_id, ex.actual_sets, ex.actual_reps, ex.actual_weight || 0]
            );
        }
    }

    await db.query('COMMIT');
    res.json(logRes.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Error al registrar el entrenamiento' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logsRes = await db.query(
        `SELECT wl.*, wr.name as routine_name, wr.color, wr.icon 
         FROM workout_logs wl
         LEFT JOIN workout_routines wr ON wl.routine_id = wr.id
         WHERE wl.user_id = $1 
         ORDER BY wl.date DESC, wl.created_at DESC LIMIT 50`,
        [req.user.id]
    );

    const logs = logsRes.rows;

    for (const log of logs) {
        const exRes = await db.query(
            `SELECT wle.*, el.name, el.zone, el.muscle 
             FROM workout_log_exercises wle
             JOIN routine_exercises re ON wle.routine_exercise_id = re.id
             JOIN exercises_library el ON re.exercise_library_id = el.id
             WHERE wle.log_id = $1`,
             [log.id]
        );
        log.exercises = exRes.rows;
    }

    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener el historial' });
  }
};
