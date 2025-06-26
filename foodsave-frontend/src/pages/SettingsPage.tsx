import React from 'react';
import RAGManagerModule from '../components/modules/RAGManagerModule';

// src/pages/SettingsPage.tsx
const SettingsPage: React.FC = () => {
  return (
    <div className="bg-cosmic-primary-container-bg rounded-xl p-6 shadow-xl border border-cosmic-neutral-3 dark:bg-cosmic-neutral-9 dark:text-cosmic-bg dark:border-cosmic-neutral-8 transition-colors duration-300 min-h-[calc(100vh-120px)]">
      <h2 className="text-2xl font-bold mb-4 text-cosmic-accent dark:text-cosmic-ext-blue">Ustawienia Asystenta</h2>

      {/* Sekcja zarządzania modelami */}
      <div className="mb-6 p-4 rounded-lg bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8">
        <h3 className="text-xl font-semibold mb-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">Zarządzanie Modelami AI</h3>
        <p className="text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-2">Podgląd statusu lokalnych modeli Ollama:</p>
        <ul className="list-disc list-inside text-cosmic-neutral-8 dark:text-cosmic-neutral-3">
          <li>Model Językowy: Aktywny (Llama 3)</li>
          <li>Model OCR: Aktywny (Tesseract.js)</li>
          <li>Orkiestrator: Działa poprawnie</li>
        </ul>
        <button className="mt-4 bg-cosmic-neutral-4 hover:bg-cosmic-neutral-5 text-cosmic-text p-2 rounded-lg font-semibold shadow-md transition-all duration-200 dark:bg-cosmic-neutral-7 dark:text-cosmic-bg dark:hover:bg-cosmic-neutral-6">
          Sprawdź Status Modeli
        </button>
      </div>

      {/* Sekcja integracji z Telegramem */}
      <div className="mb-6 p-4 rounded-lg bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8">
        <h3 className="text-xl font-semibold mb-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">Integracja z Telegramem</h3>
        <p className="text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-2">Połącz swojego bota Telegram z FoodSave AI. Użyj Tokena BotFather, aby aktywować integrację.</p>
        <label htmlFor="telegram-token" className="block text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-1">Token BotFather:</label>
        <input
          type="text"
          id="telegram-token"
          placeholder="Wprowadź swój token Telegram API"
          className="w-full p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green"
        />
        <button className="mt-4 bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0 p-2 rounded-lg font-semibold shadow-md transition-all duration-200">
          Aktywuj Integrację
        </button>
        <p className="text-cosmic-neutral-6 dark:text-cosmic-neutral-5 text-sm mt-2">Po aktywacji, możesz rozmawiać z FoodSave AI bezpośrednio w Telegramie, np. "co mam do jedzenia?"</p>
      </div>

      {/* Sekcja zarządzania dokumentami RAG */}
      <RAGManagerModule />

      {/* Sekcja zarządzania bazą danych */}
      <div className="p-4 rounded-lg bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8">
        <h3 className="text-xl font-semibold mb-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">Zarządzanie Bazą Danych</h3>
        <p className="text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-2">Opcje zarządzania danymi FoodSave AI.</p>
        <button className="bg-cosmic-bright-red hover:bg-cosmic-red text-cosmic-neutral-0 p-2 rounded-lg font-semibold shadow-md transition-all duration-200">
          Wyeksportuj Dane
        </button>
        <button className="ml-4 bg-cosmic-ext-yellow hover:bg-cosmic-yellow text-cosmic-neutral-0 p-2 rounded-lg font-semibold shadow-md transition-all duration-200">
          Wyczyść Bazę Danych (Ostrożnie!)
        </button>
      </div>
    </div>
  );
};

export default SettingsPage; 