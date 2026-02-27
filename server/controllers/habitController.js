const db = require('../db');

exports.getHabits = async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const habitsResult = await db.query('SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const habits = habitsResult.rows;
    
    // Traer últimos 90 días para el calendario para no saturar memoria, sólo para los hábitos del usuario actual
    const logsResult = await db.query(
      `SELECT hl.* FROM habit_logs hl 
       JOIN habits h ON hl.habit_id = h.id 
       WHERE h.user_id = $1 AND hl.log_date >= CURRENT_DATE - INTERVAL '90 days' 
       ORDER BY hl.log_date DESC`,
      [req.user.id]
    );
    const logs = logsResult.rows;

    const data = habits.map(habit => {
      // Parsear target_days si viene como string JSON
      let targetDaysArray = [];
      try {
        if (habit.target_days) {
          targetDaysArray = JSON.parse(habit.target_days);
        }
      } catch (e) {
        targetDaysArray = [];
      }

      const habitLogs = logs.filter(log => log.habit_id === habit.id);
      
      const todayLog = habitLogs.find(log => {
        const logDateStr = new Date(log.log_date).toISOString().split('T')[0];
        return logDateStr === todayStr;
      });
      
      const isQuantifiable = habit.type === 'quantifiable';
      const isInverse = habit.type === 'inverse';
      
      // La meta de hoy depende del tipo
      const target = isQuantifiable ? habit.target_value : habit.frequency_count;
      
      let completedCountToday = todayLog ? todayLog.completed_count : 0;
      let isCompletedToday = false;

      // Lógica de compleción del día actual según tipo
      if (isInverse) {
        // En los inversos asumimos completado (1) a menos que haya un flag explícito de fallo (-1)
        if (completedCountToday === -1) {
          isCompletedToday = false;
        } else {
          isCompletedToday = true;
          // count simulado para visualización
          completedCountToday = 1; 
        }
      } else {
        isCompletedToday = completedCountToday >= target;
      }
      
      // Determinar si hoy es un día objetivo (target_day)
      const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
      const isTargetDayToday = habit.frequency_type === 'specific_days' 
        ? targetDaysArray.includes(dayOfWeek)
        : true; // daily o weekly asumimos cuenta para racha general

      // Fecha de creación para no contar racha antes de existir
      const createdDate = new Date(habit.created_at);
      const createdDateStr = createdDate.toISOString().split('T')[0];

      // Cálculo de racha
      let currentStreak = 0;
      let checkDate = new Date(today);
      let streakActive = true;
      
      if (!isCompletedToday) {
        // empezamos a contar desde ayer
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Ya hizo lo de hoy, cuenta para la racha si hoy era target day
        if (isTargetDayToday) currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Recorremos hacia atrás
      while (streakActive && currentStreak < 3650) { // límite de seguridad
        const dStr = checkDate.toISOString().split('T')[0];
        
        if (dStr < createdDateStr) {
          break; // Límite alcanzado, no puede tener racha antes de la creación
        }

        const dw = checkDate.getDay();
        
        const isTarget = habit.frequency_type === 'specific_days' ? targetDaysArray.includes(dw) : true;
        
        const log = habitLogs.find(l => new Date(l.log_date).toISOString().split('T')[0] === dStr);
        let isCompleted = false;

        if (isInverse) {
          // Asumimos completado si no hay log negativo
          isCompleted = !(log && log.completed_count === -1);
        } else {
          isCompleted = log ? log.completed_count >= target : false;
        }

        if (isTarget) {
          if (isCompleted) {
            currentStreak++;
          } else {
            streakActive = false; // Se rompió en un día objetivo
          }
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Generar historial de fechas para el calendario (Días cumplidos)
      const historyDates = [];
      
      // Para regular / quantifiable
      if (!isInverse) {
        historyDates.push(...habitLogs
          .filter(log => log.completed_count >= target)
          .map(log => new Date(log.log_date).toISOString().split('T')[0]));
      } else {
        // Para INVERSOS, hay que iterar los últimos 90 días e ignorar donde haya un -1
        const endDate = new Date(today);
        let d = new Date(today);
        d.setDate(d.getDate() - 90);
        
        while (d <= endDate) {
          const ds = d.toISOString().split('T')[0];
          const dw = d.getDay();
          
          if (ds >= createdDateStr) {
            const isTarget = habit.frequency_type === 'specific_days' ? targetDaysArray.includes(dw) : true;
            
            if (isTarget) {
              const l = habitLogs.find(log => new Date(log.log_date).toISOString().split('T')[0] === ds);
              if (!l || l.completed_count !== -1) {
                historyDates.push(ds);
              }
            }
          }
          d.setDate(d.getDate() + 1);
        }
      }

      return {
        ...habit,
        target_days: targetDaysArray,
        isCompletedToday,
        completedCountToday,
        currentStreak,
        historyDates
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.createHabit = async (req, res) => {
  try {
    const { 
      title, description, frequency_type, frequency_count, color,
      target_days, type, target_value, unit, icon, reminder_time
    } = req.body;
    
    const targetDaysStr = JSON.stringify(target_days || []);
    const habitType = type || 'regular';
    
    // Convertir de booleanos v2 a tipos v3 temporalmente por retrocompatibilidad
    let finalType = habitType;
    if (req.body.is_quantifiable === true) finalType = 'quantifiable';
    
    const newHabit = await db.query(
      `INSERT INTO habits 
      (user_id, title, description, frequency_type, frequency_count, color, target_days, type, target_value, unit, icon, reminder_time) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        req.user.id, title, description || '', frequency_type || 'daily', frequency_count || 1, color || 'var(--primary)',
        targetDaysStr, finalType, target_value || 1, unit || '', icon || '🎯', reminder_time || null
      ]
    );
    res.json(newHabit.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al crear hábito' });
  }
};

exports.updateHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, frequency_type, frequency_count, color,
      target_days, type, target_value, unit, icon, reminder_time
    } = req.body;
    
    const targetDaysStr = JSON.stringify(target_days || []);
    
    let finalType = type || 'regular';
    if (req.body.is_quantifiable === true) finalType = 'quantifiable';

    const updateHabit = await db.query(
      `UPDATE habits SET 
        title = $1, description = $2, frequency_type = $3, frequency_count = $4, color = $5,
        target_days = $6, type = $7, target_value = $8, unit = $9, icon = $10, reminder_time = $11
      WHERE id = $12 AND user_id = $13 RETURNING *`,
      [
        title, description, frequency_type, frequency_count, color,
        targetDaysStr, finalType, target_value || 1, unit || '', icon || '🎯', reminder_time || null, id, req.user.id
      ]
    );
    if (updateHabit.rows.length === 0) {
      return res.status(404).json({ msg: 'Hábito no encontrado o no autorizado' });
    }
    res.json(updateHabit.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al actualizar hábito' });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteResult = await db.query('DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Hábito no encontrado o no autorizado' });
    }
    res.json({ message: 'Hábito eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar hábito' });
  }
};

exports.toggleHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body; // para incrementos numéricos o romper rachas inversas
    const today = new Date().toISOString().split('T')[0];

    const logCheck = await db.query(
      'SELECT * FROM habit_logs WHERE habit_id = $1 AND log_date = $2',
      [id, today]
    );

    const habitResult = await db.query('SELECT frequency_count, type, target_value FROM habits WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (habitResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Hábito no encontrado o no autorizado' });
    }

    const habit = habitResult.rows[0];
    const maxCount = habit.type === 'quantifiable' ? habit.target_value : habit.frequency_count;

    if (logCheck.rows.length === 0) {
      if (habit.type === 'inverse') {
        // En inverso, al hacer toggle la 1ra vez, significó que FALLÓ en realizar el hábito (-1)
        const newLog = await db.query(
          'INSERT INTO habit_logs (habit_id, log_date, completed_count) VALUES ($1, $2, -1) RETURNING *',
          [id, today]
        );
        return res.json(newLog.rows[0]);
      }

      // Crear log regular / quantifiable
      const initialCount = amount !== undefined ? amount : 1;
      if (initialCount <= 0) {
        return res.json({ message: 'Log no creado', completed_count: 0 });
      }

      const newLog = await db.query(
        'INSERT INTO habit_logs (habit_id, log_date, completed_count) VALUES ($1, $2, $3) RETURNING *',
        [id, today, initialCount]
      );
      res.json(newLog.rows[0]);
      
    } else {
      // Ya hay log, actualizarlo
      const currentLog = logCheck.rows[0];
      
      if (habit.type === 'inverse') {
        // Si ya falló (-1), borrar el log revierte el flag asumiendo que SI lo hizo al final
        await db.query('DELETE FROM habit_logs WHERE id = $1', [currentLog.id]);
        return res.json({ message: 'Log inverso eliminado (restituido racha)', completed_count: 1 });
      }

      let newCount;
      if (habit.type === 'quantifiable' && amount !== undefined) {
        newCount = currentLog.completed_count + amount;
      } else {
        newCount = currentLog.completed_count + 1;
        if (currentLog.completed_count >= maxCount) {
          newCount = 0; // Toggle off
        }
      }

      if (newCount <= 0) {
        await db.query('DELETE FROM habit_logs WHERE id = $1', [currentLog.id]);
        res.json({ message: 'Log eliminado (desmarcado)', completed_count: 0 });
      } else {
        const updatedLog = await db.query(
          'UPDATE habit_logs SET completed_count = $1 WHERE id = $2 RETURNING *',
          [newCount, currentLog.id]
        );
        res.json(updatedLog.rows[0]);
      }
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al registrar actividad' });
  }
};
