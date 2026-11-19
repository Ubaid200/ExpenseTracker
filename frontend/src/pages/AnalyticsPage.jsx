import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  PieChart as PieIcon, 
  BarChart2, 
  Percent, 
  Loader2 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { getExpenseSummary, getCategoryBreakdown, getMonthlyTrends } from '../api/analytics';
import { formatCurrency, formatCompactINR } from '../utils/formatCurrency';
import './AnalyticsPage.css';

const PIE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', 
  '#8b5cf6', '#06b6d4', '#f97316', '#ef4444', '#14b8a6', '#a855f7'
];

export const AnalyticsPage = () => {
  const { refreshTrigger } = useOutletContext() || {};

  const [period, setPeriod] = useState('month'); // 'week' | 'month' | '3months' | 'year'
  const [summary, setSummary] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
  });
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumRes, catRes, trendRes] = await Promise.allSettled([
        getExpenseSummary(),
        getCategoryBreakdown({ type: 'expense' }),
        getMonthlyTrends({ period }),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.success) {
        setSummary(sumRes.value);
      }
      if (catRes.status === 'fulfilled' && catRes.value?.categories) {
        setCategories(catRes.value.categories);
      }
      if (trendRes.status === 'fulfilled' && trendRes.value?.trends) {
        setTrends(trendRes.value.trends);
      }
    } catch (err) {
      console.warn('Analytics API error, reading from local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, refreshTrigger]);


  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: '#fff' }}>
          Financial Analytics
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
          Real-time metrics computed directly from stored transactions
        </p>
      </div>

      {/* Top 4 Summary KPI Cards */}
      <div className="analytics-kpi-grid">
        {/* 1. Monthly Income */}
        <div className="analytics-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Monthly Income</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
            {formatCurrency(summary.monthlyIncome)}
          </div>
        </div>

        {/* 2. Monthly Expenses */}
        <div className="analytics-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Monthly Expenses</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f43f5e' }}>
            {formatCurrency(summary.monthlyExpenses)}
          </div>
        </div>

        {/* 3. Net Savings */}
        <div className="analytics-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Net Savings</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PiggyBank size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: summary.netSavings >= 0 ? '#fff' : '#f43f5e' }}>
            {formatCurrency(summary.netSavings)}
          </div>
        </div>

        {/* 4. Savings Rate */}
        <div className="analytics-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Savings Rate</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Percent size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#38bdf8' }}>
            {summary.savingsRate}%
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="analytics-charts-grid">
        {/* Chart 1: Category-wise Breakdown (Donut) */}
        <div className="analytics-card">
          <div className="analytics-header">
            <h3 className="analytics-title">
              <PieIcon size={18} color="#818cf8" />
              <span>Category Breakdown</span>
            </h3>
            <span className="analytics-subtitle">Expenses by Category</span>
          </div>

          {isLoading ? (
            <div className="analytics-loading-box">
              <Loader2 className="spinner-icon" size={24} />
            </div>
          ) : categories.length === 0 ? (
            <div className="analytics-empty-box">
              No expense categories to show
            </div>
          ) : (
            <div>
              <div className="analytics-pie-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="75%"
                      paddingAngle={3}
                    >
                      {categories.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${formatCurrency(value)}`, name]}
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend List */}
              <div className="category-legend-grid">
                {categories.map((c, idx) => (
                  <div key={c._id || idx} className="category-legend-item">
                    <div 
                      className="category-legend-dot"
                      style={{ background: c.color || PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="category-legend-name">
                      {c.name}:
                    </span>
                    <strong className="category-legend-pct">{c.percentage}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Spending Trends (Switchable Week | Month | 3 Months | Year) */}
        <div className="analytics-card">
          <div className="analytics-header">
            <h3 className="analytics-title">
              <BarChart2 size={18} color="#818cf8" />
              <span>Spending Trends</span>
            </h3>

            {/* Timeframe Switcher (Week | Month | 3 Months | Year) */}
            <div className="timeframe-switcher">
              {[
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: '3months', label: '3 Months' },
                { id: 'year', label: 'Year' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPeriod(t.id)}
                  className={`timeframe-btn ${period === t.id ? 'active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="analytics-loading-box">
              <Loader2 className="spinner-icon" size={24} />
            </div>
          ) : trends.length === 0 ? (
            <div className="analytics-empty-box">
              No trend data available for this timeframe
            </div>
          ) : (
            <div className="analytics-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 8, left: -2, bottom: 0 }} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} width={42} tickFormatter={(v) => formatCompactINR(v)} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px' }}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(val) => <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{val}</span>}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
