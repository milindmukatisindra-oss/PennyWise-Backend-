/**
 * Utility functions for reliable currency calculations.
 * Avoids JavaScript floating point inaccuracies by working with precise roundings.
 */

export const roundToTwoDecimals = (num) => {
  const parsed = Number(num);
  if (isNaN(parsed)) return 0;
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
};

export const calculatePercentage = (part, total) => {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  const pct = (p / t) * 100;
  return roundToTwoDecimals(pct);
};

export const formatCurrency = (amount, currency = '₹') => {
  const rounded = roundToTwoDecimals(amount);
  return `${currency}${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
