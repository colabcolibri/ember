import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt.json';
import en from './locales/en.json';

const saved = localStorage.getItem('ember_locale');
const fallback = saved && ['pt', 'en'].includes(saved) ? saved : 'pt';

void i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: fallback,
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
});

export default i18n;
