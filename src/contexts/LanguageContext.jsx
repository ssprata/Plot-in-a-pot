import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { translations, getTranslation } from '../utils/translations';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: () => ''
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const stored = localStorage.getItem('plot-in-a-pot-language');
    if (stored && translations[stored]) {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('plot-in-a-pot-language', language);
  }, [language]);

  const t = useMemo(() => (path, fallback = '') => getTranslation(language, path, fallback), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
