// src/utils/numberUtils.js
export const round = (number, decimals = 2) => {
  return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
};

export const clamp = (number, min, max) => {
  return Math.min(Math.max(number, min), max);
};

export const percentage = (value, total) => {
  if (total === 0) return 0;
  return round((value / total) * 100, 1);
};

export const sumArray = (array, key = null) => {
  if (key) {
    return array.reduce((sum, item) => sum + (item[key] || 0), 0);
  }
  return array.reduce((sum, item) => sum + item, 0);
};

export const average = (array, key = null) => {
  if (array.length === 0) return 0;
  const sum = sumArray(array, key);
  return round(sum / array.length, 2);
};
