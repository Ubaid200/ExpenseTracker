import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  CreditCard, 
  Wallet, 
  Landmark, 
  Banknote, 
  PiggyBank, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  X, 
  Loader2 
} from 'lucide-react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accounts';
import { formatCurrency } from '../utils/formatCurrency';

export const AccountsPage = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext() || {};

  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '',
    color: '#3b82f6',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAccounts();
      if (res?.accounts) {
        setAccounts(res.accounts);
        setTotalBalance(res.totalBalance || 0);
      }
    } catch (err) {
      console.warn('Error fetching accounts, using local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, refreshTrigger]);

  const handleOpenAdd = () => {
    setEditingAcc(null);
    setFormData({ name: '', type: 'bank', balance: '', color: '#3b82f6' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAcc(acc);
    setFormData({
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      color: acc.color || '#3b82f6',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Please enter an account name');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingAcc) {
        await updateAccount(editingAcc._id, formData);
      } else {
        await createAccount({
          ...formData,
          balance: formData.balance ? Number(formData.balance) : 0,
        });
      }
      setIsModalOpen(false);
      fetchAccounts();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await deleteAccount(id);
      fetchAccounts();
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete account');
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'bank': return <Landmark size={22} />;
      case 'cash': return <Banknote size={22} />;
      case 'wallet': return <Wallet size={22} />;
      case 'credit_card': return <CreditCard size={22} />;
      case 'savings': return <PiggyBank size={22} />;
      default: return <Wallet size={22} />;
    }
  };


  return (
    <div>
      {/* Title & Action */}
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
            Accounts & Wallets
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
            Track multiple accounts with individual and combined net worth
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          <span>New Account</span>
        </button>
      </div>

      {/* Combined Total Net Worth Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '16px',
        padding: '1.85rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem'
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Combined Total Balance
          </span>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem', letterSpacing: '-0.5px' }}>
            {formatCurrency(totalBalance)}
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Total liquid assets across {accounts.length} active account{accounts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <Loader2 size={24} className="spinner-icon" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
          No accounts found. Click "New Account" to add your first bank account or wallet.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {accounts.map((acc) => {
            const isNegative = acc.balance < 0;
            return (
              <div
                key={acc._id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderTop: `4px solid ${acc.color || '#6366f1'}`,
                  borderRadius: '14px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: `${acc.color || '#6366f1'}20`,
                      color: acc.color || '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getAccountIcon(acc.type)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          padding: '0.3rem',
                          cursor: 'pointer',
                          borderRadius: '6px'
                        }}
                        title="Edit Account"
                        onMouseOver={(e) => { e.currentTarget.style.color = '#818cf8'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(acc._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          padding: '0.3rem',
                          cursor: 'pointer',
                          borderRadius: '6px'
                        }}
                        title="Delete Account"
                        onMouseOver={(e) => { e.currentTarget.style.color = '#f43f5e'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#fff' }}>
                    {acc.name}
                  </h3>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    textTransform: 'capitalize',
                    marginBottom: '1.25rem'
                  }}>
                    {acc.type.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                    Current Balance
                  </div>
                  <div style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: isNegative ? '#f43f5e' : '#fff'
                  }}>
                    {formatCurrency(acc.balance)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Account */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <CreditCard size={18} color="#818cf8" />
                <span>{editingAcc ? 'Edit Account' : 'Add New Account'}</span>
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
              <div className="form-field">
                <label className="form-label">Account Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chase Bank, Wallet, Petty Cash"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Account Type *</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="bank" style={{ background: '#0f172a' }}>Bank Account</option>
                  <option value="cash" style={{ background: '#0f172a' }}>Cash</option>
                  <option value="wallet" style={{ background: '#0f172a' }}>Digital Wallet</option>
                  <option value="credit_card" style={{ background: '#0f172a' }}>Credit Card</option>
                  <option value="savings" style={{ background: '#0f172a' }}>Savings Account</option>
                  <option value="other" style={{ background: '#0f172a' }}>Other</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="form-input"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Card Accent Color</label>
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
                    <span>Save Account</span>
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
