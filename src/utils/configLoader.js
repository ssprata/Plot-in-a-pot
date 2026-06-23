import config from '../config.json';

const defaultConfig = {
  showAdjacency: false,
  showSecrets: true,
  showFlowErrors: true,
  visualLogicEnabled: true,
  theme: 'light'
};

export const loadConfig = () => {
  try {
    // Merge defaults with config, in case some keys are missing
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.warn('Failed to load config.json, using defaults:', error);
    return defaultConfig;
  }
};