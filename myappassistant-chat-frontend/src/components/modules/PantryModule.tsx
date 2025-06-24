import React from 'react';

// src/modules/PantryModule.tsx
type PantryModuleProps = {
  onClose: () => void;
  onManagePantry: () => void;
};

// Moduł do przeglądu spiżarni, pojawiający się kontekstowo.
const PantryModule: React.FC<PantryModuleProps> = ({ onClose, onManagePantry }) => {
  return (
    <div className="bg-cosmic-neutral-3 rounded-xl p-5 shadow-lg border border-cosmic-neutral-4 dark:bg-cosmic-neutral-8 dark:text-cosmic-bg dark:border-cosmic-neutral-6 transition-all duration-300 relative">
      <button onClick={onClose} className="absolute top-2 right-2 text-cosmic-neutral-6 hover:text-cosmic-text dark:text-cosmic-neutral-5 dark:hover:text-cosmic-bg text-2xl">&times;</button>
      <h3 className="text-xl font-bold mb-3 text-cosmic-accent dark:text-cosmic-ext-blue">Twoja Spiżarnia - Szybki Podgląd</h3>
      <p className="text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-4">Oto kilka Twoich produktów, które zaraz się kończą lub zbliża się ich termin ważności:</p>
      <ul className="list-disc list-inside text-cosmic-neutral-9 dark:text-cosmic-neutral-2 space-y-1">
        <li>Mleko (termin: 2025-07-01)</li>
        <li>Jajka (termin: 2025-06-28)</li>
        <li>Chleb (termin: 2025-06-25)</li>
        <li>Ser żółty (termin: 2025-07-05)</li>
      </ul>
      <button
        onClick={onManagePantry}
        className="mt-5 bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0 p-2 rounded-lg font-semibold shadow-md transition-all duration-200"
      >
        Pełne Zarządzanie Spiżarnią
      </button>
    </div>
  );
};

export default PantryModule; 