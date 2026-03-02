import { getDb } from '../db/database';

export const habitService = {
  getHabits: async () => {
    try {
      const db = await getDb();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const habitsResult = await db.getAllAsync('SELECT * FROM habits ORDER BY created_at DESC');
      // En SQLite Native getAll returns an array of objects directly
      const habits = habitsResult;
      
      const logsResult = await db.getAllAsync(
        "SELECT * FROM habit_logs WHERE log_date >= date('now', '-90 days') ORDER BY log_date DESC"
      );
      const logs = logsResult;

      const data = habits.map(habit => {
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
          return log.log_date === todayStr;
        });
        
        const isQuantifiable = habit.type === 'quantifiable';
        const isInverse = habit.type === 'inverse';
        
        const target = isQuantifiable ? habit.target_value : habit.frequency_count;
        
        let completedCountToday = todayLog ? todayLog.completed_count : 0;
        let isCompletedToday = false;

        if (isInverse) {
          if (completedCountToday === -1) {
            isCompletedToday = false;
          } else {
            isCompletedToday = true;
            completedCountToday = 1; 
          }
        } else {
          isCompletedToday = completedCountToday >= target;
        }
        
        const dayOfWeek = today.getDay(); 
        const isTargetDayToday = habit.frequency_type === 'specific_days' 
          ? targetDaysArray.includes(dayOfWeek)
          : true; 

        const createdDateStr = habit.created_at.split(' ')[0]; // SQLite defaults to "YYYY-MM-DD HH:MM:SS"

        let currentStreak = 0;
        let checkDate = new Date(today);
        let streakActive = true;
        
        if (!isCompletedToday) {
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          if (isTargetDayToday) currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
        
        while (streakActive && currentStreak < 3650) {
          const dStr = checkDate.toISOString().split('T')[0];
          
          if (dStr < createdDateStr) {
            break; 
          }

          const dw = checkDate.getDay();
          const isTarget = habit.frequency_type === 'specific_days' ? targetDaysArray.includes(dw) : true;
          
          const log = habitLogs.find(l => l.log_date === dStr);
          let isCompleted = false;

          if (isInverse) {
            isCompleted = !(log && log.completed_count === -1);
          } else {
            isCompleted = log ? log.completed_count >= target : false;
          }

          if (isTarget) {
            if (isCompleted) {
              currentStreak++;
            } else {
              streakActive = false; 
            }
          }
          
          checkDate.setDate(checkDate.getDate() - 1);
        }

        const historyDates = [];
        
        if (!isInverse) {
          historyDates.push(...habitLogs
            .filter(log => log.completed_count >= target)
            .map(log => log.log_date));
        } else {
          const endDate = new Date(today);
          let d = new Date(today);
          d.setDate(d.getDate() - 90);
          
          while (d <= endDate) {
            const ds = d.toISOString().split('T')[0];
            const dw = d.getDay();
            
            if (ds >= createdDateStr) {
              const isTarget = habit.frequency_type === 'specific_days' ? targetDaysArray.includes(dw) : true;
              
              if (isTarget) {
                const l = habitLogs.find(log => log.log_date === ds);
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

      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  create: async (dataData) => {
    try {
      const db = await getDb();
      const { 
        title, description, frequency_type, frequency_count, color,
        target_days, type, target_value, unit, icon, reminder_time
      } = dataData;
      
      const targetDaysStr = JSON.stringify(target_days || []);
      
      const result = await db.runAsync(
        `INSERT INTO habits 
        (title, description, frequency_type, frequency_count, color, target_days, type, target_value, unit, icon, reminder_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, description || '', frequency_type || 'daily', frequency_count || 1, color || '#3b82f6',
          targetDaysStr, type || 'regular', target_value || 1, unit || '', icon || '🎯', reminder_time || null
        ]
      );
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  update: async (id, dataData) => {
    try {
      const db = await getDb();
      const { 
        title, description, frequency_type, frequency_count, color,
        target_days, type, target_value, unit, icon, reminder_time
      } = dataData;
      
      const targetDaysStr = JSON.stringify(target_days || []);

      await db.runAsync(
        `UPDATE habits SET 
          title = ?, description = ?, frequency_type = ?, frequency_count = ?, color = ?,
          target_days = ?, type = ?, target_value = ?, unit = ?, icon = ?, reminder_time = ?
        WHERE id = ?`,
        [
          title, description, frequency_type, frequency_count, color,
          targetDaysStr, type || 'regular', target_value || 1, unit || '', icon || '🎯', reminder_time || null, id
        ]
      );
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  delete: async (id) => {
    try {
      const db = await getDb();
      await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  toggle: async (id, amount) => {
    try {
      const db = await getDb();
      const today = new Date().toISOString().split('T')[0];

      const logCheck = await db.getAllAsync(
        'SELECT * FROM habit_logs WHERE habit_id = ? AND log_date = ?',
        [id, today]
      );

      const habitResult = await db.getFirstAsync('SELECT frequency_count, type, target_value FROM habits WHERE id = ?', [id]);
      const habit = habitResult;
      const maxCount = habit.type === 'quantifiable' ? habit.target_value : habit.frequency_count;

      if (logCheck.length === 0) {
        if (habit.type === 'inverse') {
          await db.runAsync(
            'INSERT INTO habit_logs (habit_id, log_date, completed_count) VALUES (?, ?, -1)',
            [id, today]
          );
          return true;
        }

        const initialCount = amount !== undefined ? amount : 1;
        if (initialCount <= 0) return true;

        await db.runAsync(
          'INSERT INTO habit_logs (habit_id, log_date, completed_count) VALUES (?, ?, ?)',
          [id, today, initialCount]
        );
        return true;
      } else {
        const currentLog = logCheck[0];
        
        if (habit.type === 'inverse') {
          await db.runAsync('DELETE FROM habit_logs WHERE id = ?', [currentLog.id]);
          return true;
        }

        let newCount;
        if (habit.type === 'quantifiable' && amount !== undefined) {
          newCount = currentLog.completed_count + amount;
        } else {
          newCount = currentLog.completed_count + 1;
          if (currentLog.completed_count >= maxCount) {
            newCount = 0; 
          }
        }

        if (newCount <= 0) {
          await db.runAsync('DELETE FROM habit_logs WHERE id = ?', [currentLog.id]);
        } else {
          await db.runAsync(
            'UPDATE habit_logs SET completed_count = ? WHERE id = ?',
            [newCount, currentLog.id]
          );
        }
        return true;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
};
