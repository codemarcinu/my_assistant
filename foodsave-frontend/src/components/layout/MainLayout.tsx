import React, { useState, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
// import { useTheme } from '../ThemeProvider';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout component for the application structure with performance optimization.
 * 
 * This component provides the main layout structure with sidebar,
 * header, and content area, following the .cursorrules guidelines.
 */
const MainLayout: React.FC<MainLayoutProps> = React.memo(({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // const { resolvedTheme } = useTheme();

  // Memoizacja funkcji toggle sidebar
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Memoizacja daty ostatniej aktualizacji
  const lastUpdateDate = useMemo(() => {
    return new Date().toLocaleDateString('pl-PL');
  }, []);

  // Memoizacja klas footer
  const footerClasses = useMemo(() => {
    const baseClasses = 'p-4 border-t text-center text-sm transition-all duration-300';
    const marginClass = sidebarCollapsed ? 'ml-16' : 'ml-64';
    return `${baseClasses} ${marginClass}`;
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Collapsible Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={handleSidebarToggle} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={handleSidebarToggle} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        <footer className={footerClasses}>
          <p className="text-gray-500 dark:text-gray-400">
            FoodSave AI v1.0 • Powered by Claude AI • 
            <span className="ml-1">
              Ostatnia aktualizacja: {lastUpdateDate}
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout; 