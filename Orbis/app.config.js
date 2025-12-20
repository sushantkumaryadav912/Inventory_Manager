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
      neonApiKey: getEnv('NEON_API_KEY', extraDefaults.neonApiKey || ''),
      environment: getEnv('NODE_ENV', extraDefaults.environment || 'development'),
      eas: {
        ...easDefaults,
        projectId: getEnv('EAS_PROJECT_ID', easDefaults.projectId || '')
      }
    }
  };
};
