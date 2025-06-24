import React, { useState, useEffect } from 'react';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true); // Domyślnie tryb ciemny

  useEffect(() => {
    // Przy montowaniu sprawdzamy preferowany tryb ciemny lub zapisany w local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newTheme);
      return newTheme;
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-cosmic-primary-container-bg text-cosmic-text dark:bg-cosmic-neutral-9 dark:text-cosmic-primary-container-bg focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green transition-all duration-300"
      title={isDark ? "Przełącz na Tryb Jasny" : "Przełącz na Tryb Ciemny"}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle; 