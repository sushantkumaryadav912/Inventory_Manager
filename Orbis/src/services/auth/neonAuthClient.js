import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';
import { Platform } from 'react-native';

import ENV from '../../config/env';

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const resolveEmailRedirectUrl = () => {
  if (ENV.NEON_EMAIL_REDIRECT_URL) {
    return ENV.NEON_EMAIL_REDIRECT_URL;
  }
  if (ENV.API_BASE_URL) {
    return `${normalizeBaseUrl(ENV.API_BASE_URL)}/auth/neon/callback`;
  }
  return '';
};

const resolveWebEmailRedirectUrl = () => {
  if (Platform.OS !== 'web') {
    return '';
  }
  return resolveEmailRedirectUrl();
};

const warnMissingConfig = () => {
  const missingKeys = [];

  if (!ENV.NEON_AUTH_URL) {
    missingKeys.push('NEON_AUTH_URL');
  }

  if (!ENV.NEON_DATA_API_URL) {
    missingKeys.push('NEON_DATA_API_URL');
  }

  if (Platform.OS === 'web' && !resolveEmailRedirectUrl()) {
    // This is not strictly blocking for all auth flows (e.g. login), but needed for signup/magic links often.
    // We'll warn but maybe not fail initialization completely if only this is missing?
    // However, the original code returned 'true' (error) if this was missing. 
    // Let's keep it safe but strict for now, or relax if needed. 
    // For now, I'll stick to the plan of "better debug info".
    missingKeys.push('NEON_EMAIL_REDIRECT_URL or API_BASE_URL');
  }

  if (missingKeys.length > 0) {
    console.warn(
      `[NeonAuth] Missing configuration: ${missingKeys.join(', ')}. Authentication will not work.`
    );
    return true;
  }

  return false;
};

const neonClient = !warnMissingConfig()
  ? createClient({
    auth: {
      adapter: SupabaseAuthAdapter(),
      url: ENV.NEON_AUTH_URL,
    },
    dataApi: {
      url: ENV.NEON_DATA_API_URL,
    },
  })
  : null;

const EMAIL_REDIRECT_URL = resolveWebEmailRedirectUrl();

const normalizeSession = (session) => {
  if (!session) return null;

  const expiresAt =
    session.expiresAt ||
    session.expires_at ||
    (session.expires_in
      ? Math.floor(Date.now() / 1000) + session.expires_in
      : null);

  return {
    accessToken: session.accessToken || session.jwt || session.token || null,
    refreshToken: session.refreshToken || session.refresh_token || null,
    expiresAt,
    user: session.user || null,
    raw: session,
  };
};

const handleResult = ({ data, error }) => {
  if (error) {
    throw error;
  }
  return normalizeSession(data?.session);
};

export const signUpWithEmail = async ({ email, password, data }) => {
  if (!neonClient) {
    throw new Error('Neon auth client is not initialized.');
  }
  const options = {};
  if (EMAIL_REDIRECT_URL) {
    options.emailRedirectTo = EMAIL_REDIRECT_URL;
  }
  if (data) {
    options.data = data;
  }

  console.log('[NeonAuth] Signing up with redirect URL:', options.emailRedirectTo || '(none)');
  console.log('[NeonAuth] Using Auth options:', JSON.stringify(options, null, 2));

  const result = await neonClient.auth.signUp({
    email,
    password,
    options,
  });
  return handleResult(result);
};

export const signInWithEmail = async ({ email, password }) => {
  if (!neonClient) {
    throw new Error('Neon auth client is not initialized.');
  }

  const isWeb = Platform.OS === 'web';
  const result = await neonClient.auth.signInWithPassword({
    email,
    password,
    ...(isWeb && EMAIL_REDIRECT_URL ? { options: { emailRedirectTo: EMAIL_REDIRECT_URL } } : {}),
  });
  return handleResult(result);
};

export const refreshNeonSession = async (refreshToken) => {
  if (!neonClient) {
    throw new Error('Neon auth client is not initialized.');
  }
  const result = await neonClient.auth.refreshSession({ refreshToken });
  return handleResult(result);
};

export const signOutFromNeon = async () => {
  if (!neonClient) {
    return;
  }
  await neonClient.auth.signOut();
};

export const getNeonSession = async () => {
  if (!neonClient) {
    return null;
  }
  const result = await neonClient.auth.getSession();
  return handleResult(result);
};

export const getNeonClient = () => neonClient;

export default {
  signUpWithEmail,
  signInWithEmail,
  refreshNeonSession,
  signOutFromNeon,
  getNeonSession,
  getNeonClient,
};
