// CSV Export Utility for Transaction History

export const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const formatCSVRow = (tx) => {
  const d = tx.date ? new Date(tx.date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${day}`;

  const typeStr = tx.type === 'income' ? 'Income' : 'Expense';
  const catStr = tx.category?.name || (typeof tx.category === 'string' ? tx.category : 'Other');
  const accStr = tx.account?.name || (typeof tx.account === 'string' ? tx.account : 'Default Account');
  const amtStr = tx.amount ?? 0;
  const noteStr = tx.note || tx.description || '';

  return [
    dateStr,
    typeStr,
    escapeCSV(catStr),
    escapeCSV(accStr),
    amtStr,
    escapeCSV(noteStr),
  ].join(',');
};

export const generateTransactionsCSV = (transactions = []) => {
  const headers = ['Date', 'Type', 'Category', 'Account', 'Amount', 'Note'];
  const rows = transactions.map(formatCSVRow);
  return [headers.join(','), ...rows].join('\r\n');
};

export const triggerCSVDownload = (content, filename) => {
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: 'text/csv;charset=utf-8;' });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
