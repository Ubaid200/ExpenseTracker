import { useState, useEffect } from 'react';
import { X, Edit3, ArrowUpRight, ArrowDownRight, Calendar, Paperclip, Wallet, Loader2 } from 'lucide-react';
import { getCategories } from '../api/categories';
import { getAccounts } from '../api/accounts';
import { updateTransaction } from '../api/transactions';

export const EditTransactionModal = ({ isOpen, transaction, onClose, onSuccess }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [attachment, setAttachment] = useState('');

  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !transaction) return;

    setType(transaction.type || 'expense');
    setAmount(transaction.amount || '');
    setCategoryId(transaction.category?._id || transaction.category || '');
    setAccountId(transaction.account?._id || transaction.account || '');
    setNote(transaction.note || transaction.description || '');
    setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '');
    setAttachment(transaction.attachment || '');

    const fetchData = async () => {
      try {
        const [catRes, accRes] = await Promise.allSettled([
          getCategories(),
          getAccounts(),
        ]);
        if (catRes.status === 'fulfilled' && catRes.value?.categories) {
          setCategories(catRes.value.categories);
        }
        if (accRes.status === 'fulfilled' && accRes.value?.accounts) {
          setAccounts(accRes.value.accounts);
        }
      } catch (err) {
        console.warn('Error loading edit options:', err);
      }
    };

    fetchData();
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const availableCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      amount: parseFloat(amount),
      type,
      category: categoryId,
      account: accountId,
      note: note.trim(),
      description: note.trim() || `${type} transaction`,
      date,
      attachment,
    };

    try {
      if (transaction._id) {
        await updateTransaction(transaction._id, payload);
      } else if (transaction.id) {
        // LocalStorage fallback update
        const saved = localStorage.getItem('et_transactions');
        if (saved) {
          const list = JSON.parse(saved);
          const updated = list.map((item) =>
            item.id === transaction.id ? { ...item, ...payload } : item
          );
          localStorage.setItem('et_transactions', JSON.stringify(updated));
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Edit3 size={18} color="#818cf8" />
            <span>Edit Transaction</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
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
          {/* Type Toggle */}
          <div className="type-toggle-group">
            <button
              type="button"
              className={`type-toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => setType('expense')}
            >
              <ArrowDownRight size={16} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${type === 'income' ? 'active income' : ''}`}
              onClick={() => setType('income')}
            >
              <ArrowUpRight size={16} />
              <span>Income</span>
            </button>
          </div>

          {/* Amount */}
          <div className="form-field">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="form-field">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {availableCategories.map((cat) => (
                <option key={cat._id} value={cat._id} style={{ background: '#0f172a' }}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div className="form-field">
            <label className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Wallet size={14} /> Account / Wallet *
              </span>
            </label>
            <select
              className="form-select"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id} style={{ background: '#0f172a' }}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div className="form-field">
            <label className="form-label">Note / Description</label>
            <input
              type="text"
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="form-field">
            <label className="form-label">Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <Calendar size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Attachment */}
          <div className="form-field">
            <label className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Paperclip size={14} /> Attachment Reference
              </span>
            </label>
            <input
              type="text"
              className="form-input"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
              placeholder="Receipt image link or document name"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Transaction</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
