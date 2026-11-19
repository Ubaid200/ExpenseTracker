import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Repeat, 
  PlusCircle, 
  Calendar, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  Loader2, 
  Check, 
  Clock,
  Wallet
} from 'lucide-react';
import { 
  getRecurringTransactions, 
  createRecurringTransaction, 
  updateRecurringTransaction, 
  deleteRecurringTransaction 
} from '../api/recurring';
import { getCategories } from '../api/categories';
import { getAccounts } from '../api/accounts';
import { formatCurrency } from '../utils/formatCurrency';
import './RecurringPage.css';

export const RecurringPage = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext() || {};

  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    type: 'expense',
    amount: '',
    frequency: 'monthly',
    category: '',
    account: '',
    nextDueDate: new Date().toISOString().split('T')[0],
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Categories & Accounts
  useEffect(() => {
    Promise.allSettled([getCategories(), getAccounts()])
      .then(([catRes, accRes]) => {
        if (catRes.status === 'fulfilled' && catRes.value?.categories) {
          setCategories(catRes.value.categories);
        }
        if (accRes.status === 'fulfilled' && accRes.value?.accounts) {
          setAccounts(accRes.value.accounts);
          if (accRes.value.accounts.length > 0 && !formData.account) {
            setFormData((prev) => ({ ...prev, account: accRes.value.accounts[0]._id }));
          }
        }
      });
  }, []);

  const fetchRecurring = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getRecurringTransactions();
      if (res?.recurring) {
        setRecurring(res.recurring);
      }
    } catch (err) {
      console.warn('Error fetching recurring:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring, refreshTrigger]);

  const availableCategories = categories.filter((c) => c.type === formData.type);

  useEffect(() => {
    if (availableCategories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: availableCategories[0]._id }));
    }
  }, [formData.type, categories]);

  const handleToggleActive = async (item) => {
    try {
      await updateRecurringTransaction(item._id, { isActive: !item.isActive });
      fetchRecurring();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update rule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring rule?')) return;
    try {
      await deleteRecurringTransaction(id);
      fetchRecurring();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete rule');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount) {
      setErrorMsg('Please provide description and amount');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createRecurringTransaction({
        ...formData,
        amount: Number(formData.amount),
        category: formData.category || availableCategories[0]?._id,
        account: formData.account || accounts[0]?._id,
      });

      setIsModalOpen(false);
      setFormData({
        description: '',
        type: 'expense',
        amount: '',
        frequency: 'monthly',
        category: '',
        account: accounts[0]?._id || '',
        nextDueDate: new Date().toISOString().split('T')[0],
      });
      fetchRecurring();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to create recurring rule');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div>
      {/* Title */}
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
            Recurring Transactions
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
            Automate recurring bills, rent, subscriptions, and salaries on Daily, Weekly, Monthly, or Yearly schedules
          </p>
        </div>

        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={18} />
          <span>New Recurring Rule</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
          <Loader2 size={24} className="spinner-icon" style={{ margin: '0 auto 0.75rem' }} />
          <p>Checking and processing recurring schedules...</p>
        </div>
      ) : recurring.length === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '3rem',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          <Repeat size={40} color="#818cf8" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Recurring Transactions</h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Set up automatic rules for recurring payments like Apartment Rent, Salary, Netflix, or EMI. The backend will auto-post them on due date!
          </p>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Create First Rule
          </button>
        </div>
      ) : (
        <div className="recurring-grid">
          {recurring.map((item) => {
            const isInc = item.type === 'income';
            const catName = item.category?.name || 'Category';
            const catColor = item.category?.color || '#6366f1';
            const accName = item.account?.name || 'Account';
            const dueDate = item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : 'N/A';

            return (
              <div
                key={item._id}
                className="recurring-card"
                style={{
                  opacity: item.isActive ? 1 : 0.65
                }}
              >
                <div>
                  <div className="recurring-card-header">
                    <div className="recurring-badge-group">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        borderRadius: '8px',
                        background: isInc ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: isInc ? '#10b981' : '#f43f5e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isInc ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
                      </div>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: `${catColor}20`,
                        color: catColor,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {catName}
                      </span>
                    </div>

                    {/* Frequency Badge */}
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '12px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      flexShrink: 0
                    }}>
                      {item.frequency}
                    </span>
                  </div>

                  <h3 className="recurring-title">
                    {item.description}
                  </h3>

                  <div className="recurring-amount" style={{ color: isInc ? '#10b981' : '#f43f5e' }}>
                    {isInc ? '+' : '−'}{formatCurrency(item.amount)}
                  </div>

                  <div className="recurring-meta">
                    <div className="recurring-meta-row">
                      <Wallet size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Account: <strong style={{ color: '#cbd5e1' }}>{accName}</strong></span>
                    </div>
                    <div className="recurring-meta-row">
                      <Clock size={13} color="#818cf8" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Next Due Date: <strong style={{ color: '#cbd5e1' }}>{dueDate}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Active Toggle & Delete */}
                <div className="recurring-footer">
                  <button
                    onClick={() => handleToggleActive(item)}
                    style={{
                      background: item.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${item.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: item.isActive ? '#34d399' : '#94a3b8',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {item.isActive && <Check size={13} />}
                    <span>{item.isActive ? 'Active' : 'Paused'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item._id)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.35rem' }}
                    title="Delete rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Recurring Rule */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '490px', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                <Repeat size={18} color="#818cf8" />
                <span>Create Recurring Rule</span>
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

            <form onSubmit={handleSubmit}>
              <div className="type-toggle-group">
                <button
                  type="button"
                  className={`type-toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                >
                  <ArrowDownRight size={16} />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  className={`type-toggle-btn ${formData.type === 'income' ? 'active income' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                >
                  <ArrowUpRight size={16} />
                  <span>Income</span>
                </button>
              </div>

              <div className="form-field">
                <label className="form-label">Description / Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Rent, Netflix, Salary, Car EMI"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Recurrence Frequency *</label>
                <select
                  className="form-select"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <option value="daily" style={{ background: '#0f172a' }}>Daily</option>
                  <option value="weekly" style={{ background: '#0f172a' }}>Weekly</option>
                  <option value="monthly" style={{ background: '#0f172a' }}>Monthly</option>
                  <option value="yearly" style={{ background: '#0f172a' }}>Yearly</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {availableCategories.map((c) => (
                    <option key={c._id} value={c._id} style={{ background: '#0f172a' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Account *</label>
                <select
                  className="form-select"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  required
                >
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id} style={{ background: '#0f172a' }}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">First Scheduled Due Date *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                    required
                  />
                  <Calendar size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
                </div>
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
                    <span>Create Recurring Schedule</span>
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
