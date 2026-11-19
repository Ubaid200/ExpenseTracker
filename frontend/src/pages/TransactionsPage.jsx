import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Repeat, 
  Paperclip,
  Loader2,
  Calendar,
  Wallet,
  Download,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { getTransactions, deleteTransaction, exportTransactionsCSV } from '../api/transactions';
import { getCategories } from '../api/categories';
import { getAccounts } from '../api/accounts';
import { EditTransactionModal } from '../components/EditTransactionModal';
import { formatCurrency } from '../utils/formatCurrency';
import { generateTransactionsCSV, triggerCSVDownload } from '../utils/exportCSV';

export const TransactionsPage = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext() || {};

  // Filters State
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Pagination State (Backend paginated)
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data & Loading
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (type) count++;
    if (category) count++;
    if (account) count++;
    if (startDate) count++;
    if (endDate) count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    if (search.trim()) count++;
    return count;
  }, [type, category, account, startDate, endDate, minAmount, maxAmount, search]);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState(null);

  // Load Categories & Accounts for dropdown filters
  useEffect(() => {
    const loadMetadata = async () => {
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
        console.warn('Metadata load error:', err);
      }
    };
    loadMetadata();
  }, []);

  // Fetch paginated transactions from backend with combinable filters
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit,
        sortBy: 'date',
        sortOrder: 'desc',
      };
      if (search.trim()) params.search = search.trim();
      if (type) params.type = type;
      if (category) params.category = category;
      if (account) params.account = account;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const res = await getTransactions(params);
      if (res?.transactions) {
        setTransactions(res.transactions);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.warn('API error, reading local fallback transactions:', err.message);
      // Fallback local storage
      try {
        const saved = localStorage.getItem('et_transactions');
        let list = saved ? JSON.parse(saved) : [];
        if (type) list = list.filter((tx) => tx.type === type);
        if (search.trim()) {
          const s = search.toLowerCase();
          list = list.filter(
            (tx) =>
              (tx.note && tx.note.toLowerCase().includes(s)) ||
              (tx.description && tx.description.toLowerCase().includes(s)) ||
              String(tx.amount).includes(s)
          );
        }
        setTotal(list.length);
        setTotalPages(Math.ceil(list.length / limit) || 1);
        const startIdx = (page - 1) * limit;
        setTransactions(list.slice(startIdx, startIdx + limit));
      } catch {
        setTransactions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, type, category, account, startDate, endDate, minAmount, maxAmount]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setType('');
    setCategory('');
    setAccount('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  // Delete transaction
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      fetchTransactions();
      if (triggerRefresh) triggerRefresh();
    } catch {
      // Local fallback delete
      const saved = localStorage.getItem('et_transactions');
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.filter((tx) => (tx._id || tx.id) !== id);
        localStorage.setItem('et_transactions', JSON.stringify(updated));
        fetchTransactions();
        if (triggerRefresh) triggerRefresh();
      }
    }
  };

  // Export transaction history as CSV with active filters applied
  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportMessage('');

    try {
      const activeFilters = {};
      if (type) activeFilters.type = type;
      if (category) activeFilters.category = category;
      if (account) activeFilters.account = account;
      if (startDate) activeFilters.startDate = startDate;
      if (endDate) activeFilters.endDate = endDate;
      if (minAmount) activeFilters.minAmount = minAmount;
      if (maxAmount) activeFilters.maxAmount = maxAmount;
      if (search.trim()) activeFilters.search = search.trim();

      const today = new Date().toISOString().split('T')[0];
      const filename = `transactions_${today}.csv`;

      try {
        // 1. Primary: Download CSV from backend endpoint (respects all active filters)
        const blob = await exportTransactionsCSV(activeFilters);
        triggerCSVDownload(blob, filename);
        setExportMessage(
          activeFilterCount > 0
            ? `CSV exported successfully (${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''} applied)!`
            : 'All transactions exported successfully to CSV!'
        );
        setTimeout(() => setExportMessage(''), 4000);
      } catch (apiErr) {
        console.warn('Backend export failed, generating CSV from local dataset:', apiErr);

        // 2. Fallback: Generate CSV client-side
        let allTxs = [];
        const saved = localStorage.getItem('et_transactions');
        if (saved) {
          allTxs = JSON.parse(saved);
        } else {
          allTxs = transactions;
        }

        let filtered = allTxs.slice();
        if (type) filtered = filtered.filter((t) => t.type === type);
        if (category) {
          filtered = filtered.filter((t) => {
            const cId = t.category?._id || t.category?.id || t.category;
            return cId === category;
          });
        }
        if (account) {
          filtered = filtered.filter((t) => {
            const aId = t.account?._id || t.account?.id || t.account;
            return aId === account;
          });
        }
        if (startDate) {
          const start = new Date(startDate);
          filtered = filtered.filter((t) => new Date(t.date) >= start);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filtered = filtered.filter((t) => new Date(t.date) <= end);
        }
        if (minAmount) filtered = filtered.filter((t) => Number(t.amount) >= Number(minAmount));
        if (maxAmount) filtered = filtered.filter((t) => Number(t.amount) <= Number(maxAmount));
        if (search.trim()) {
          const s = search.trim().toLowerCase();
          filtered = filtered.filter((t) => {
            const desc = (t.note || t.description || '').toLowerCase();
            const cat = (t.category?.name || t.category || '').toLowerCase();
            const amt = String(t.amount || '');
            return desc.includes(s) || cat.includes(s) || amt.includes(s);
          });
        }

        const csvContent = generateTransactionsCSV(filtered);
        triggerCSVDownload(csvContent, filename);
        setExportMessage(`Exported ${filtered.length} transaction(s) to CSV!`);
        setTimeout(() => setExportMessage(''), 4000);
      }
    } catch (err) {
      alert('Failed to export CSV: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div>
      {/* Page Title & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: '#fff' }}>
            Transaction History
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
            Backend-paginated ledger with combinable multi-filters
          </p>
        </div>

        {/* Search Input, Filter Toggle & Export Button */}
        <div style={{ display: 'flex', gap: '0.65rem', flex: '1', maxWidth: '620px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search by note, category, or amount..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.6rem',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              background: showFilters ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showFilters ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Filter size={15} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span style={{
                background: '#6366f1',
                color: '#fff',
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '10px',
                fontWeight: 700
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            title="Export transaction history as CSV with active filters applied"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              borderRadius: '8px',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="spinner-icon" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Success / Info Notification */}
      {exportMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#34d399',
          padding: '0.65rem 1.1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle size={16} />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Combinable Filters Panel */}
      {showFilters && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* 1. Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              Type
            </label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.55rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              <option value="" style={{ background: '#0f172a' }}>All Types</option>
              <option value="income" style={{ background: '#0f172a' }}>Income</option>
              <option value="expense" style={{ background: '#0f172a' }}>Expense</option>
            </select>
          </div>

          {/* 2. Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.55rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              <option value="" style={{ background: '#0f172a' }}>All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} style={{ background: '#0f172a' }}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Account */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              Account / Wallet
            </label>
            <select
              value={account}
              onChange={(e) => { setAccount(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.55rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              <option value="" style={{ background: '#0f172a' }}>All Accounts</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id} style={{ background: '#0f172a' }}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Date From */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 5. Date To */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 6. Min Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              Min Amount (₹)
            </label>
            <input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 7. Max Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              Max Amount (₹)
            </label>
            <input
              type="number"
              placeholder="10000"
              value={maxAmount}
              onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Actions inside filter drawer: Reset & Export */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button
              onClick={handleResetFilters}
              style={{
                flex: '1',
                padding: '0.55rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              style={{
                flex: '1',
                padding: '0.55rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontWeight: 600
              }}
              title="Export filtered records to CSV"
            >
              <FileSpreadsheet size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table / List Container */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
            <Loader2 size={24} className="spinner-icon" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#94a3b8' }}>
            <p style={{ fontSize: '1.05rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>No transactions match your criteria.</p>
            <p style={{ fontSize: '0.85rem' }}>Try clearing filters or click "+ Add Transaction" to create one.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '720px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Type & Category</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Note / Description</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Account</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Date</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const txId = tx._id || tx.id;
                  const isInc = tx.type === 'income';
                  const catName = tx.category?.name || tx.category || 'General';
                  const catColor = tx.category?.color || '#6366f1';
                  const accName = tx.account?.name || tx.account || 'Account';
                  const txDate = tx.date ? new Date(tx.date).toLocaleDateString() : '';

                  return (
                    <tr 
                      key={txId} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Category & Icon */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
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
                          <div>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: `${catColor}25`,
                              color: catColor,
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}>
                              {catName}
                            </span>
                            {tx.isRecurring && (
                              <span style={{ marginLeft: '0.4rem', color: '#818cf8' }} title={`Recurring (${tx.recurringFrequency})`}>
                                <Repeat size={12} style={{ verticalAlign: 'middle' }} />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Note */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                          {tx.note || tx.description || '—'}
                        </div>
                        {tx.attachment && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#818cf8', marginTop: '0.2rem' }}>
                            <Paperclip size={12} />
                            <span>Attachment included</span>
                          </div>
                        )}
                      </td>

                      {/* Account */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                          <Wallet size={14} color="#94a3b8" />
                          {accName}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} />
                          {txDate}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: isInc ? '#10b981' : '#f43f5e'
                        }}>
                          {isInc ? '+' : '−'}{formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => setEditingTx(tx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '0.35rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Edit Transaction"
                            onMouseOver={(e) => { e.currentTarget.style.color = '#818cf8'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(txId)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '0.35rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete Transaction"
                            onMouseOver={(e) => { e.currentTarget.style.color = '#f43f5e'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Backend Pagination Bar */}
        <div style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          fontSize: '0.85rem',
          color: '#94a3b8',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            Showing page <strong style={{ color: '#fff' }}>{page}</strong> of <strong style={{ color: '#fff' }}>{totalPages}</strong> ({total} total transactions)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                background: page <= 1 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: page <= 1 ? '#64748b' : '#fff',
                borderRadius: '6px',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                background: page >= totalPages ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: page >= totalPages ? '#64748b' : '#fff',
                borderRadius: '6px',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <EditTransactionModal
          isOpen={!!editingTx}
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSuccess={() => {
            fetchTransactions();
            if (triggerRefresh) triggerRefresh();
          }}
        />
      )}
    </div>
  );
};
