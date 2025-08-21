export const setItemsInLocalStorage = (key, value) => {
  if (!key || !value) {
    return console.error('Cannot store in LS');
  }

  const valueToStore =
    typeof value !== 'string' ? JSON.stringify(value) : value;
  localStorage.setItem(key, valueToStore);
};

export const getItemFromLocalStorage = (key) => {
  if (!key) {
    return console.error(`Cannot get value from LS`);
  }
  return localStorage.getItem(key);
};

export const removeItemFromLocalStorage = (key) => {
  if (!key) {
    return console.error(`Cannot remove item from LS`);
  }
  localStorage.removeItem(key);
};

// Currency formatting utility for Vietnamese Dong (VND)
export const formatVND = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₫0';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₫${new Intl.NumberFormat('vi-VN').format(Math.round(numAmount))}`;
};

// Short format for large amounts (e.g., ₫2.5M instead of ₫2,500,000)
export const formatVNDShort = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₫0';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (numAmount >= 1000000000) {
    return `₫${(numAmount / 1000000000).toFixed(1)}B`;
  } else if (numAmount >= 1000000) {
    return `₫${(numAmount / 1000000).toFixed(1)}M`;
  } else if (numAmount >= 1000) {
    return `₫${(numAmount / 1000).toFixed(1)}K`;
  }
  
  return formatVND(numAmount);
};
