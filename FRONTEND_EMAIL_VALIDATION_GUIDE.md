# Frontend Integration Guide - Email Validation Signup

## New Signup Flow

### Step 1: Signup Request
```jsx
// File: src/services/api/authService.js

// Add/Update this function
export const signUpWithEmail = async (email, password, name = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: name || email.split('@')[0],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const data = await response.json();
    
    // Store token for future API calls (even though email not verified yet)
    if (data.token) {
      AsyncStorage.setItem('accessToken', data.token);
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// New function: Verify email with token
export const verifyEmail = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
};

// New function: Resend verification email
export const resendVerificationEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resend email');
    }

    return await response.json();
  } catch (error) {
    console.error('Resend error:', error);
    throw error;
  }
};
```

### Step 2: Create Signup Screen Component
```jsx
// File: src/screens/auth/SignupScreen.jsx

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { signUpWithEmail } from '../../services/api/authService';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail(email, password, name);

      Alert.alert(
        'Account Created',
        'A verification email has been sent to ' + email + '. Please click the link in your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to email verification screen
              navigation.navigate('VerifyEmail', { email });
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        editable={!loading}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Full Name (Optional)"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Password (min 8 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    fontSize: 12,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#667eea',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
});
```

### Step 3: Create Email Verification Screen
```jsx
// File: src/screens/auth/VerifyEmailScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native';
import { resendVerificationEmail } from '../../services/api/authService';

export default function VerifyEmailScreen({ route, navigation }) {
  const { email } = route.params;
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const handleVerify = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Error', 'Please enter the verification token from your email');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmail(tokenInput);
      
      Alert.alert('Success', 'Email verified successfully! You can now log in.', [
        {
          text: 'Go to Login',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error) {
      Alert.alert('Verification Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await resendVerificationEmail(email);
      Alert.alert('Success', 'Verification email has been resent!');
      setResendDisabled(true);
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>

      <View style={styles.card}>
        <Text style={styles.subtitle}>A verification email has been sent to:</Text>
        <Text style={styles.email}>{email}</Text>

        <Text style={styles.instructions}>
          Please check your email and click the verification link. If you don't see it, check your spam folder.
        </Text>

        <Text style={styles.label}>Or paste the verification token here:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter verification token"
          value={tokenInput}
          onChangeText={setTokenInput}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, (resendLoading || resendDisabled) && styles.buttonDisabled]}
          onPress={handleResend}
          disabled={resendLoading || resendDisabled}
        >
          {resendLoading ? (
            <ActivityIndicator color="#667eea" />
          ) : (
            <Text style={styles.secondaryButtonText}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    textAlign: 'center',
    marginBottom: 15,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#667eea',
    textAlign: 'center',
    fontWeight: '500',
  },
});
```

### Step 4: Update Navigation
```jsx
// File: src/navigation/AuthNavigation.jsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignupScreen from '../screens/auth/SignupScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen 
        name="VerifyEmail" 
        component={VerifyEmailScreen}
        options={{ gestureEnabled: false }} // Prevent back swipe
      />
    </Stack.Navigator>
  );
}
```

## Email Link Handling (Deep Linking)

### Web Verification Link
```
https://app.inventorymanager.com/verify-email?token=AbCdEfGhIjKlMnOpQrStUvWxYz123456
```

### Mobile Deep Link
Add to `app.json`:
```json
{
  "expo": {
    "scheme": "orbis",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#667eea"
        }
      ]
    ],
    "deep_linking": {
      "schemes": ["orbis", "https"],
      "prefixes": ["orbis://", "https://app.inventorymanager.com"],
      "config": {
        "screens": {
          "VerifyEmail": "verify-email/:token"
        }
      }
    }
  }
}
```

### Handle Deep Link
```jsx
// File: src/navigation/index.js

import * as Linking from 'expo-linking';
import { useEffect } from 'react';

export function RootNavigator() {
  const linking = {
    prefixes: ['orbis://', 'https://app.inventorymanager.com'],
    config: {
      screens: {
        VerifyEmail: 'verify-email/:token',
      },
    },
  };

  const handleDeepLink = ({ url }) => {
    const route = Linking.parse(url);
    // Handle the route
  };

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer linking={linking}>
      {/* Your navigation structure */}
    </NavigationContainer>
  );
}
```

## Testing Checklist

### Signup Flow
- [ ] User enters valid email
- [ ] Abstract API validates email
- [ ] User account created
- [ ] Verification email sent via Brevo
- [ ] Response shows "Check your email" message

### Email Verification
- [ ] User receives email with link
- [ ] Clicking link verifies account
- [ ] User can now login
- [ ] Token expires after 24 hours

### Error Cases
- [ ] Invalid email rejected (test with fake email)
- [ ] Disposable email rejected (test with temp-mail.com)
- [ ] Duplicate account rejected
- [ ] Password validation enforced (< 8 chars)
- [ ] Invalid token rejected
- [ ] Expired token shows proper error

### Resend Flow
- [ ] Resend button works
- [ ] New email sent with new token
- [ ] Old token still works (until used)
- [ ] Cooldown prevents spam (60 seconds)

## API Response Examples

### Successful Signup
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "Signup successful! Please check your email to verify your account.",
  "verificationEmailSent": true,
  "emailVerified": false,
  "requiresEmailVerification": true
}
```

### Successful Email Verification
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in.",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Deployment Checklist

- [ ] All API keys configured in .env
- [ ] Database migrations executed
- [ ] Email templates reviewed in Brevo
- [ ] Sender email verified in Brevo
- [ ] Deep linking configured for your app domain
- [ ] Error logging configured
- [ ] Testing completed on staging
