import { createClient } from '@neondatabase/neon-js';
import ENV from '../../config/env';

const warnMissingConfig = () => {
  if (!ENV.NEON_AUTH_URL) {
    console.warn('NEON_AUTH_URL is not configured. Neon auth calls will fail.');
    return true;
  }
  return false;
};

const neonClient = !warnMissingConfig()
  ? createClient({
      authUrl: ENV.NEON_AUTH_URL,
    })
  : null;

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
  const result = await neonClient.auth.signUp({
    email,
    password,
    data,
  });
  return handleResult(result);
};

export const signInWithEmail = async ({ email, password }) => {
  if (!neonClient) {
    throw new Error('Neon auth client is not initialized.');
  }
  const result = await neonClient.auth.signInWithPassword({
    email,
    password,
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
