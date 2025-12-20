// src/utils/formatters.js
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-IN').format(number);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  if (format === 'datetime') {
    return `${formatDate(date, 'short')} ${formatDate(date, 'time')}`;
  }
  
  return d.toLocaleDateString('en-IN');
};

export const formatStockLevel = (quantity, threshold = 10) => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= threshold) return 'Low Stock';
  return 'In Stock';
};
