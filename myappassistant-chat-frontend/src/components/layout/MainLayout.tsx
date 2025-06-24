import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
// import { useTheme } from '../ThemeProvider';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Collapsible Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 mt-6 mb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 