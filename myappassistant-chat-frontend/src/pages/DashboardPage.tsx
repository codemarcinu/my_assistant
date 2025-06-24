import React from 'react';
import { useTheme } from '../components/ThemeProvider';
import ChatContainer from '../components/chat/ChatContainer';

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className={`
        px-6 py-4 border-b
        ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      `}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Czat AI
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Inteligentny asystent do zarządzania produktami i planowania posiłków
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">24</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Produkty</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">12</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Przepisy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">7</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Dni</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 p-6">
        <div className="h-full max-w-4xl mx-auto">
          <ChatContainer />
        </div>
      </div>

      {/* Footer */}
      <div className={`
        px-6 py-3 border-t text-center
        ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      `}>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          FoodSave AI v1.0 • Powered by Claude AI • 
          <span className="ml-1">Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}</span>
        </p>
      </div>
    </div>
  );
} 