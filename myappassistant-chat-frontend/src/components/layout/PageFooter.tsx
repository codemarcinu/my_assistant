
import React from 'react';
import { useTheme } from '../ThemeProvider';

const PageFooter: React.FC = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`
      px-6 py-3 border-t text-center
      ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
    `}>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        FoodSave AI v1.0 • Powered by Claude AI • 
        <span className="ml-1">Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}</span>
      </p>
    </div>
  );
};

export default PageFooter;
