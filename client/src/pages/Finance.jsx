import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Target,
  Trash2, PiggyBank, X, RefreshCw, Edit2, ArrowLeftRight,
  TrendingUp as TrendUp, DollarSign
} from 'lucide-react';
import { financeService } from '../services/financeService';
import { toast } from 'react-hot-toast';
import { 
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function Finance() {
  const [data, setData] = useState({ goals: [], transactions: [], settings: { exchange_rates: { BS: 54, COP: 4000, USDT: 1 } } });
  const [loading, setLoading] = useState(true);
  
  // Modals Visibility
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTransForm, setShowTransForm] = useState(false);
  const [showRatesPanel, setShowRatesPanel] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  
  // Edit States
  const [editingItem, setEditingItem] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [adjustType, setAdjustType] = useState('add');

  // Form States
  const [newGoal, setNewGoal] = useState({ title: '', target_amount: '', deadline: '', color: 'var(--primary)', icon: '💰' });
  const [newTrans, setNewTrans] = useState({ type: 'income', amount: '', currency: 'USD', category: 'General', source: '', description: '', date: new Date().toISOString().split('T')[0], goal_id: '' });
  const [adjustData, setAdjustData] = useState({ amount: '', description: '', currency: 'USD' });
  
  const [rates, setRates] = useState({ BS: 54, COP: 4000, USDT: 1 });

  useEffect(() => {
    fetchDataInitial();

    const handleFinanceEvent = () => {
      setEditingItem(null);
      setShowTransForm(true);
    };
    window.addEventListener('nav-action-finance', handleFinanceEvent);
    return () => window.removeEventListener('nav-action-finance', handleFinanceEvent);
  }, []);

  const fetchDataInitial = async () => {
    try {
      const res = await financeService.getFinanceData();
      setData(res);
      if (res.settings?.exchange_rates) {
        setRates(res.settings.exchange_rates);
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

  const handleUpdateRates = async () => {
    try {
      const validRates = { ...rates };
      Object.keys(validRates).forEach(k => { if(!validRates[k]) validRates[k] = 1; });
      
      await financeService.updateSettings({ exchange_rates: validRates });
      toast.success('Tasas de cambio actualizadas');
      setShowRatesPanel(false);
      fetchData();
    } catch {
      toast.error('Error al guardar tasas');
    }
  };

  const totals = useMemo(() => {
    const transactions = data?.transactions || [];
    const goals = data?.goals || [];
    
    const convertToUSD = (amount, currency) => {
      const val = Number(amount) || 0;
      if (currency === 'USD' || currency === 'USDT') return val;
      const rate = Number(rates[currency]) || 1;
      return val / rate;
    };
    
    const grossTotalUSD = transactions.reduce((acc, t) => {
      const amountUSD = convertToUSD(t.amount, t.currency || 'USD');
      return t.type === 'income' ? acc + amountUSD : acc - amountUSD;
    }, 0);
    
    const totalSavedUSD = goals.reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0);
    const availableLiquidUSD = grossTotalUSD - totalSavedUSD;
    
    // Monthly stats for the primary card
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyIncomeUSD = transactions
      .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + convertToUSD(t.amount, t.currency), 0);
      
    const monthlyExpenseUSD = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + convertToUSD(t.amount, t.currency), 0);

    const dailyStats = {};
    const days = 7;
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyStats[dateStr] = { date: dateStr, name: d.toLocaleDateString(undefined, {weekday: 'short'}), income: 0, expense: 0 };
    }

    transactions.forEach(t => {
        const dateStr = t.date.split('T')[0];
        if (dailyStats[dateStr]) {
            const amountUSD = convertToUSD(t.amount, t.currency || 'USD');
            if (t.type === 'income') dailyStats[dateStr].income += amountUSD;
            else dailyStats[dateStr].expense += amountUSD;
        }
    });

    const timelineData = Object.values(dailyStats).reverse();

    return {
      grossTotalUSD,
      availableLiquidUSD,
      totalSavedUSD,
      monthlyIncomeUSD,
      monthlyExpenseUSD,
      timelineData,
      distributionData: [
        { name: 'Disponible', value: Math.max(0, availableLiquidUSD), color: '#10b981' },
        { name: 'En Metas', value: totalSavedUSD, color: 'var(--primary)' }
      ]
    };
  }, [data, rates]);

  const handleCreateOrUpdateGoal = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.type === 'goal') {
        await financeService.updateGoal(editingItem.data.id, newGoal);
        toast.success('Meta actualizada');
      } else {
        await financeService.createGoal(newGoal);
        toast.success('Meta creada');
      }
      setShowGoalForm(false);
      setEditingItem(null);
      fetchData();
    } catch { toast.error('Error en la operación'); }
  };

  const handleCreateOrUpdateTrans = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.type === 'transaction') {
        await financeService.updateTransaction(editingItem.data.id, newTrans);
        toast.success('Transacción actualizada');
      } else {
        await financeService.createTransaction(newTrans);
        toast.success('Transacción registrada');
      }
      setShowTransForm(false);
      setEditingItem(null);
      fetchData();
    } catch { toast.error('Error en la operación'); }
  };

  const handleAdjustGoal = async (e) => {
    e.preventDefault();
    if (!adjustData.amount) return;
    try {
      if (adjustType === 'add') {
        await financeService.createTransaction({
          type: 'income', amount: adjustData.amount, currency: adjustData.currency,
          category: 'Ahorro Manual', description: adjustData.description || 'Ajuste',
          goal_id: selectedGoal.id, date: new Date().toISOString().split('T')[0]
        });
      } else if (adjustType === 'spend') {
        await financeService.createTransaction({
          type: 'expense', amount: adjustData.amount, currency: adjustData.currency,
          category: 'Gasto de Meta', description: adjustData.description,
          goal_id: selectedGoal.id, date: new Date().toISOString().split('T')[0]
        });
      } else if (adjustType === 'redirect') {
        const rate = Number(rates[adjustData.currency]) || 1;
        const amountInUSD = adjustData.currency === 'USD' ? Number(adjustData.amount) : Number(adjustData.amount) / rate;
        await financeService.updateGoal(selectedGoal.id, {
          ...selectedGoal,
          current_amount: Math.max(0, Number(selectedGoal.current_amount) - amountInUSD)
        });
      }
      toast.success('Ajuste realizado');
      setShowAdjustModal(false);
      fetchData();
    } catch { toast.error('Error al ajustar'); }
  };

  const startEditGoal = (goal) => {
    setEditingItem({ type: 'goal', data: goal });
    setNewGoal({ ...goal });
    setShowGoalForm(true);
  };

  const startEditTrans = (tx) => {
    setEditingItem({ type: 'transaction', data: tx });
    setNewTrans({ ...tx, date: tx.date.split('T')[0], goal_id: tx.goal_id || '' });
    setShowTransForm(true);
  };

  const startAdjustGoal = (goal) => {
    setSelectedGoal(goal);
    setShowAdjustModal(true);
  };

  if (loading) return <div className="loading-state">Personalizando tu panel...</div>;

  return (
    <div className="finance-page animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '5rem' }}>
      
      {/* Header Premium */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Finanzas <span style={{ color: 'var(--primary)' }}>Personales</span>
          </h1>
          <div style={{ height: '3px', width: '40px', background: 'var(--primary)', borderRadius: '10px', marginTop: '2px' }}></div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="theme-toggle" onClick={() => setShowRatesPanel(true)} title="Tasas">
            <RefreshCw size={20} />
          </button>
          <button className="btn-primary" onClick={() => { setEditingItem(null); setShowGoalForm(true); }}>
            <Target size={18} /> Nueva Meta
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="finance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.2rem', borderBottom: '3px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
             <div style={{ padding: '0.4rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '10px' }}><TrendUp size={16} color="var(--primary)" /></div>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CAPITAL DISPONIBLE</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>${totals.availableLiquidUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
          <div style={{ marginTop: '0.8rem', display: 'flex', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Ingresos Mes</div>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>+${totals.monthlyIncomeUSD.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Gastos Mes</div>
              <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.85rem' }}>-${totals.monthlyExpenseUSD.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
             <div style={{ padding: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}><DollarSign size={16} color="#10b981" /></div>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PATRIMONIO BRUTO</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#10b981' }}>${totals.grossTotalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
          <div style={{ marginTop: '1rem' }}>
            <div className="progress-bar-container" style={{ height: '5px' }}>
              <div className="progress-bar-fill" style={{ width: `${(totals.availableLiquidUSD / totals.grossTotalUSD) * 100}%`, background: '#10b981' }}></div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '3px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
             <div style={{ padding: '0.4rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '10px' }}><PiggyBank size={16} color="var(--primary)" /></div>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>RESERVA EN METAS</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>${totals.totalSavedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
          <p style={{ margin: '0.8rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Para <strong>{data.goals.length} objetivos</strong>
          </p>
        </div>
      </div>

      <div className="finance-main-layout">
        {/* Gráfica 1: Flujo de Caja (7D) */}
        <section className="glass-panel area-flow" style={{ padding: '1.2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700 }}>Flujo de Caja (7D)</h3>
          <div style={{ height: '180px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={totals.timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 10}} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Gráfica 2: Distribución (Pie) */}
        <section className="glass-panel area-dist" style={{ padding: '1.2rem', textAlign: 'center' }}>
           <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Distribución</h3>
           <div style={{ height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={totals.distributionData} dataKey="value" innerRadius={45} outerRadius={60} paddingAngle={4}>
                    {totals.distributionData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
              {totals.distributionData.map((d, i) => (
                <div key={i} style={{ fontSize: '0.7rem', padding: '0.4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                  <div style={{ color: d.color, fontWeight: 800 }}>{d.name}</div>
                  <div>${d.value.toLocaleString()}</div>
                </div>
              ))}
           </div>
        </section>

        {/* Operaciones Recientes (Scrollable) */}
        <section className="glass-panel area-tx" style={{ padding: '1.2rem' }}>
           <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Operaciones Recientes</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
             {data.transactions.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.85rem' }}>No hay movimientos</div>
             ) : (
               data.transactions.map(t => (
                 <div key={t.id} style={{ 
                   display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', 
                   background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)'
                 }}>
                   <div style={{ 
                     padding: '0.5rem', borderRadius: '10px', 
                     background: t.type === 'income' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                     color: t.type === 'income' ? '#10b981' : '#ef4444'
                   }}>
                     {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                   </div>
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.category} <span style={{ opacity: 0.4, fontWeight: 400 }}>{t.source ? `| ${t.source}` : ''}</span></div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.description || new Date(t.date).toLocaleDateString()}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontWeight: 800, fontSize: '0.9rem', color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                       {t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()}
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: '0.2rem', marginLeft: '0.5rem' }}>
                     <button onClick={() => startEditTrans(t)} className="theme-toggle" style={{ padding: '0.3rem' }}><Edit2 size={12} /></button>
                     <button onClick={() => { if(window.confirm('¿Eliminar?')) { financeService.deleteTransaction(t.id).then(fetchData); } }} className="delete-btn-subtle" style={{ padding: '0.3rem' }}><Trash2 size={12} /></button>
                   </div>
                 </div>
               ))
             )}
           </div>
        </section>

        {/* Tasas de Cambio */}
        <section className="glass-panel area-rates" style={{ padding: '1.2rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Tasas</h3>
              <RefreshCw size={14} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={fetchData} title="Refrescar" />
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {Object.entries(rates).map(([curr, rate]) => (
                <div key={curr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{curr}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>/ USD</span>
                  </div>
                  <div style={{ fontWeight: 700 }}>{Number(rate).toLocaleString()}</div>
                </div>
              ))}
              <button type="button" className="btn-primary" onClick={() => setShowRatesPanel(true)} style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}>
                 Configurar Tasas
              </button>
           </div>
        </section>

        {/* Metas Activas (Scrollable) */}
        <section className="glass-panel area-goals" style={{ padding: '1.2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Metas Activas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {data.goals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.85rem' }}>Cero metas activas</div>
            ) : (
              data.goals.map(goal => {
                const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
                return (
                  <div key={goal.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
                         <span style={{ fontSize: '1.2rem' }}>{goal.icon}</span>
                         <h4 style={{ 
                           margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#fff',
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                         }}>
                           {goal.title}
                         </h4>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginLeft: '0.5rem' }}>
                        <button onClick={() => startAdjustGoal(goal)} style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }} title="Ajustar"><ArrowLeftRight size={13} /></button>
                        <button onClick={() => startEditGoal(goal)} style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }} title="Editar"><Edit2 size={13} /></button>
                        <button onClick={() => { if(window.confirm('¿Eliminar meta?')) { financeService.deleteGoal(goal.id).then(fetchData); } }} style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }} title="Eliminar"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                        <span>${Number(goal.current_amount).toLocaleString()}</span>
                        <span style={{ opacity: 0.5 }}>${Number(goal.target_amount).toLocaleString()}</span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '6px' }}>
                       <div className="progress-bar-fill" style={{ width: `${progress}%`, background: goal.color }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* --- MODALS --- */}
      
      {showTransForm && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <form className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }} onSubmit={handleCreateOrUpdateTrans}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>{editingItem ? 'Editar' : 'Nuevo'} Movimiento</h2>
              <button type="button" onClick={() => setShowTransForm(false)} style={{ background: 'transparent', border: 'none', color: '#fff' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '16px' }}>
              {['income', 'expense'].map(type => (
                <button key={type} type="button" onClick={() => setNewTrans({...newTrans, type})} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: newTrans.type === type ? (type === 'income' ? '#10b981' : '#ef4444') : 'transparent', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                  {type === 'income' ? 'Ingreso' : 'Egreso'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
               <div className="form-group">
                 <label>Monto</label>
                 <input type="number" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} required />
               </div>
               <div className="form-group">
                 <label>Divisa</label>
                 <select value={newTrans.currency} onChange={e => setNewTrans({...newTrans, currency: e.target.value})}>
                   <option value="USD">USD</option>
                   <option value="BS">BS</option>
                   <option value="COP">COP</option>
                   <option value="USDT">USDT</option>
                 </select>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Origen</label>
                <input type="text" value={newTrans.source} onChange={e => setNewTrans({...newTrans, source: e.target.value})} placeholder="Ej: Alcaldía" />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input type="text" value={newTrans.category} onChange={e => setNewTrans({...newTrans, category: e.target.value})} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Meta Asociada</label>
              <select value={newTrans.goal_id || ''} onChange={e => setNewTrans({...newTrans, goal_id: e.target.value || null})}>
                <option value="">Ninguna</option>
                {data.goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.2rem', background: newTrans.type === 'income' ? '#10b981' : '#ef4444' }}>
              {editingItem ? 'Actualizar' : 'Confirmar'}
            </button>
          </form>
        </div>
      )}

      {showAdjustModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <form className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }} onSubmit={handleAdjustGoal}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Ajustar: {selectedGoal?.title}</h3>
                <button type="button" onClick={() => setShowAdjustModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff' }}><X /></button>
             </div>
             <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
               {['add', 'spend', 'redirect'].map(t => (
                 <button key={t} type="button" onClick={() => setAdjustType(t)} style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem', borderRadius: '10px', background: adjustType === t ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}>
                   {t === 'add' ? 'Ahorrar' : t === 'spend' ? 'Gastar' : 'Liberar'}
                 </button>
               ))}
             </div>
             <div className="form-group" style={{ marginBottom: '1rem' }}>
               <label>Cantidad</label>
               <input type="number" value={adjustData.amount} onChange={e => setAdjustData({...adjustData, amount: e.target.value})} required />
             </div>
             <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>Ejecutar</button>
          </form>
        </div>
      )}

      {showGoalForm && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <form className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }} onSubmit={handleCreateOrUpdateGoal}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{editingItem ? 'Editar Meta' : 'Nueva Meta'}</h2>
                <div style={{ padding: '0.8rem', background: newGoal.color || 'var(--primary)', borderRadius: '15px', fontSize: '1.5rem', color: '#fff' }}>
                  {newGoal.icon || '🎯'}
                </div>
             </div>

             <div className="form-group" style={{ marginBottom: '1.5rem' }}>
               <label>Nombre de la Meta</label>
               <input type="text" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} placeholder="Ej: Viaje a Japón, Nueva PC..." required />
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
               <div className="form-group">
                 <label>Monto Objetivo (USD)</label>
                 <input type="number" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} placeholder="0.00" required />
               </div>
               <div className="form-group">
                 <label>Fecha Límite (Opcional)</label>
                 <input type="date" value={newGoal.deadline || ''} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} />
               </div>
             </div>

             <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Selecciona un Icono</label>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {['🎯', '💰', '🏠', '🚗', '🏍️', '📱', '📺', '🍲', '✈️', '💻', '🎓', '🏥', '🎮', '🎁', '🍕', '🏃', '📈', '🔒'].map(emoji => (
                    <div 
                      key={emoji} 
                      onClick={() => setNewGoal({...newGoal, icon: emoji})}
                      style={{ 
                        width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', cursor: 'pointer', borderRadius: '10px',
                        background: newGoal.icon === emoji ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid ' + (newGoal.icon === emoji ? 'var(--primary)' : 'rgba(255,255,255,0.05)'),
                        transform: newGoal.icon === emoji ? 'scale(1.1)' : 'scale(1)', transition: '0.2s'
                      }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
             </div>

             <div className="form-group" style={{ marginBottom: '2rem' }}>
               <label>Color de Seguimiento</label>
               <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                 {['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(c => (
                   <div 
                     key={c} 
                     onClick={() => setNewGoal({...newGoal, color: c})}
                     style={{ 
                       width: '32px', height: '32px', borderRadius: '50%', background: c, cursor: 'pointer',
                       border: newGoal.color === c ? '3px solid #fff' : 'none',
                       transform: newGoal.color === c ? 'scale(1.1)' : 'scale(1)', transition: '0.2s'
                     }} 
                   />
                 ))}
                 <input type="color" value={newGoal.color || '#8b5cf6'} onChange={e => setNewGoal({...newGoal, color: e.target.value})} style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }} />
               </div>
             </div>

             <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
               <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1.1rem', background: 'var(--primary)', color: '#fff', fontWeight: 800 }}>
                 {editingItem ? 'Actualizar Meta' : 'Crear Objetivo'}
               </button>
               <button 
                 type="button" 
                 onClick={() => setShowGoalForm(false)} 
                 style={{ 
                   flex: 0.5, padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', 
                   background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '14px', 
                   fontWeight: 700, cursor: 'pointer' 
                 }}
               >
                 Cancelar
               </button>
             </div>
          </form>
        </div>
      )}

      {showRatesPanel && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel animate-scale" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '2rem' }}>Tasas</h3>
            {Object.keys(rates).map(currency => (
              <div key={currency} className="form-group" style={{ marginBottom: '1rem' }}>
                <label>1 USD = ? {currency}</label>
                <input type="number" value={rates[currency]} onChange={e => setRates({...rates, [currency]: Number(e.target.value)})} />
              </div>
            ))}
            <button onClick={handleUpdateRates} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>Actualizar</button>
            <button onClick={() => setShowRatesPanel(false)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', marginTop: '1rem' }}>Cerrar</button>
          </div>
        </div>
      )}

    </div>
  );
}
