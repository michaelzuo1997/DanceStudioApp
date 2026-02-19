import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import zh from './zh.json';

const LANGUAGE_KEY = 'user-language';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

const getSavedLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    return saved || null;
  } catch {
    return null;
  }
};

const detectLanguage = () => {
  const locale = Localization.getLocales()?.[0]?.languageCode || 'en';
  return locale.startsWith('zh') ? 'zh' : 'en';
};

export const initI18n = async () => {
  const savedLang = await getSavedLanguage();
  const language = savedLang || detectLanguage();
  
  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
  
  return i18n;
};

export const changeLanguage = async (lang) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
};

export default i18n;
