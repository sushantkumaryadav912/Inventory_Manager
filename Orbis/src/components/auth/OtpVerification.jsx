import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../../services/api';

/**
 * OTP Input Component
 * Handles 6-digit OTP input with auto-focus and validation
 */
export const OtpVerificationScreen = ({
  email,
  otpType = 'email_verification', // or 'password_reset'
  onVerificationSuccess,
  onRequestNewCode,
  resendCountdown = 60,
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(resendCountdown);
  const [showResend, setShowResend] = useState(false);
  const inputRef = useRef(null);

  const OTP_LENGTH = 6;

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0 && !showResend) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setShowResend(true);
    }
  }, [countdown, showResend]);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  /**
   * Handle OTP input - only accept digits
   */
  const handleOtpChange = (value) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(sanitized);

    // Auto-submit when OTP is complete
    if (sanitized.length === OTP_LENGTH) {
      handleVerifyOtp(sanitized);
    }
  };

  /**
   * Verify OTP with backend
   */
  const handleVerifyOtp = async (code = otp) => {
    try {
      if (!code || code.length !== OTP_LENGTH) {
        Alert.alert('Invalid OTP', 'Please enter a valid 6-digit code');
        return;
      }

      setLoading(true);

      const response = await authService.verifyOtp(email, code, otpType);

      if (response.success) {
        Alert.alert('Success', response.message || 'Email verified successfully');
        onVerificationSuccess?.();
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Invalid or expired OTP. Please try again.';
      Alert.alert('Verification Failed', message);
      setOtp(''); // Clear OTP for retry
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request new OTP code
   */
  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setShowResend(false);
      setCountdown(resendCountdown);
      setOtp('');

      await onRequestNewCode?.();

      Alert.alert('Success', 'A new verification code has been sent to your email');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Resend OTP failed:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to resend OTP. Please try again.',
      );
      setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  const isOtpComplete = otp.length === OTP_LENGTH;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.otpContainer}>
          <TextInput
            ref={inputRef}
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor="#ccc"
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            editable={!loading}
            selectTextOnFocus
            autoComplete="off"
          />
          <Text style={styles.otpHint}>
            {otp.length}/{OTP_LENGTH}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, !isOtpComplete && styles.verifyButtonDisabled]}
          onPress={() => handleVerifyOtp()}
          disabled={!isOtpComplete || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {!showResend ? (
            <Text style={styles.countdownText}>
              Resend code in <Text style={styles.countdownNumber}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
              <Text style={styles.resendText}>
                Didn't receive the code?{' '}
                <Text style={styles.resendLink}>Resend OTP</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Code expires in 10 minutes. Check your spam folder if you don't see the email.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

/**
 * OTP Request Component
 * Handles requesting OTP for email or password reset
 */
export const OtpRequestScreen = ({
  onOtpRequested,
  email: initialEmail = '',
  otpType = 'email_verification',
  userName = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    try {
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }

      setLoading(true);

      const response = await authService.requestOtp(email, otpType, userName);

      if (response.success) {
        Alert.alert('Success', response.message);
        onOtpRequested?.(email);
      }
    } catch (error) {
      console.error('Request OTP failed:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to send OTP. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {otpType === 'password_reset' ? 'Reset Your Password' : 'Create Your Account'}
        </Text>
        <Text style={styles.subtitle}>
          {otpType === 'password_reset'
            ? 'Enter your email to receive a password reset code'
            : 'Enter your email to receive a verification code'}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !email && styles.buttonDisabled]}
          onPress={handleRequestOtp}
          disabled={!email || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✓ We'll send a 6-digit verification code to your email
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailText: {
    fontWeight: '600',
    color: '#1976d2',
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpInput: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 10,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
    paddingVertical: 15,
    color: '#000',
  },
  otpHint: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#000',
  },
  verifyButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 14,
    color: '#666',
  },
  countdownNumber: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    color: '#1976d2',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#0d47a1',
    lineHeight: 18,
  },
});

export default OtpVerificationScreen;
