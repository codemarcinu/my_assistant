import React from 'react';
import { useTheme } from '../ThemeProvider';
import WeatherWidget from '../features/weather/WeatherWidget';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { resolvedTheme } = useTheme();

  return (
    <header 
      className={`
        ${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        border-b sticky top-0 z-10
      `}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left Section - Menu Button & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-2xl">🍽️</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">FoodSave AI</h1>
          </div>
        </div>

        {/* Center Section - Weather Widget */}
        <div className="flex-1 flex justify-center max-w-md mx-4">
          <WeatherWidget />
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{resolvedTheme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="hidden md:inline">Dashboard</span>
          </div>
          
          {/* User Avatar */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
        </div>
      </div>
    </header>
  );
} 