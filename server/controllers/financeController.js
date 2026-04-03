const db = require('../db');
const https = require('https');

// --- Helper: Fetch JSON from URL ---
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Strike-App/1.0 (personal finance app)',
        'Accept': 'application/json',
      },
      timeout: 8000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

// --- Fetch live rates from dolarapi.com (free, no ban risk) ---
exports.fetchLiveRates = async (req, res) => {
  try {
    const settingsResult = await db.query('SELECT settings FROM user_settings WHERE user_id = $1', [req.user.id]);
    const currentSettings = settingsResult.rows[0]?.settings || {};
    const defaultRates = { usd_bs: 648, usd_bs_bcv: 474, usd_cop: 4200, bs_cop: 5, usdt_bs: 648 };
    const currentRates = currentSettings.exchange_rates || defaultRates;

    // Check cache: only fetch if last_live_fetch was > 24h ago (user-triggered button)
    const lastFetch = currentRates.last_live_fetch ? new Date(currentRates.last_live_fetch) : null;
    const hoursSinceLastFetch = lastFetch ? (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60) : 999;

    // Allow forced refresh if at least 1 hour has passed (anti-abuse)
    if (hoursSinceLastFetch < 1) {
      return res.json({
        success: false,
        message: 'Espera al menos 1 hora entre actualizaciones automáticas.',
        rates: currentRates,
      });
    }

    const [bcvData, paraleloData] = await Promise.allSettled([
      fetchJSON('https://ve.dolarapi.com/v1/dolares/oficial'),
      fetchJSON('https://ve.dolarapi.com/v1/dolares/paralelo'),
    ]);

    const newRates = { ...currentRates };
    const updates = {};

    if (bcvData.status === 'fulfilled' && bcvData.value?.promedio) {
      newRates.usd_bs_bcv = parseFloat(bcvData.value.promedio.toFixed(2));
      updates.bcv = { value: newRates.usd_bs_bcv, date: bcvData.value.fechaActualizacion };
    }

    if (paraleloData.status === 'fulfilled' && paraleloData.value?.promedio) {
      newRates.usd_bs = parseFloat(paraleloData.value.promedio.toFixed(2));
      updates.paralelo = { value: newRates.usd_bs, date: paraleloData.value.fechaActualizacion };
    }

    newRates.last_live_fetch = new Date().toISOString();

    // Persist updated rates into user settings
    const updatedSettings = { ...currentSettings, exchange_rates: newRates };
    await db.query(
      'INSERT INTO user_settings (user_id, settings, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET settings = $2, updated_at = NOW()',
      [req.user.id, JSON.stringify(updatedSettings)]
    );

    res.json({ success: true, rates: newRates, updates });
  } catch (err) {
    console.error('fetchLiveRates error:', err.message);
    res.status(500).json({ error: 'Error al obtener tasas en vivo', detail: err.message });
  }
};

exports.getFinanceData = async (req, res) => {
  try {
    const goalsResult = await db.query('SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const transactionsResult = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 200', [req.user.id]);
    const settingsResult = await db.query('SELECT settings FROM user_settings WHERE user_id = $1', [req.user.id]);
    
    let finalSettings = settingsResult.rows[0]?.settings;
    if (finalSettings && finalSettings.settings && !finalSettings.exchange_rates) {
      finalSettings = finalSettings.settings;
    }
    
    res.json({
      goals: goalsResult.rows,
      transactions: transactionsResult.rows,
      settings: finalSettings || { 
        exchange_rates: { usd_bs: 648, usd_bs_bcv: 474, usd_cop: 4200, bs_cop: 5, usdt_bs: 648 },
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
    
    await db.query('BEGIN');
    
    const veDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Caracas" }));
    const newTransaction = await db.query(
      'INSERT INTO transactions (user_id, type, amount, currency, category, source, description, date, goal_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.id, type, amount, currency || 'USD', category, source || '', description || '', date || veDate, goal_id || null]
    );

    if (goal_id) {
      const settingsResult = await db.query('SELECT settings FROM user_settings WHERE user_id = $1', [req.user.id]);
      const rates = settingsResult.rows[0]?.settings?.exchange_rates || { usd_bs: 648, usd_bs_bcv: 474, usd_cop: 4200, bs_cop: 5 };
      
      let amountInUSD = amount;
      if (currency !== 'USD') {
        const rate = rates[currency] || 1;
        amountInUSD = amount / rate;
      }

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

    const oldRes = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (oldRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    const oldTx = oldRes.rows[0];

    const settingsResult = await db.query('SELECT settings FROM user_settings WHERE user_id = $1', [req.user.id]);
    const rates = settingsResult.rows[0]?.settings?.exchange_rates || { usd_bs: 648, usd_bs_bcv: 474, usd_cop: 4200, bs_cop: 5 };

    if (oldTx.goal_id) {
      const oldAmountInUSD = oldTx.currency === 'USD' ? oldTx.amount : oldTx.amount / (rates[oldTx.currency] || 1);
      const revertOp = (oldTx.type === 'income' || oldTx.type === 'saving') ? '-' : '+';
      await db.query(`UPDATE savings_goals SET current_amount = current_amount ${revertOp} $1 WHERE id = $2`, [oldAmountInUSD, oldTx.goal_id]);
    }

    if (goal_id) {
      const newAmountInUSD = currency === 'USD' ? amount : amount / (rates[currency] || 1);
      const applyOp = (type === 'income' || type === 'saving') ? '+' : '-';
      await db.query(`UPDATE savings_goals SET current_amount = current_amount ${applyOp} $1 WHERE id = $2`, [newAmountInUSD, goal_id]);
    }

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
    let { settings } = req.body;
    // Fix historically corrupted nested settings payload
    if (settings && settings.settings && !settings.exchange_rates) {
      settings = settings.settings;
    }
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
    await db.query('UPDATE transactions SET goal_id = NULL WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Todas las metas eliminadas' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar metas' });
  }
};
