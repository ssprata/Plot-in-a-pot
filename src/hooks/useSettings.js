// src/hooks/useSettings.js
// Settings management hook extracted from App.jsx.
// Encapsulates buildInitialSettings, toggleSetting, and updateSetting.
import { useState, useCallback } from 'react';
import { loadConfig } from '../utils/configLoader';

// Constrói as definições iniciais do editor a partir da configuração e do LocalStorage.
// Isso permite persistir opções do utilizador entre sessões.
const buildInitialSettings = () => {
  const config = loadConfig();
  const saved = localStorage.getItem('plot-in-a-pot-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        showAdjacency: parsed.showAdjacency ?? config.showAdjacency,
        showSecrets: parsed.showSecrets ?? config.showSecrets,
        showFlowErrors: parsed.showFlowErrors ?? config.showFlowErrors,
        showSimulationLegacy: parsed.showSimulationLegacy ?? config.showSimulationLegacy,
        showSimulationOnValidation: parsed.showSimulationOnValidation ?? false,
        visualLogicEnabled: parsed.visualLogicEnabled ?? (config.visualLogicEnabled !== false),
        visualBlocksMode: parsed.visualBlocksMode ?? false,
        bgImageBlur: parsed.bgImageBlur ?? 5
      };
    } catch (e) { /* ignora parse inválido */ }
  }
  return {
    showAdjacency: config.showAdjacency,
    showSecrets: config.showSecrets,
    showFlowErrors: config.showFlowErrors,
    showSimulationLegacy: config.showSimulationLegacy,
    showSimulationOnValidation: false,
    visualLogicEnabled: config.visualLogicEnabled !== false,
    visualBlocksMode: false,
    bgImageBlur: 5
  };
};

export const useSettings = () => {
  const [settings, setSettings] = useState(buildInitialSettings);

  const toggleSetting = useCallback((key) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('plot-in-a-pot-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('plot-in-a-pot-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { settings, setSettings, toggleSetting, updateSetting };
};
