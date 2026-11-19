export const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export const formatCompactINR = (val) => {
  const num = Number(val) || 0;
  if (Math.abs(num) >= 10000000) {
    const formatted = (num / 10000000).toFixed(1).replace(/\.0$/, '');
    return `₹${formatted}Cr`;
  }
  if (Math.abs(num) >= 100000) {
    const formatted = (num / 100000).toFixed(1).replace(/\.0$/, '');
    return `₹${formatted}L`;
  }
  if (Math.abs(num) >= 1000) {
    const formatted = (num / 1000).toFixed(1).replace(/\.0$/, '');
    return `₹${formatted}k`;
  }
  return `₹${num}`;
};
