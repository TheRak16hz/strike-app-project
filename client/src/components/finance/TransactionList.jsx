import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Edit2, Trash2, Search } from 'lucide-react';

export default function TransactionList({ transactions, onEdit, onDelete }) {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.source?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesType && matchesSearch && matchesCategory;
    });
  }, [transactions, filterType, searchTerm, filterCategory]);

  return (
    <section className="glass-panel area-tx" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
       {/* Header — column layout: title + filters stacked */}
       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.2rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             Operaciones Recientes
           </h3>
         </div>

         {/* Filter controls — full width row that wraps if needed */}
         <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 120px', minWidth: '100px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', opacity: 0.4, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.8rem 0.45rem 2.1rem', fontSize: '0.8rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ flex: '1 1 110px', padding: '0.45rem 0.7rem', fontSize: '0.8rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', minWidth: '100px' }}
            >
              <option value="all">Tipo: Todos</option>
              <option value="income">✅ Ingresos</option>
              <option value="expense">💸 Egresos</option>
              <option value="saving">🐷 Ahorros</option>
              <option value="goal_withdrawal">↩ Retiros</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ flex: '1 1 130px', padding: '0.45rem 0.7rem', fontSize: '0.8rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', minWidth: '110px' }}
            >
              <option value="all">Categoría: Todas</option>
              {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.25rem' }}>
         {filteredTransactions.length === 0 ? (
           <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.85rem' }}>No hay movimientos</div>
         ) : (
           filteredTransactions.map(t => (
             <div key={t.id} style={{ 
               display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', 
               background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)'
             }}>
               <div style={{ 
                 padding: '0.5rem', borderRadius: '10px', 
                 background: t.type === 'income' ? 'rgba(16, 185, 129, 0.08)' : (t.type === 'goal_withdrawal' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)'),
                 color: t.type === 'income' ? '#10b981' : (t.type === 'goal_withdrawal' ? '#3b82f6' : '#ef4444')
               }}>
                 {t.type === 'income' || t.type === 'goal_withdrawal' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
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
                 <button onClick={() => onEdit(t)} className="theme-toggle" style={{ padding: '0.3rem' }}><Edit2 size={12} /></button>
                 <button onClick={() => onDelete(t.id)} className="delete-btn-subtle" style={{ padding: '0.3rem' }}><Trash2 size={12} /></button>
               </div>
             </div>
           ))
         )}
       </div>
    </section>
  );
}

TransactionList.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    currency: PropTypes.string,
    source: PropTypes.string,
    description: PropTypes.string,
    date: PropTypes.string.isRequired,
  })).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
