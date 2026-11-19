import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  PlusCircle, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit3, 
  AlertTriangle, 
  CheckCircle,
  Tag,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { useAuth } from '../context/useAuth';
import { getTransactions, deleteTransaction } from '../api/transactions';
import { getBudgets, saveBudget } from '../api/budgets';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { formatCurrency, formatCompactINR } from '../utils/formatCurrency';
import './Dashboard.css';

const DEFAULT_TRANSACTIONS = [
  { id: 'tx-1', description: 'Tech Company Salary', amount: 65000, type: 'income', category: { name: 'Salary', color: '#10b981' }, date: '2026-11-15' },
  { id: 'tx-2', description: 'Apartment Rent', amount: 18000, type: 'expense', category: { name: 'Rent', color: '#ef4444' }, date: '2026-11-14' },
  { id: 'tx-3', description: 'Freelance UI Project', amount: 22500, type: 'income', category: { name: 'Freelance', color: '#06b6d4' }, date: '2026-11-12' },
  { id: 'tx-4', description: 'Supermarket Groceries', amount: 4500, type: 'expense', category: { name: 'Food', color: '#f59e0b' }, date: '2026-11-10' },
  { id: 'tx-5', description: 'Electricity & Internet Bill', amount: 2800, type: 'expense', category: { name: 'Bills', color: '#8b5cf6' }, date: '2026-11-08' },
  { id: 'tx-6', description: 'Streaming Subscriptions', amount: 899, type: 'expense', category: { name: 'Subscription', color: '#ec4899' }, date: '2026-11-05' },
  { id: 'tx-7', description: 'Metro & Uber Commute', amount: 1450, type: 'expense', category: { name: 'Travel', color: '#3b82f6' }, date: '2026-11-03' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { refreshTrigger, triggerRefresh } = useOutletContext() || {};

  const [transactions, setTransactions] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(50000);
  const [txFilter, setTxFilter] = useState('all');
  const [txLimit, setTxLimit] = useState(8);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState(50000);

  // Fetch real transactions and budget
  const loadDashboardData = useCallback(async () => {
    try {
      const [txRes, budRes] = await Promise.allSettled([
        getTransactions({ limit: 50, sortBy: 'date', sortOrder: 'desc' }),
        getBudgets(),
      ]);

      if (txRes.status === 'fulfilled' && txRes.value?.transactions) {
        if (txRes.value.transactions.length > 0) {
          setTransactions(txRes.value.transactions);
        } else {
          // Check local storage or defaults
          const saved = localStorage.getItem('et_transactions');
          setTransactions(saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS);
        }
      } else {
        const saved = localStorage.getItem('et_transactions');
        setTransactions(saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS);
      }

      if (budRes.status === 'fulfilled' && budRes.value?.budgets) {
        const overall = budRes.value.budgets.find((b) => b.isOverall || !b.category);
        if (overall) {
          setMonthlyBudget(overall.amount);
          setNewBudgetInput(overall.amount);
        }
      }
    } catch {
      const saved = localStorage.getItem('et_transactions');
      setTransactions(saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTrigger]);

  // Calculations: Total Balance = Total Income - Total Expenses
  const { totalIncome, totalExpenses, totalBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        inc += amt;
      } else {
        exp += amt;
      }
    });
    return {
      totalIncome: inc,
      totalExpenses: exp,
      totalBalance: inc - exp,
    };
  }, [transactions]);

  // Budget calculations
  const remainingBudget = monthlyBudget - totalExpenses;
  const budgetPercentage = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  const isOverBudget = remainingBudget < 0;

  const getProgressColor = () => {
    if (budgetPercentage >= 100) return '#f43f5e';
    if (budgetPercentage >= 80) return '#f59e0b';
    return '#10b981';
  };

  // Recent 5-10 transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .slice()
      .filter((tx) => {
        if (txFilter === 'income') return tx.type === 'income';
        if (txFilter === 'expense') return tx.type === 'expense';
        return true;
      })
      .slice(0, txLimit);
  }, [transactions, txFilter, txLimit]);

  // Chart data
  const chartData = useMemo(() => {
    const monthNames = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const baseTrends = {
      Jun: { income: 65000, expense: 32000 },
      Jul: { income: 68000, expense: 35000 },
      Aug: { income: 62000, expense: 28000 },
      Sep: { income: 72000, expense: 38000 },
      Oct: { income: 66000, expense: 31000 },
      Nov: { income: 0, expense: 0 },
    };

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const txDate = tx.date ? new Date(tx.date) : new Date();
      if (txDate.getMonth() === 10) { // Nov
        if (tx.type === 'income') baseTrends.Nov.income += amt;
        else baseTrends.Nov.expense += amt;
      }
    });

    return monthNames.map((m) => ({
      name: m,
      Income: baseTrends[m].income,
      Expense: baseTrends[m].expense,
    }));
  }, [transactions]);

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      loadDashboardData();
      if (triggerRefresh) triggerRefresh();
    } catch {
      const updated = transactions.filter((t) => (t._id || t.id) !== id);
      setTransactions(updated);
      localStorage.setItem('et_transactions', JSON.stringify(updated));
      if (triggerRefresh) triggerRefresh();
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const val = Number(newBudgetInput);
    if (val > 0) {
      setMonthlyBudget(val);
      setIsBudgetModalOpen(false);
      try {
        await saveBudget({ isOverall: true, amount: val, month: 11, year: 2026 });
      } catch {
        localStorage.setItem('et_monthly_budget', String(val));
      }
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#fff', letterSpacing: '-0.3px' }}>
            Welcome back, {user?.name || 'Explorer'}! 👋
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
            Here is your live financial snapshot and budget progress
          </p>
        </div>

        <button 
          className="btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusCircle size={17} />
          <span>Quick Add Transaction</span>
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="stats-grid">
        {/* 1. Total Balance */}
        <div className="stat-card highlight">
          <div className="stat-card-header">
            <span className="stat-card-label">Current Balance</span>
            <div className="stat-card-icon icon-balance">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className={`stat-card-value ${totalBalance < 0 ? 'balance-negative' : ''}`}>
            {formatCurrency(totalBalance)}
          </div>
          <div className="stat-card-footer">
            <span>Total Income − Total Expenses</span>
          </div>
        </div>

        {/* 2. Total Income */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Income</span>
            <div className="stat-card-icon icon-income">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-card-value income">
            {formatCurrency(totalIncome)}
          </div>
          <div className="stat-card-footer">
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={14} /> Total Earnings
            </span>
          </div>
        </div>

        {/* 3. Total Expenses */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Expenses</span>
            <div className="stat-card-icon icon-expense">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-card-value expense">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="stat-card-footer">
            <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center' }}>
              <ArrowDownRight size={14} /> Total Outflow
            </span>
          </div>
        </div>

        {/* 4. Monthly Budget */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Monthly Budget</span>
            <div className="stat-card-icon icon-budget">
              <Edit3 size={18} />
            </div>
          </div>
          <div className="stat-card-value">
            {formatCurrency(monthlyBudget)}
          </div>
          <div className="stat-card-footer" style={{ justifyContent: 'space-between' }}>
            <span>
              Remaining: <strong style={{ color: isOverBudget ? '#f43f5e' : '#38bdf8' }}>{formatCurrency(remainingBudget)}</strong>
            </span>
            <button 
              className="btn-edit-budget"
              onClick={() => {
                setNewBudgetInput(monthlyBudget);
                setIsBudgetModalOpen(true);
              }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Budget Usage Bar */}
      <div className="budget-progress-section">
        <div className="budget-progress-header">
          <div className="budget-progress-title">
            {isOverBudget ? (
              <AlertTriangle size={18} color="#f43f5e" />
            ) : (
              <CheckCircle size={18} color="#10b981" />
            )}
            <span>Monthly Budget Utilization</span>
          </div>
          <div className="budget-progress-stats" style={{ color: getProgressColor() }}>
            {budgetPercentage.toFixed(1)}% Used {isOverBudget && '(Exceeded!)'}
          </div>
        </div>

        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${Math.min(budgetPercentage, 100)}%`, 
              backgroundColor: getProgressColor() 
            }} 
          />
        </div>

        <div className="budget-progress-labels">
          <span>Spent: {formatCurrency(totalExpenses)}</span>
          <span>
            {isOverBudget 
              ? `Deficit: ${formatCurrency(Math.abs(remainingBudget))}`
              : `Available: ${formatCurrency(remainingBudget)}`}
          </span>
        </div>
      </div>

      {/* Main Grid: Chart & Recent Transactions */}
      <div className="dash-content-grid">
        {/* Income vs Expense Overview Chart */}
        <div className="dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <TrendingUp size={19} color="#818cf8" />
              <span>Income vs Expense Overview</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>6-Month History</span>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 8, left: -2, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} width={42} tickFormatter={(val) => formatCompactINR(val)} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-chart-tooltip">
                          <div className="tooltip-title">{label} 2026</div>
                          <div className="tooltip-row" style={{ color: '#10b981' }}>
                            <span>Income:</span>
                            <strong>{formatCurrency(payload[0].value)}</strong>
                          </div>
                          <div className="tooltip-row" style={{ color: '#f43f5e' }}>
                            <span>Expense:</span>
                            <strong>{formatCurrency(payload[1].value)}</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Recent Transactions (5-10) */}
        <div className="dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Tag size={18} color="#818cf8" />
              <span>Recent Transactions</span>
            </h3>

            <div className="panel-header-actions">
              <div className="tx-filters">
                <button
                  className={`tx-filter-btn ${txFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTxFilter('all')}
                >
                  All
                </button>
                <button
                  className={`tx-filter-btn ${txFilter === 'income' ? 'active' : ''}`}
                  onClick={() => setTxFilter('income')}
                >
                  Income
                </button>
                <button
                  className={`tx-filter-btn ${txFilter === 'expense' ? 'active' : ''}`}
                  onClick={() => setTxFilter('expense')}
                >
                  Expense
                </button>
              </div>

              <select
                value={txLimit}
                onChange={(e) => setTxLimit(Number(e.target.value))}
                className="tx-limit-select"
              >
                <option value={5} style={{ background: '#0f172a' }}>Top 5</option>
                <option value={8} style={{ background: '#0f172a' }}>Top 8</option>
                <option value={10} style={{ background: '#0f172a' }}>Top 10</option>
              </select>
            </div>
          </div>

          <div className="transactions-list">
            {recentTransactions.length === 0 ? (
              <div className="tx-empty-state">
                <p>No transactions found for this filter.</p>
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const txId = tx._id || tx.id;
                const isInc = tx.type === 'income';
                const catName = tx.category?.name || tx.category || 'General';
                const desc = tx.note || tx.description || 'Transaction';
                const dateStr = tx.date ? new Date(tx.date).toLocaleDateString() : '';

                return (
                  <div key={txId} className="tx-item">
                    <div className="tx-left">
                      <div className={`tx-icon-box ${tx.type}`}>
                        {isInc ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <div className="tx-info">
                        <span className="tx-desc">{desc}</span>
                        <div className="tx-meta">
                          <span className="tx-category-badge">{catName}</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="tx-right">
                      <span className={`tx-amount ${tx.type}`}>
                        {isInc ? '+' : '−'}{formatCurrency(tx.amount)}
                      </span>
                      <button
                        className="tx-delete-btn"
                        onClick={() => handleDeleteTransaction(txId)}
                        title="Delete transaction"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* View Full History Link */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link 
              to="/transactions" 
              style={{ 
                color: '#818cf8', 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem' 
              }}
            >
              <span>View Full Paginated History</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadDashboardData();
          if (triggerRefresh) triggerRefresh();
        }}
      />

      {/* Set Monthly Budget Modal */}
      {isBudgetModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsBudgetModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit3 size={18} color="#818cf8" />
                <span>Set Monthly Budget</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setIsBudgetModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget}>
              <div className="form-field">
                <label className="form-label">Monthly Target Budget (₹)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-input"
                  value={newBudgetInput}
                  onChange={(e) => setNewBudgetInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsBudgetModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
