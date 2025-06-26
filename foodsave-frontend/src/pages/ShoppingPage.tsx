import React from 'react';
import ReceiptUploadModule from '../components/modules/ReceiptUploadModule';

// src/pages/ShoppingPage.tsx
// Dedykowana strona do zarządzania zakupami i historią paragonów.
const ShoppingPage: React.FC = () => {
  return (
    <div className="bg-cosmic-primary-container-bg rounded-xl p-6 shadow-xl border border-cosmic-neutral-3 dark:bg-cosmic-neutral-9 dark:text-cosmic-bg dark:border-cosmic-neutral-8 transition-colors duration-300 min-h-[calc(100vh-120px)]">
      <h2 className="text-2xl font-bold mb-4 text-cosmic-accent dark:text-cosmic-ext-blue">Historia Zakupów i Paragony</h2>
      <p className="text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-4">Tutaj możesz przeglądać wszystkie zarejestrowane paragony i zarządzaj historią zakupów.</p>

      {/* Przykładowa lista paragonów */}
      <div className="bg-cosmic-neutral-3 p-4 rounded-lg mb-4 dark:bg-cosmic-neutral-8">
        <h3 className="text-xl font-semibold mb-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">Moje Paragony</h3>
        <ul className="space-y-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">
          <li className="flex justify-between items-center bg-cosmic-neutral-4 p-2 rounded dark:bg-cosmic-neutral-7">
            <span>Paragon z Biedronki - 2025-06-20</span>
            <div className="space-x-2">
              <button className="text-cosmic-accent-blue hover:text-cosmic-blue">Szczegóły</button>
              <button className="text-cosmic-bright-red hover:text-cosmic-red">Usuń</button>
            </div>
          </li>
          <li className="flex justify-between items-center bg-cosmic-neutral-4 p-2 rounded dark:bg-cosmic-neutral-7">
            <span>Paragon z Lidla - 2025-06-15</span>
            <div className="space-x-2">
              <button className="text-cosmic-accent-blue hover:text-cosmic-blue">Szczegóły</button>
              <button className="text-cosmic-bright-red hover:text-cosmic-red">Usuń</button>
            </div>
          </li>
          {/* Więcej paragonów... */}
        </ul>
      </div>

      <ReceiptUploadModule onClose={() => {}} onUploadSuccess={() => alert("Paragon został przesłany!")} />

      <button className="mt-6 bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0 p-3 rounded-lg font-semibold shadow-md transition-all duration-200">
        Generuj Listę Zakupów na Podstawie Spiżarni
      </button>
    </div>
  );
};

export default ShoppingPage;
