// src/utils/errorHandler.js
import { Alert } from 'react-native';

export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);

  let message = customMessage || 'An unexpected error occurred';

  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    switch (status) {
      case 400:
        message = data.message || 'Invalid request';
        break;
      case 401:
        message = data.message || 'Unauthorized. Please login again.';
        break;
      case 403:
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        message = 'Resource not found';
        break;
      case 409:
        message = data.message || 'Conflict: Resource already exists';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      default:
        message = data.message || message;
    }
  } else if (error.request) {
    // Request made but no response
    message = 'Network error. Please check your connection.';
  }

  return {
    message,
    status: error.response?.status,
    data: error.response?.data,
  };
};

export const showErrorAlert = (error, title = 'Error') => {
  const { message } = handleApiError(error);
  Alert.alert(title, message);
};

export const showSuccessAlert = (message, title = 'Success') => {
  Alert.alert(title, message);
};
