import React from 'react';
import ThemeToggle from './ThemeToggle';

// src/components/Layout.tsx
// Główny komponent układu aplikacji z bocznym paskiem nawigacji i nagłówkiem.
const Layout: React.FC<{ children: React.ReactNode, setCurrentPage: (page: string) => void, currentPage: string }> = ({ children, setCurrentPage, currentPage }) => {
  const navItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Settings", icon: "⚙️" }
  ];

  return (
    <div className="flex h-screen bg-cosmic-bg text-cosmic-text font-sans dark:bg-cosmic-neutral-tint-light dark:text-cosmic-bg transition-colors duration-300">
      {/* Pasek boczny nawigacji */}
      <aside className="w-16 bg-cosmic-primary-container-bg flex flex-col items-center py-4 space-y-6 dark:bg-cosmic-neutral-9 transition-colors duration-300 rounded-tr-lg rounded-br-lg shadow-lg">
        {navItems.map(item => (
          <button
            key={item.name}
            title={item.name}
            onClick={() => setCurrentPage(item.name)}
            className={`p-2 rounded-full hover:bg-cosmic-bright-green hover:text-cosmic-text transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green ${currentPage === item.name ? 'bg-cosmic-bright-green text-cosmic-text' : 'text-cosmic-neutral-7 dark:text-cosmic-neutral-4 dark:hover:bg-cosmic-accent-green'}`}
          >
            <span className="text-2xl">
              {item.icon}
            </span>
          </button>
        ))}
      </aside>

      {/* Główny obszar zawartości */}
      <main className="flex-1 flex flex-col rounded-tl-lg rounded-bl-lg overflow-hidden">
        {/* Nagłówek */}
        <header className="flex justify-between items-center p-4 bg-cosmic-primary-container-bg shadow dark:bg-cosmic-neutral-9 transition-colors duration-300 border-b border-cosmic-neutral-3 dark:border-cosmic-neutral-8">
          <h1 className="text-2xl font-bold text-cosmic-bright-green dark:text-cosmic-ext-blue">FoodSave AI</h1>
          <ThemeToggle />
        </header>
        {/* Obszar zawartości dla komponentów-dzieci */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-cosmic-bg dark:bg-cosmic-neutral-tint-light transition-colors duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 