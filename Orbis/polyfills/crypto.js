// polyfills/crypto.js - Polyfill for crypto.randomUUID in React Native
import * as Crypto from 'expo-crypto';

// Polyfill crypto.randomUUID for React Native environment
if (typeof global !== 'undefined') {
  if (!global.crypto) {
    global.crypto = {};
  }
  
  if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = () => {
      return Crypto.randomUUID();
    };
  }
  
  // Also add getRandomValues for broader crypto support
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (array) => {
      const bytes = Crypto.getRandomBytes(array.length);
      for (let i = 0; i < bytes.length; i++) {
        array[i] = bytes[i];
      }
      return array;
    };
  }
}

export default global.crypto;
