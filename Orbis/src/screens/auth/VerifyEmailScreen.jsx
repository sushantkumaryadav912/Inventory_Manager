import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api';
import { OtpVerificationScreen } from '../../components/auth/OtpVerification';

const VerifyEmailScreen = () => {
  const { user, updateUser } = useAuth();
  const [didRequest, setDidRequest] = useState(false);

  const email = user?.email;
  const name = user?.name;

  useEffect(() => {
    const requestInitialOtp = async () => {
      if (!email || didRequest) return;

      try {
        setDidRequest(true);
        await authService.requestOtp(email, 'email_verification', name);
      } catch (error) {
        setDidRequest(false);
        Alert.alert(
          'Error',
          error?.response?.data?.message || 'Failed to send verification code. Please try again.',
        );
      }
    };

    requestInitialOtp();
  }, [didRequest, email, name]);

  if (!email) {
    return (
      <OtpVerificationScreen
        email=""
        otpType="email_verification"
        onRequestNewCode={async () => {
          throw new Error('Missing email address');
        }}
      />
    );
  }

  return (
    <OtpVerificationScreen
      email={email}
      otpType="email_verification"
      onRequestNewCode={async () => {
        await authService.requestOtp(email, 'email_verification', name);
      }}
      onVerificationSuccess={async () => {
        await updateUser({
          emailVerified: true,
          requiresEmailVerification: false,
        });
      }}
    />
  );
};

export default VerifyEmailScreen;
