import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
// import { useTheme } from '../ThemeProvider';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout component for the application structure.
 * 
 * This component provides the main layout structure with sidebar,
 * header, and content area, following the .cursorrules guidelines.
 */
export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // const { resolvedTheme } = useTheme();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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
        <footer className={`
          p-4 border-t text-center text-sm
          ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
          transition-all duration-300
        `}>
          <p className="text-gray-500 dark:text-gray-400">
            Personal AI Assistant v1.0 • Powered by Claude AI • 
            <span className="ml-1">
              Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
} 