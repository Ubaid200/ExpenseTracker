import { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Paperclip, 
  Repeat, 
  FolderPlus, 
  Wallet,
  Loader2
} from 'lucide-react';
import { getCategories, createCategory } from '../api/categories';
import { getAccounts } from '../api/accounts';
import { createTransaction } from '../api/transactions';

const FALLBACK_EXPENSE_CATS = [
  'Food', 'Travel', 'Shopping', 'Bills', 'Rent', 
  'Entertainment', 'Health', 'Education', 'Subscription', 'Other'
];
const FALLBACK_INCOME_CATS = [
  'Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'
];

const FALLBACK_ACCOUNTS = [
  { _id: 'acc-1', name: 'Bank Account', type: 'bank' },
  { _id: 'acc-2', name: 'Cash', type: 'cash' },
  { _id: 'acc-3', name: 'Wallet', type: 'wallet' },
  { _id: 'acc-4', name: 'Credit Card', type: 'credit_card' },
  { _id: 'acc-5', name: 'Savings', type: 'savings' },
];

export const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attachment, setAttachment] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');

  // Loaded data
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Category State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatColor, setCustomCatColor] = useState('#6366f1');

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [catRes, accRes] = await Promise.allSettled([
          getCategories(),
          getAccounts(),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.categories) {
          setCategories(catRes.value.categories);
        } else {
          // Defaults
          const defaults = [
            ...FALLBACK_EXPENSE_CATS.map(name => ({ _id: `cat-${name}`, name, type: 'expense', color: '#f59e0b' })),
            ...FALLBACK_INCOME_CATS.map(name => ({ _id: `cat-${name}`, name, type: 'income', color: '#10b981' })),
          ];
          setCategories(defaults);
        }

        if (accRes.status === 'fulfilled' && accRes.value?.accounts) {
          setAccounts(accRes.value.accounts);
          if (accRes.value.accounts.length > 0 && !accountId) {
            setAccountId(accRes.value.accounts[0]._id);
          }
        } else {
          setAccounts(FALLBACK_ACCOUNTS);
          setAccountId(FALLBACK_ACCOUNTS[0]._id);
        }
      } catch (err) {
        console.warn('Could not fetch accounts/categories, using defaults:', err?.message || err);
        setAccounts(FALLBACK_ACCOUNTS);
        setAccountId(FALLBACK_ACCOUNTS[0]._id);
      }
    };

    fetchData();
  }, [isOpen]);

  // Filter categories by selected type
  const availableCategories = categories.filter((c) => c.type === type);

  // Auto-select first matching category when type changes
  useEffect(() => {
    if (availableCategories.length > 0) {
      setCategoryId(availableCategories[0]._id);
    }
  }, [type, categories]);

  if (!isOpen) return null;

  // Handle Quick Custom Category Creation
  const handleCreateCustomCategory = async (e) => {
    e.preventDefault();
    if (!customCatName.trim()) return;

    try {
      const res = await createCategory({
        name: customCatName.trim(),
        type,
        color: customCatColor,
      });

      if (res?.category) {
        setCategories((prev) => [...prev, res.category]);
        setCategoryId(res.category._id);
      } else {
        const localCat = {
          _id: `custom-${Date.now()}`,
          name: customCatName.trim(),
          type,
          color: customCatColor,
        };
        setCategories((prev) => [...prev, localCat]);
        setCategoryId(localCat._id);
      }

      setCustomCatName('');
      setIsCreatingCategory(false);
    } catch {
      // Local fallback
      const localCat = {
        _id: `custom-${Date.now()}`,
        name: customCatName.trim(),
        type,
        color: customCatColor,
      };
      setCategories((prev) => [...prev, localCat]);
      setCategoryId(localCat._id);
      setCustomCatName('');
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Please select a category');
      return;
    }
    if (!accountId) {
      setErrorMsg('Please select an account');
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
      description: note.trim() || `${type === 'income' ? 'Income' : 'Expense'} Transaction`,
      date,
      attachment,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : '',
    };

    try {
      await createTransaction(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.warn('API error creating transaction, saving locally:', err?.message || err);
      // Save locally to localStorage so it works seamlessly offline too
      try {
        const saved = localStorage.getItem('et_transactions');
        const list = saved ? JSON.parse(saved) : [];
        const catObj = categories.find((c) => c._id === categoryId);
        const accObj = accounts.find((a) => a._id === accountId);

        const newLocalTx = {
          id: `tx-${Date.now()}`,
          ...payload,
          category: catObj ? { name: catObj.name, color: catObj.color, icon: catObj.icon } : { name: 'General' },
          account: accObj ? { name: accObj.name, type: accObj.type } : { name: 'Main Account' },
        };
        localStorage.setItem('et_transactions', JSON.stringify([newLocalTx, ...list]));
        if (onSuccess) onSuccess();
        onClose();
      } catch (innerErr) {
        setErrorMsg(innerErr?.message || err?.response?.data?.message || 'Failed to record transaction');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            <PlusCircle size={20} color="#818cf8" />
            <span>Add Transaction</span>
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

        {/* 1. Type Toggle (Income / Expense) */}
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

        <form onSubmit={handleSubmit}>
          {/* 2. Amount */}
          <div className="form-field">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* 3. Category Selector + New Category Button */}
          <div className="form-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Category *</label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818cf8',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                <FolderPlus size={14} />
                <span>{isCreatingCategory ? 'Cancel Custom' : '+ Custom Category'}</span>
              </button>
            </div>

            {/* Custom Category Inline Creator */}
            {isCreatingCategory ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed rgba(99, 102, 241, 0.4)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Category Name"
                    className="form-input"
                    value={customCatName}
                    onChange={(e) => setCustomCatName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="color"
                    value={customCatColor}
                    onChange={(e) => setCustomCatColor(e.target.value)}
                    style={{
                      width: '42px',
                      height: '40px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                    title="Choose color"
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem' }}
                  onClick={handleCreateCustomCategory}
                >
                  Save Custom Category
                </button>
              </div>
            ) : (
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
            )}
          </div>

          {/* 4. Account / Wallet Selector */}
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
                  {acc.name} ({acc.type.replace('_', ' ')}) — Balance: ₹{Number(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Note / Description */}
          <div className="form-field">
            <label className="form-label">Note</label>
            <input
              type="text"
              placeholder="e.g. Monthly Grocery, Client payment, Netflix"
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* 6. Date */}
          <div className="form-field">
            <label className="form-label">Date (Defaults to today)</label>
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

          {/* 7. Optional Attachment */}
          <div className="form-field">
            <label className="form-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Paperclip size={14} /> Attachment (Optional Receipt / Invoice)
              </span>
            </label>
            <input
              type="text"
              placeholder="Receipt link, file name, or invoice reference"
              className="form-input"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
            />
          </div>

          {/* 8. Recurring Toggle */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Repeat size={15} color="#818cf8" />
                Make this a Recurring Transaction
              </span>
            </label>

            {isRecurring && (
              <div style={{ marginTop: '0.75rem', paddingLeft: '1.6rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Recurrence Frequency</label>
                <select
                  className="form-select"
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value)}
                >
                  <option value="daily" style={{ background: '#0f172a' }}>Daily</option>
                  <option value="weekly" style={{ background: '#0f172a' }}>Weekly</option>
                  <option value="monthly" style={{ background: '#0f172a' }}>Monthly</option>
                  <option value="yearly" style={{ background: '#0f172a' }}>Yearly</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
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
                <span>Save Transaction</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
