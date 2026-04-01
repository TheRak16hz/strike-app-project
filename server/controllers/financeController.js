const db = require('../db');

exports.getFinanceData = async (req, res) => {
  try {
    const goalsResult = await db.query('SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const transactionsResult = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 200', [req.user.id]);
    const settingsResult = await db.query('SELECT settings FROM user_settings WHERE user_id = $1', [req.user.id]);
    
    res.json({
      goals: goalsResult.rows,
      transactions: transactionsResult.rows,
      settings: settingsResult.rows[0]?.settings || { 
        exchange_rates: { usd_bs: 65, usd_bs_bcv: 45, usd_cop: 4000, bs_cop: 5 },
        budgets: {} 
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener datos financieros' });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { title, target_amount, deadline, color, icon } = req.body;
    const newGoal = await db.query(
      'INSERT INTO savings_goals (user_id, title, target_amount, current_amount, deadline, color, icon) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, title, target_amount, 0, deadline || null, color || 'var(--primary)', icon || '💰']
    );
    res.json(newGoal.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al crear meta de ahorro' });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, target_amount, current_amount, deadline, color, icon } = req.body;
    const updatedGoal = await db.query(
      'UPDATE savings_goals SET title = $1, target_amount = $2, current_amount = $3, deadline = $4, color = $5, icon = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
      [title, target_amount, current_amount, deadline || null, color, icon, id, req.user.id]
    );
    if (updatedGoal.rows.length === 0) return res.status(404).json({ error: 'Meta no encontrada' });
    res.json(updatedGoal.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al actualizar meta de ahorro' });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM savings_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Meta eliminada' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar meta de ahorro' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, currency, category, source, description, date, goal_id } = req.body;
    
    // Start transaction to ensure data consistency if linking to a goal
    await db.query('BEGIN');
    
    const veDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Caracas" }));
    const newTransaction = await db.query(
      'INSERT INTO transactions (user_id, type, amount, currency, category, source, description, date, goal_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.id, type, amount, currency || 'USD', category, source || '', description || '', date || veDate, goal_id || null]
    );

    // If it's linked to a goal, we update the goal amount
    if (goal_id) {
      // Get current exchange rates to convert to USD (base currency for goals)
      const settingsResult = await db.query('SELECT settings FROM user_settings WHERE user_id = $1', [req.user.id]);
      const rates = settingsResult.rows[0]?.settings?.exchange_rates || { usd_bs: 65, usd_bs_bcv: 45, usd_cop: 4000, bs_cop: 5 };
      
      let amountInUSD = amount;
      if (currency !== 'USD') {
        const rate = rates[currency] || 1;
        amountInUSD = amount / rate;
      }

      // If it's a goal_withdrawal, we subtract from the goal (internal move)
      const updateOp = (type === 'income' || type === 'saving') ? '+' : '-';
      await db.query(
        `UPDATE savings_goals SET current_amount = current_amount ${updateOp} $1 WHERE id = $2 AND user_id = $3`,
        [amountInUSD, goal_id, req.user.id]
      );
    }

    await db.query('COMMIT');
    res.json(newTransaction.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Error al registrar transacción' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('BEGIN');
    const transResult = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (transResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    const trans = transResult.rows[0];
    if (trans.goal_id) {
      // Revert the amount from the goal
      const amountToRevert = (trans.type === 'income' || trans.type === 'saving') ? -trans.amount : trans.amount;
      await db.query(
        'UPDATE savings_goals SET current_amount = current_amount + $1 WHERE id = $2 AND user_id = $3',
        [amountToRevert, trans.goal_id, req.user.id]
      );
    }
    
    await db.query('DELETE FROM transactions WHERE id = $1', [id]);
    await db.query('COMMIT');
    res.json({ message: 'Transacción eliminada' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar transacción' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, currency, category, source, description, date, goal_id } = req.body;
    
    await db.query('BEGIN');

    // 1. Get old transaction to revert its effect on goal if necessary
    const oldRes = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (oldRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    const oldTx = oldRes.rows[0];

    // Get rates for conversion
    const settingsResult = await db.query('SELECT settings FROM user_settings WHERE user_id = $1', [req.user.id]);
    const rates = settingsResult.rows[0]?.settings?.exchange_rates || { usd_bs: 65, usd_bs_bcv: 45, usd_cop: 4000, bs_cop: 5 };

    // 2. Revert old goal impact
    if (oldTx.goal_id) {
      const oldAmountInUSD = oldTx.currency === 'USD' ? oldTx.amount : oldTx.amount / (rates[oldTx.currency] || 1);
      const revertOp = (oldTx.type === 'income' || oldTx.type === 'saving') ? '-' : '+';
      await db.query(`UPDATE savings_goals SET current_amount = current_amount ${revertOp} $1 WHERE id = $2`, [oldAmountInUSD, oldTx.goal_id]);
    }

    // 3. Apply new goal impact
    if (goal_id) {
      const newAmountInUSD = currency === 'USD' ? amount : amount / (rates[currency] || 1);
      const applyOp = (type === 'income' || type === 'saving') ? '+' : '-';
      await db.query(`UPDATE savings_goals SET current_amount = current_amount ${applyOp} $1 WHERE id = $2`, [newAmountInUSD, goal_id]);
    }

    // 4. Update transaction record
    const updatedTx = await db.query(
      'UPDATE transactions SET type = $1, amount = $2, currency = $3, category = $4, source = $5, description = $6, date = $7, goal_id = $8 WHERE id = $9 AND user_id = $10 RETURNING *',
      [type, amount, currency, category, source, description, date, goal_id, id, req.user.id]
    );

    await db.query('COMMIT');
    res.json(updatedTx.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    await db.query(
      'INSERT INTO user_settings (user_id, settings, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET settings = $2, updated_at = NOW()',
      [req.user.id, JSON.stringify(settings)]
    );
    res.json({ message: 'Ajustes guardados' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al guardar ajustes' });
  }
};

exports.deleteAllTransactions = async (req, res) => {
  try {
    await db.query('DELETE FROM transactions WHERE user_id = $1', [req.user.id]);
    // Reset goal amounts if needed? The user wants to restart, so we should probably reset goal current_amount too
    await db.query('UPDATE savings_goals SET current_amount = 0 WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Todos los movimientos eliminados y metas reiniciadas' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar movimientos' });
  }
};

exports.deleteAllGoals = async (req, res) => {
  try {
    await db.query('DELETE FROM savings_goals WHERE user_id = $1', [req.user.id]);
    // Also remove links in transactions?
    await db.query('UPDATE transactions SET goal_id = NULL WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Todas las metas eliminadas' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar metas' });
  }
};
