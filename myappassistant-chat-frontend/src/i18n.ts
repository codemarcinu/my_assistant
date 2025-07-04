import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Przykładowe tłumaczenia PL
const resources = {
  pl: {
    translation: {
      'sidebar.dashboard': 'Dashboard',
      'sidebar.dashboard_desc': 'Panel główny',
      'sidebar.ocr': 'OCR',
      'sidebar.ocr_desc': 'Rozpoznawanie paragonów',
      'sidebar.pantry': 'Spiżarnia',
      'sidebar.pantry_desc': 'Zarządzanie spiżarnią',
      'sidebar.promotions': 'Promocje',
      'sidebar.promotions_desc': 'Monitorowanie promocji',
      'sidebar.analytics': 'Analityka',
      'sidebar.analytics_desc': 'Statystyki i analizy',
      'sidebar.rag': 'RAG',
      'sidebar.rag_desc': 'Wyszukiwanie w dokumentach',
      'sidebar.settings': 'Ustawienia',
      'sidebar.settings_desc': 'Konfiguracja aplikacji',
      // Dodaj więcej tłumaczeń według potrzeb
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pl',
    fallbackLng: 'pl',
    interpolation: { escapeValue: false },
  });

export default i18n; 