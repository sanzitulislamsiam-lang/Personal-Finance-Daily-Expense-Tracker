// Helper to format currency values based on preference
export const formatCurrency = (amount, currency = 'BDT') => {
  const numericAmount = Number(amount) || 0;
  const symbol = currency === 'USD' ? '$' : '৳';
  return `${symbol}${numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
