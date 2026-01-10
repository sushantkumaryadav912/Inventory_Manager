// src/utils/errorHandler.js
import { Alert } from 'react-native';

export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);

  // If this is already a normalized error object (e.g., produced elsewhere), return it.
  if (error && typeof error === 'object' && 'status' in error && 'message' in error && !('response' in error)) {
    return {
      message: error.message,
      status: error.status,
      data: error.data,
      errorCode: error.errorCode,
      fieldErrors: error.fieldErrors,
    };
  }

  let message = customMessage || 'An unexpected error occurred';

  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    const serverMessage = data?.message;
    const fieldErrors = data?.fieldErrors;
    const errorCode = data?.errorCode;

    switch (status) {
      case 400:
        if (fieldErrors && typeof fieldErrors === 'object') {
          const firstKey = Object.keys(fieldErrors)[0];
          message = firstKey ? fieldErrors[firstKey] : (serverMessage || 'Invalid request');
        } else {
          message = serverMessage || 'Invalid request';
        }
        break;
      case 401:
        message = serverMessage || 'Unauthorized. Please login again.';
        break;
      case 403:
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        message = serverMessage || 'Resource not found';
        break;
      case 409:
        message = serverMessage || 'Conflict: Resource already exists';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      default:
        message = serverMessage || message;
    }

    return {
      message,
      status: error.response?.status,
      data: error.response?.data,
      errorCode,
      fieldErrors,
    };
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
