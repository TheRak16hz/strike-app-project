import PropTypes from 'prop-types';
import KpiCards from '../../components/finance/KpiCards';
import FinanceCharts from '../../components/finance/FinanceCharts';
import TransactionList from '../../components/finance/TransactionList';
import GoalList from '../../components/finance/GoalList';

export default function FinanceOverview({
  totals,
  data,
  onEditTrans,
  onDeleteTrans,
  onAdjustGoal,
  onEditGoal,
  onDeleteGoal,
  onShowReport,
}) {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          id="finance-report-btn"
          onClick={onShowReport}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'rgba(var(--primary-rgb), 0.1)',
            color: 'var(--primary)',
            border: '1px solid var(--primary)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)';
          }}
        >
          📈 Ver Reporte Mensual
        </button>
      </div>

      <KpiCards totals={totals} goalsCount={data.goals.length} />

      <div className="finance-main-layout">
        <FinanceCharts totals={totals} />

        <TransactionList
          transactions={data.transactions}
          onEdit={onEditTrans}
          onDelete={onDeleteTrans}
        />

        <GoalList
          goals={totals.goalsForecast}
          onAdjust={onAdjustGoal}
          onEdit={onEditGoal}
          onDelete={onDeleteGoal}
        />
      </div>
    </div>
  );
}

FinanceOverview.propTypes = {
  totals: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  onEditTrans: PropTypes.func.isRequired,
  onDeleteTrans: PropTypes.func.isRequired,
  onAdjustGoal: PropTypes.func.isRequired,
  onEditGoal: PropTypes.func.isRequired,
  onDeleteGoal: PropTypes.func.isRequired,
  onShowReport: PropTypes.func.isRequired,
};
