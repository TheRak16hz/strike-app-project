import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { financeService } from '../services/financeService';

// Tab components
import FinanceOverview from './finance/FinanceOverview';
import FinanceBudgets from './finance/FinanceBudgets';
import FinanceRates from './finance/FinanceRates';

// Header
import FinanceHeader from '../components/finance/FinanceHeader';

// Modals
import TransactionFormModal from '../components/finance/modals/TransactionFormModal';
import GoalFormModal from '../components/finance/modals/GoalFormModal';
import GoalAdjustModal from '../components/finance/modals/GoalAdjustModal';
import FinanceSettingsModal from '../components/finance/modals/FinanceSettingsModal';
import MonthlyReportModal from '../components/finance/modals/MonthlyReportModal';

const TABS = [
  { key: 'overview', label: '💰 Finanzas', title: 'Dashboard financiero' },
  { key: 'budgets', label: '📊 Presupuestos', title: 'Presupuestos mensuales por categoría' },
  { key: 'rates', label: '💱 Tasas', title: 'Tasas de cambio y calculadora' },
];

export default function Finance() {
  const [data, setData] = useState({
    goals: [],
    transactions: [],
    settings: {
      exchange_rates: { usd_bs: 648, usd_bs_bcv: 474, usd_cop: 4200, bs_cop: 5, usdt_bs: 648 },
      budgets: {},
    },
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTransForm, setShowTransForm] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Edit states
  const [editingItem, setEditingItem] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [adjustType, setAdjustType] = useState('add');

  // Form states
  const [newGoal, setNewGoal] = useState({ title: '', target_amount: '', deadline: '', color: 'var(--primary)', icon: '💰' });
  const [newTrans, setNewTrans] = useState({
    type: 'income', amount: '', currency: 'USD', category: 'Otros', source: '',
    date: new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' })).toLocaleDateString('en-CA'),
    goal_id: '',
  });
  const [adjustData, setAdjustData] = useState({ amount: '', description: '', currency: 'USD' });
  const [rates, setRates] = useState({ usd_bs: 648, usd_bs_bcv: 474, usd_cop: 4200, bs_cop: 5, usdt_bs: 648 });
  const [budgets, setBudgets] = useState({});

  const resetGoalForm = () => setNewGoal({ title: '', target_amount: '', deadline: '', color: 'var(--primary)', icon: '💰' });
  const resetTransForm = () => setNewTrans({
    type: 'income', amount: '', currency: 'USD', category: 'General', source: '', description: '',
    date: new Date().toISOString().split('T')[0], goal_id: '',
  });

  useEffect(() => {
    fetchDataInitial();
    const handleFinanceEvent = () => {
      setEditingItem(null);
      resetTransForm();
      setShowTransForm(true);
    };
    window.addEventListener('nav-action-finance', handleFinanceEvent);
    return () => window.removeEventListener('nav-action-finance', handleFinanceEvent);
  }, []);

  const fetchDataInitial = async () => {
    try {
      const res = await financeService.getFinanceData();
      setData(res);
      if (res.settings) {
        if (res.settings.exchange_rates) setRates(res.settings.exchange_rates);
        if (res.settings.budgets) setBudgets(res.settings.budgets);
      }
    } catch {
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const res = await financeService.getFinanceData();
      setData(res);
    } catch {
      toast.error('Error al actualizar datos');
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    try {
      await financeService.updateSettings({ settings: newSettings });
      setData(prev => ({ ...prev, settings: newSettings }));
      if (newSettings.exchange_rates) setRates(newSettings.exchange_rates);
      if (newSettings.budgets) setBudgets(newSettings.budgets);
      toast.success('Ajustes guardados');
      setShowSettingsModal(false);
      fetchData();
    } catch {
      toast.error('Error al guardar ajustes');
    }
  };

  // Save only rates (from Rates tab)
  const handleSaveRates = async (newRates) => {
    const newSettings = { ...data.settings, exchange_rates: newRates };
    await handleUpdateSettings(newSettings);
  };

  // Save only budgets (from Budgets tab inline editor)
  const handleSaveBudgets = async (newBudgets) => {
    const newSettings = { ...data.settings, budgets: newBudgets };
    await handleUpdateSettings(newSettings);
  };

  const convertToUSD = useCallback((amount, currency) => {
    const val = Number(amount) || 0;
    if (currency === 'USD' || currency === 'USDT') return val;
    const rateKey = currency === 'BS' ? 'usd_bs'
      : currency === 'BS_BCV' ? 'usd_bs_bcv'
      : currency === 'COP' ? 'usd_cop'
      : currency;
    const rate = Number(rates[rateKey]) || 1;
    return val / rate;
  }, [rates]);

  const totals = useMemo(() => {
    const transactions = data.transactions;
    const goals = data.goals;

    const getVeDate = (date = new Date()) => {
      const veStr = date.toLocaleString('en-US', { timeZone: 'America/Caracas' });
      return new Date(veStr);
    };

    const nowVe = getVeDate();
    const currentMonth = nowVe.getMonth();
    const currentYear = nowVe.getFullYear();

    const grossTotalUSD = transactions.reduce((acc, t) => {
      const amountUSD = convertToUSD(t.amount, t.currency || 'USD');
      if (t.type === 'income') return acc + amountUSD;
      if (t.type === 'expense') return acc - amountUSD;
      return acc;
    }, 0);

    const totalSavedUSD = goals.reduce((acc, g) => acc + Number(g.current_amount || 0), 0);
    const availableLiquidUSD = grossTotalUSD - totalSavedUSD;

    const currencyBalances = transactions.reduce((acc, t) => {
      const amount = Number(t.amount);
      if (t.type === 'income' || t.type === 'goal_withdrawal') acc[t.currency] = (acc[t.currency] || 0) + amount;
      if (t.type === 'expense' || t.type === 'saving') acc[t.currency] = (acc[t.currency] || 0) - amount;
      return acc;
    }, { USD: 0, BS: 0, COP: 0, USDT: 0, BS_BCV: 0 });

    const monthlyIncomeUSD = transactions
      .filter(t => {
        const tDate = getVeDate(new Date(t.date));
        return t.type === 'income' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + convertToUSD(t.amount, t.currency), 0);

    const monthlyExpenseUSD = transactions
      .filter(t => {
        const tDate = getVeDate(new Date(t.date));
        return t.type === 'expense' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + convertToUSD(t.amount, t.currency), 0);

    const categorySpending = transactions.reduce((acc, t) => {
      const tDate = getVeDate(new Date(t.date));
      if (t.type === 'expense' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        const amountUSD = convertToUSD(t.amount, t.currency);
        acc[t.category] = (acc[t.category] || 0) + amountUSD;
      }
      return acc;
    }, {});

    const history = [];
    const today = getVeDate();
    let runningGross = grossTotalUSD;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      history.push({ date: dateStr, value: runningGross });
      transactions.filter(t => t.date === dateStr).forEach(t => {
        const amountUSD = convertToUSD(t.amount, t.currency);
        if (t.type === 'income') runningGross -= amountUSD;
        if (t.type === 'expense') runningGross += amountUSD;
      });
    }
    const trendData = history.reverse();

    let totalRecentlySaved = transactions.reduce((acc, t) => {
      const tDate = getVeDate(new Date(t.date));
      const daysAgo = (today - tDate) / (1000 * 60 * 60 * 24);
      if (t.type === 'saving' && daysAgo <= 60) return acc + convertToUSD(t.amount, t.currency);
      return acc;
    }, 0);
    const dailyRate = totalRecentlySaved / 60;

    const goalsForecast = goals.map(g => {
      const remaining = Number(g.target_amount) - Number(g.current_amount);
      if (remaining <= 0) return { ...g, status: 'completed', estDate: '¡Completada!' };
      if (dailyRate <= 0) return { ...g, status: 'stagnant', estDate: 'Incalculable' };
      const daysNeeded = Math.ceil(remaining / dailyRate);
      const estDate = new Date(today);
      estDate.setDate(today.getDate() + daysNeeded);
      let status = 'on-track';
      let statusLabel = 'A Tiempo';
      if (g.deadline) {
        const deadlineDate = new Date(g.deadline);
        if (estDate > deadlineDate) { status = 'delayed'; statusLabel = 'Retrasado'; }
      }
      return { ...g, status, statusLabel, daysNeeded, estDate: estDate.toLocaleDateString() };
    });

    return {
      grossTotalUSD, availableLiquidUSD, totalSavedUSD,
      monthlyIncomeUSD, monthlyExpenseUSD, currencyBalances,
      categorySpending, trendData, goalsForecast,
      distributionData: [
        { name: 'Disponible', value: Math.max(0, availableLiquidUSD), color: '#10b981' },
        { name: 'En Metas', value: totalSavedUSD, color: 'var(--primary)' },
      ],
    };
  }, [data, convertToUSD]);

  // ---- CRUD handlers ----
  const handleCreateOrUpdateGoal = async (e) => {
    e.preventDefault();
    const cleanedGoal = { ...newGoal, target_amount: parseFloat(newGoal.target_amount) || 0, current_amount: parseFloat(newGoal.current_amount) || 0 };
    try {
      if (editingItem?.type === 'goal') {
        await financeService.updateGoal(editingItem.data.id, cleanedGoal);
        toast.success('Meta actualizada');
      } else {
        await financeService.createGoal(cleanedGoal);
        toast.success('Meta creada');
      }
      setShowGoalForm(false); setEditingItem(null); fetchData();
    } catch { toast.error('Error en la operación'); }
  };

  const handleCreateOrUpdateTrans = async (e) => {
    e.preventDefault();
    const cleanedTrans = { ...newTrans, amount: parseFloat(newTrans.amount) || 0 };
    try {
      if (cleanedTrans.type === 'saving') {
        const amountUSD = convertToUSD(cleanedTrans.amount, cleanedTrans.currency);
        if (amountUSD > (totals.availableLiquidUSD + 0.01)) {
          toast.error(`Capital disponible insuficiente ($${totals.availableLiquidUSD.toFixed(2)} USD)`);
          return;
        }
      }
      if (editingItem?.type === 'transaction') {
        await financeService.updateTransaction(editingItem.data.id, cleanedTrans);
        toast.success('Transacción actualizada');
      } else {
        await financeService.createTransaction(cleanedTrans);
        toast.success('Transacción registrada');
      }
      setShowTransForm(false); setEditingItem(null); fetchData();
    } catch { toast.error('Error en la operación'); }
  };

  const handleAdjustGoal = async (e) => {
    e.preventDefault();
    if (!adjustData.amount) return;
    try {
      const tzDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' })).toLocaleDateString('en-CA');
      if (adjustType === 'add') {
        const amountUSD = convertToUSD(adjustData.amount, adjustData.currency);
        if (amountUSD > (totals.availableLiquidUSD + 0.01)) {
          toast.error(`Capital disponible insuficiente ($${totals.availableLiquidUSD.toFixed(2)} USD)`);
          return;
        }
        await financeService.createTransaction({ type: 'saving', amount: adjustData.amount, currency: adjustData.currency, category: 'Ahorro Manual', description: adjustData.description || 'Ajuste', goal_id: selectedGoal.id, date: tzDate });
      } else if (adjustType === 'spend') {
        await financeService.createTransaction({ type: 'expense', amount: adjustData.amount, currency: adjustData.currency, category: 'Gasto de Meta', description: adjustData.description, goal_id: selectedGoal.id, date: tzDate });
      } else if (adjustType === 'remove') {
        await financeService.createTransaction({ type: 'goal_withdrawal', amount: adjustData.amount, currency: adjustData.currency, category: 'Retiro de Meta', description: adjustData.description || `Retiro de reserva (${selectedGoal.title})`, goal_id: selectedGoal.id, date: tzDate });
      } else if (adjustType === 'redirect') {
        const rate = Number(rates[adjustData.currency]) || 1;
        const amountInUSD = adjustData.currency === 'USD' ? Number(adjustData.amount) : Number(adjustData.amount) / rate;
        await financeService.updateGoal(selectedGoal.id, { ...selectedGoal, current_amount: Math.max(0, Number(selectedGoal.current_amount) - amountInUSD) });
      }
      toast.success('Ajuste realizado');
      setShowAdjustModal(false);
      fetchData();
    } catch { toast.error('Error al ajustar'); }
  };

  const startEditGoal = (goal) => { setEditingItem({ type: 'goal', data: goal }); setNewGoal({ ...goal }); setShowGoalForm(true); };
  const startEditTrans = (tx) => { setEditingItem({ type: 'transaction', data: tx }); setNewTrans({ ...tx, date: tx.date.split('T')[0], goal_id: tx.goal_id || '' }); setShowTransForm(true); };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('¿Eliminar meta?')) {
      try { await financeService.deleteGoal(id); toast.success('Meta eliminada'); fetchData(); }
      catch { toast.error('Error al eliminar'); }
    }
  };

  const handleDeleteTrans = async (id) => {
    if (window.confirm('¿Eliminar movimiento?')) {
      try { await financeService.deleteTransaction(id); toast.success('Eliminado'); fetchData(); }
      catch { toast.error('Error al eliminar'); }
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (window.confirm('¿ESTÁS SEGURO? Se borrarán todos los movimientos y las metas se reiniciarán a $0.')) {
      try { await financeService.deleteAllTransactions(); toast.success('Movimientos eliminados'); fetchData(); }
      catch { toast.error('Error al reiniciar movimientos'); }
    }
  };

  const handleDeleteAllGoals = async () => {
    if (window.confirm('¿ELIMINAR TODAS LAS METAS? Esta acción no se puede deshacer.')) {
      try { await financeService.deleteAllGoals(); toast.success('Metas eliminadas'); fetchData(); }
      catch { toast.error('Error al eliminar metas'); }
    }
  };

  if (loading) return <div className="loading-state">Personalizando tu panel...</div>;

  return (
    <div className="finance-page animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '5rem' }}>

      <FinanceHeader
        onNewGoal={() => { setEditingItem(null); resetGoalForm(); setShowGoalForm(true); }}
        onResetTransactions={handleDeleteAllTransactions}
        onResetGoals={handleDeleteAllGoals}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* ====== TAB NAV ====== */}
      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          background: 'rgba(0,0,0,0.12)',
          padding: '0.3rem',
          borderRadius: '14px',
          marginBottom: '1.5rem',
          width: 'fit-content',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            id={`finance-tab-${tab.key}`}
            title={tab.title}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
              background: activeTab === tab.key
                ? 'var(--primary)'
                : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.key ? '0 2px 12px rgba(var(--primary-rgb),0.35)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== TAB CONTENT ====== */}
      {activeTab === 'overview' && (
        <FinanceOverview
          totals={totals}
          data={data}
          onEditTrans={startEditTrans}
          onDeleteTrans={handleDeleteTrans}
          onAdjustGoal={(goal) => { setSelectedGoal(goal); setShowAdjustModal(true); }}
          onEditGoal={startEditGoal}
          onDeleteGoal={handleDeleteGoal}
          onShowReport={() => setShowReportModal(true)}
        />
      )}

      {activeTab === 'budgets' && (
        <FinanceBudgets
          budgets={budgets}
          categorySpending={totals.categorySpending}
          onOpenSettings={() => setShowSettingsModal(true)}
          onSaveBudgets={handleSaveBudgets}
        />
      )}

      {activeTab === 'rates' && (
        <FinanceRates
          rates={rates}
          onSaveRates={handleSaveRates}
        />
      )}

      {/* ====== MODALS ====== */}
      <TransactionFormModal
        show={showTransForm}
        onClose={() => setShowTransForm(false)}
        onSubmit={handleCreateOrUpdateTrans}
        editingItem={editingItem}
        newTrans={newTrans}
        setNewTrans={setNewTrans}
        goals={data.goals}
      />

      <GoalFormModal
        show={showGoalForm}
        onClose={() => setShowGoalForm(false)}
        onSubmit={handleCreateOrUpdateGoal}
        editingItem={editingItem}
        newGoal={newGoal}
        setNewGoal={setNewGoal}
      />

      <GoalAdjustModal
        show={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        onSubmit={handleAdjustGoal}
        selectedGoal={selectedGoal}
        adjustType={adjustType}
        setAdjustType={setAdjustType}
        adjustData={adjustData}
        setAdjustData={setAdjustData}
        rates={rates}
      />

      <FinanceSettingsModal
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        rates={rates}
        setRates={setRates}
        budgets={budgets}
        setBudgets={setBudgets}
        onSave={handleUpdateSettings}
      />

      <MonthlyReportModal
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        transactions={data.transactions}
        totals={totals}
        rates={rates}
      />
    </div>
  );
}
