// src/utils/validators.js
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile
  return phoneRegex.test(phone);
};

export const isValidGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

export const isPositiveNumber = (value) => {
  return !isNaN(value) && parseFloat(value) > 0;
};

export const isValidQuantity = (quantity) => {
  return Number.isInteger(Number(quantity)) && quantity >= 0;
};
