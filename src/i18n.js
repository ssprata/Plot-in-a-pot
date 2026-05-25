import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './utils/translations'; 

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translations.en
      },
      pt: {
        translation: translations.pt
      }
    },
    fallbackLng: 'en',
    debug: true, 
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;