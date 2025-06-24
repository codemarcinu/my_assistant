import React from 'react';

// src/pages/PantryPage.tsx
// Dedykowana strona dla szczegółowego zarządzania spiżarnią.
const PantryPage: React.FC = () => {
  return (
    <div className="bg-cosmic-primary-container-bg rounded-xl p-6 shadow-xl border border-cosmic-neutral-3 dark:bg-cosmic-neutral-9 dark:text-cosmic-bg dark:border-cosmic-neutral-8 transition-colors duration-300 min-h-[calc(100vh-120px)]">
      <h2 className="text-2xl font-bold mb-4 text-cosmic-accent dark:text-cosmic-ext-blue">Szczegółowe Zarządzanie Spiżarnią</h2>
      <p className="text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-4">Tutaj możesz przeglądać, dodawać, edytować i usuwać wszystkie produkty w Twojej spiżarni.</p>

      {/* Przykładowa sekcja listy produktów */}
      <div className="bg-cosmic-neutral-3 p-4 rounded-lg mb-4 dark:bg-cosmic-neutral-8">
        <h3 className="text-xl font-semibold mb-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">Lista Produktów</h3>
        <ul className="space-y-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">
          <li className="flex justify-between items-center bg-cosmic-neutral-4 p-2 rounded dark:bg-cosmic-neutral-7">
            <span>Mleko 🥛 (1L) - Ważne do: 2025-07-01</span>
            <div className="space-x-2">
              <button className="text-cosmic-accent-blue hover:text-cosmic-blue">Edytuj</button>
              <button className="text-cosmic-bright-red hover:text-cosmic-red">Usuń</button>
            </div>
          </li>
          <li className="flex justify-between items-center bg-cosmic-neutral-4 p-2 rounded dark:bg-cosmic-neutral-7">
            <span>Jajka 🥚 (6 szt.) - Ważne do: 2025-06-28</span>
            <div className="space-x-2">
              <button className="text-cosmic-accent-blue hover:text-cosmic-blue">Edytuj</button>
              <button className="text-cosmic-bright-red hover:text-cosmic-red">Usuń</button>
            </div>
          </li>
          {/* Więcej produktów... */}
        </ul>
      </div>

      {/* Formularz dodawania nowego produktu */}
      <div className="bg-cosmic-neutral-3 p-4 rounded-lg dark:bg-cosmic-neutral-8">
        <h3 className="text-xl font-semibold mb-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">Dodaj Nowy Produkt</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Nazwa produktu" className="p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green" />
          <input type="text" placeholder="Ilość/Jednostka (np. 1kg, 5 szt.)" className="p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green" />
          <input type="date" placeholder="Termin ważności" className="p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green" />
          <input type="text" placeholder="Kategoria (opcjonalnie)" className="p-2 rounded-lg bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green" />
        </div>
        <button className="mt-4 bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0 p-2 rounded-lg font-semibold shadow-md transition-all duration-200">
          Dodaj Produkt
        </button>
      </div>
    </div>
  );
};

export default PantryPage; 