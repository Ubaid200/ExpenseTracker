import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  PieChart, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  X, 
  Loader2,
  Calendar
} from 'lucide-react';
import { getBudgets, saveBudget, deleteBudget } from '../api/budgets';
import { getCategories } from '../api/categories';
import { formatCurrency } from '../utils/formatCurrency';

export const BudgetsPage = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext() || {};

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthName, setMonthName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverallBudget, setIsOverallBudget] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Categories for per-category dropdown
  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res?.categories) {
          setCategories(res.categories.filter((c) => c.type === 'expense'));
        }
      })
      .catch((err) => console.warn('Could not load categories:', err));
  }, []);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBudgets({ month, year });
      if (res?.budgets) {
        setBudgets(res.budgets);
        setMonthName(res.monthName || '');
      }
    } catch (err) {
      console.warn('Error fetching budgets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, refreshTrigger]);

  const overallBudget = budgets.find((b) => b.isOverall || !b.category);
  const categoryBudgets = budgets.filter((b) => !b.isOverall && b.category);

  const handleOpenSetOverall = () => {
    setIsOverallBudget(true);
    setSelectedCategory('');
    setBudgetAmount(overallBudget ? overallBudget.amount : 3000);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenAddCategoryBudget = () => {
    setIsOverallBudget(false);
    if (categories.length > 0) {
      setSelectedCategory(categories[0]._id);
    }
    setBudgetAmount('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmitBudget = async (e) => {
    e.preventDefault();
    const amt = Number(budgetAmount);
    if (!amt || amt <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await saveBudget({
        isOverall: isOverallBudget,
        category: isOverallBudget ? null : selectedCategory,
        amount: amt,
        month,
        year,
      });

      setIsModalOpen(false);
      fetchBudgets();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this category budget?')) return;
    try {
      await deleteBudget(id);
      fetchBudgets();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete budget');
    }
  };


  const getProgressColor = (pct) => {
    if (pct >= 100) return '#f43f5e'; // red
    if (pct >= 90) return '#ea580c'; // dark orange
    if (pct >= 75) return '#f59e0b'; // amber
    if (pct >= 50) return '#eab308'; // yellow
    return '#10b981'; // green
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: '#fff' }}>
            Budgets & Limits
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
            Overall monthly tracking with 50%, 75%, 90% and 100%+ warnings & per-category caps
          </p>
        </div>

        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Calendar size={15} color="#818cf8" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((mName, idx) => (
                <option key={mName} value={idx + 1} style={{ background: '#0f172a' }}>
                  {mName} {year}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary" onClick={handleOpenAddCategoryBudget}>
            <PlusCircle size={16} />
            <span>Category Budget</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
          <Loader2 size={24} className="spinner-icon" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading budget utilization...</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: OVERALL MONTHLY BUDGET WITH WARNINGS */}
          {overallBudget && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${overallBudget.percentageUsed >= 90 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '16px',
              padding: '1.75rem 2rem',
              marginBottom: '2.5rem',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 25px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PieChart size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                      Overall {monthName} Budget
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total monthly expense ceiling</span>
                  </div>
                </div>

                <button
                  onClick={handleOpenSetOverall}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Edit3 size={14} />
                  <span>Edit Target</span>
                </button>
              </div>

              {/* Warning Alert Banner (50%, 75%, 90%, 100%+) */}
              {overallBudget.warningLevel !== 'normal' && (
                <div style={{
                  background: overallBudget.warningLevel === 'danger' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: `1px solid ${overallBudget.warningLevel === 'danger' ? 'rgba(244, 63, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                  color: overallBudget.warningLevel === 'danger' ? '#f87171' : '#fbbf24',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem'
                }}>
                  {overallBudget.warningLevel === 'danger' ? (
                    <AlertCircle size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                  <span>{overallBudget.warningMessage}</span>
                </div>
              )}

              {/* Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Target Budget</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
                    {formatCurrency(overallBudget.amount)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Spent</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f43f5e' }}>
                    {formatCurrency(overallBudget.spent)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {overallBudget.remaining < 0 ? 'Exceeded By' : 'Remaining'}
                  </span>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: overallBudget.remaining < 0 ? '#f43f5e' : '#10b981'
                  }}>
                    {formatCurrency(Math.abs(overallBudget.remaining))}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Utilization</span>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: getProgressColor(overallBudget.percentageUsed)
                  }}>
                    {overallBudget.percentageUsed}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(overallBudget.percentageUsed, 100)}%`, 
                    backgroundColor: getProgressColor(overallBudget.percentageUsed),
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
            </div>
          )}

          {/* SECTION 2: PER-CATEGORY BUDGETS TRACKED INDEPENDENTLY */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Per-Category Budgets
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {categoryBudgets.length} category limit{categoryBudgets.length !== 1 ? 's' : ''} tracked
              </span>
            </div>

            {categoryBudgets.length === 0 ? (
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: '12px',
                padding: '2.5rem',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                <p style={{ margin: '0 0 0.75rem 0', color: '#cbd5e1' }}>No individual category budgets set for this month.</p>
                <button className="btn-primary" onClick={handleOpenAddCategoryBudget}>
                  + Set Category Budget (e.g. Food — $400/month)
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.25rem'
              }}>
                {categoryBudgets.map((b) => {
                  const catName = b.category?.name || 'Category';
                  const catColor = b.category?.color || '#6366f1';
                  const pct = b.percentageUsed || 0;
                  const isOver = b.remaining < 0;

                  return (
                    <div
                      key={b._id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: `1px solid ${pct >= 90 ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '14px',
                        padding: '1.35rem',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            background: `${catColor}25`,
                            color: catColor,
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {catName}
                          </span>

                          <button
                            onClick={() => handleDeleteBudget(b._id)}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
                            title="Delete category budget"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Status Message */}
                        {pct >= 90 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                            <AlertCircle size={14} />
                            <span>{b.warningMessage}</span>
                          </div>
                        ) : pct >= 50 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                            <AlertTriangle size={14} />
                            <span>{b.warningMessage}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                            <CheckCircle size={14} />
                            <span>On target</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                          <span style={{ color: '#94a3b8' }}>Spent: <strong>{formatCurrency(b.spent)}</strong></span>
                          <span style={{ color: '#fff' }}>Limit: <strong>{formatCurrency(b.amount)}</strong></span>
                        </div>
                      </div>

                      <div>
                        {/* Progress */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: getProgressColor(pct) }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
                          <span>{pct}% Used</span>
                          <span style={{ color: isOver ? '#f43f5e' : '#10b981', fontWeight: 600 }}>
                            {isOver ? `Over by ${formatCurrency(Math.abs(b.remaining))}` : `${formatCurrency(b.remaining)} left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Set Overall Budget or Category Budget */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <PieChart size={18} color="#818cf8" />
                <span>{isOverallBudget ? `Set Overall ${monthName} Budget` : 'Set Category Budget'}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitBudget}>
              {!isOverallBudget && (
                <div className="form-field">
                  <label className="form-label">Expense Category *</label>
                  <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id} style={{ background: '#0f172a' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-field">
                <label className="form-label">Monthly Target Amount (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 400"
                  className="form-input"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinner-icon" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Budget</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
