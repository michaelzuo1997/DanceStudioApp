import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import i18n, { initI18n, changeLanguage } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => {
      setLocale(i18n.language);
      setReady(true);
    });
  }, []);

  const setLanguage = useCallback(async (lang) => {
    await changeLanguage(lang);
    setLocale(lang);
  }, []);

  const value = {
    locale,
    setLocale: setLanguage,
    ready,
    t: (key, options) => i18n.t(key, options),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
