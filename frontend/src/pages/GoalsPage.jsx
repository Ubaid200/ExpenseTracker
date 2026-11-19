import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Target, 
  PlusCircle, 
  Calendar, 
  Trash2, 
  Edit3, 
  Coins, 
  X, 
  Loader2
} from 'lucide-react';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api/goals';
import { getAccounts } from '../api/accounts';
import { formatCurrency } from '../utils/formatCurrency';
import './GoalsPage.css';

export const GoalsPage = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext() || {};

  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    color: '#6366f1',
  });

  // Deposit Modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccountId, setDepositAccountId] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getAccounts().then((res) => {
      if (res?.accounts) {
        setAccounts(res.accounts);
        if (res.accounts.length > 0) {
          setDepositAccountId(res.accounts[0]._id);
        }
      }
    });
  }, []);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getGoals();
      if (res?.goals) {
        setGoals(res.goals);
      }
    } catch (err) {
      console.warn('Error fetching goals:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals, refreshTrigger]);

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      color: '#6366f1',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
      color: goal.color || '#6366f1',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenDeposit = (goal) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    setErrorMsg('');
    setDepositModalOpen(true);
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.targetAmount) {
      setErrorMsg('Please provide goal name and target amount');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingGoal) {
        await updateGoal(editingGoal._id, formData);
      } else {
        await createGoal(formData);
      }
      setIsModalOpen(false);
      fetchGoals();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      setErrorMsg('Please enter a valid deposit amount');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await updateGoal(selectedGoal._id, {
        depositAmount: amt,
        accountId: depositAccountId || undefined,
      });
      setDepositModalOpen(false);
      fetchGoals();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to deposit savings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await deleteGoal(id);
      fetchGoals();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete goal');
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
            Savings Goals
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
            Set financial milestones, track saved amounts, and deposit funds towards your targets
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          <span>New Savings Goal</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
          <Loader2 size={24} className="spinner-icon" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '3rem',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          <Target size={40} color="#818cf8" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Savings Goals Yet</h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Plan ahead for big purchases, emergencies, or vacations (e.g. New Laptop — Target ₹1,500 / Saved ₹850 / Progress 56%).
          </p>
          <button className="btn-primary" onClick={handleOpenAdd}>
            + Create First Goal
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => {
            const isDone = goal.isCompleted || goal.progressPercentage >= 100;
            const targetDateStr = goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No deadline';

            return (
              <div
                key={goal._id}
                className="goal-card"
                style={{
                  border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderTop: `4px solid ${goal.color || '#6366f1'}`
                }}
              >
                <div>
                  <div className="goal-card-header">
                    <div className="goal-title-group">
                      <div style={{
                        width: '36px',
                        height: '36px',
                        minWidth: '36px',
                        borderRadius: '9px',
                        background: `${goal.color || '#6366f1'}20`,
                        color: goal.color || '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Target size={18} />
                      </div>
                      <h3 className="goal-title">
                        {goal.name}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
                        title="Edit goal"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal._id)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete goal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Target & Saved Line */}
                  <div className="goal-stats-badge">
                    <span className="goal-stat-item">
                      Target: <strong style={{ color: '#fff' }}>{formatCurrency(goal.targetAmount)}</strong>
                    </span>
                    <span className="goal-stat-divider">/</span>
                    <span className="goal-stat-item">
                      Saved: <strong style={{ color: '#10b981' }}>{formatCurrency(goal.currentAmount)}</strong>
                    </span>
                    <span className="goal-stat-divider">/</span>
                    <span className="goal-stat-item">
                      Progress: <strong style={{ color: '#38bdf8' }}>{goal.progressPercentage}%</strong>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(goal.progressPercentage, 100)}%`, 
                        background: isDone ? '#10b981' : (goal.color || '#6366f1'),
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>

                  <div className="goal-date-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Calendar size={13} style={{ flexShrink: 0 }} />
                      <span>Target: {targetDateStr}</span>
                    </span>
                    <span style={{ color: isDone ? '#10b981' : '#cbd5e1', fontWeight: 600, flexShrink: 0 }}>
                      {isDone ? '🎉 Goal Achieved!' : `${formatCurrency(goal.remainingAmount)} to go`}
                    </span>
                  </div>
                </div>

                {/* Deposit Action */}
                <button
                  onClick={() => handleOpenDeposit(goal)}
                  className="goal-deposit-btn"
                  style={{
                    background: isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
                    color: isDone ? '#34d399' : '#a5b4fc'
                  }}
                >
                  <Coins size={16} />
                  <span>{isDone ? 'Deposit More Savings' : 'Deposit Funds'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Goal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Target size={18} color="#818cf8" />
                <span>{editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}</span>
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

            <form onSubmit={handleSubmitGoal}>
              <div className="form-field">
                <label className="form-label">Goal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. New Laptop, Emergency Fund, Japan Trip"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Target Amount (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 50000"
                  className="form-input"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Currently Saved (₹)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 15000"
                  className="form-input"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Target Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Accent Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ width: '100%', height: '40px', background: 'transparent', border: 'none', cursor: 'pointer' }}
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
                    <span>Save Goal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deposit Funds Towards Goal */}
      {depositModalOpen && selectedGoal && (
        <div className="modal-backdrop" onClick={() => setDepositModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Coins size={18} color="#818cf8" />
                <span>Deposit to {selectedGoal.name}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setDepositModalOpen(false)}>
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

            <form onSubmit={handleDepositSubmit}>
              <div className="form-field">
                <label className="form-label">Deposit Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="5000.00"
                  className="form-input"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Deduct from Account (Optional)</label>
                <select
                  className="form-select"
                  value={depositAccountId}
                  onChange={(e) => setDepositAccountId(e.target.value)}
                >
                  <option value="" style={{ background: '#0f172a' }}>None (External money)</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id} style={{ background: '#0f172a' }}>
                      {a.name} — Balance: ${a.balance?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setDepositModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinner-icon" />
                      <span>Depositing...</span>
                    </>
                  ) : (
                    <span>Add to Savings</span>
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
