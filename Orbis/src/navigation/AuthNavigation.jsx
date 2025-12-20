import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

const AuthStack = createNativeStackNavigator();

const AuthNavigation = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
  </AuthStack.Navigator>
);

export default AuthNavigation;
