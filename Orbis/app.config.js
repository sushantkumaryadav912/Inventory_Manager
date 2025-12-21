require('dotenv').config();

const getEnv = (key, fallback = '') => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
};

module.exports = ({ config }) => {
  const extraDefaults = config.extra || {};
  const easDefaults = extraDefaults.eas || {};

  return {
    ...config,
    extra: {
      ...extraDefaults,
      apiBaseUrl: getEnv('API_BASE_URL', extraDefaults.apiBaseUrl || ''),
      neonProjectId: getEnv('NEON_PROJECT_ID', extraDefaults.neonProjectId || ''),
      neonAuthUrl: getEnv('NEON_AUTH_URL', extraDefaults.neonAuthUrl || ''),
      neonDataApiUrl: getEnv('NEON_DATA_API_URL', extraDefaults.neonDataApiUrl || ''),
      neonEmailRedirectUrl: getEnv('NEON_EMAIL_REDIRECT_URL', extraDefaults.neonEmailRedirectUrl || ''),
      environment: getEnv('NODE_ENV', extraDefaults.environment || 'development'),
      eas: {
        ...easDefaults,
        projectId: getEnv('EAS_PROJECT_ID', easDefaults.projectId || '')
      }
    }
  };
};
