import React from 'react';
import { useTheme } from '../ThemeProvider';
import WeatherWidget from '../features/weather/WeatherWidget';

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * Header component for the application.
 * 
 * This component provides the main header with navigation controls,
 * weather widget, and user menu, following the .cursorrules guidelines.
 */
export default function Header({ onMenuClick }: HeaderProps) {
  const { resolvedTheme } = useTheme();

  return (
    <header 
      className={`
        ${resolvedTheme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'}
        border-b sticky top-0 z-10 shadow-sm
      `}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left Section - Menu Button & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Otwórz menu nawigacji"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-2xl" role="img" aria-label="FoodSave AI Logo">🍽️</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">FoodSave AI</h1>
          </div>
        </div>

        {/* Center Section - Weather Widget */}
        <div className="flex-1 flex justify-center max-w-md mx-4">
          <WeatherWidget />
        </div>

        {/* Right Section - User Menu & Status */}
        <div className="flex items-center space-x-4">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden md:inline">System aktywny</span>
          </div>
          
          {/* Theme Indicator */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span role="img" aria-label="Theme indicator">
              {resolvedTheme === 'dark' ? '🌙' : '☀️'}
            </span>
          </div>
          
          {/* User Avatar */}
          <div className="relative">
            <button
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
              aria-label="Menu użytkownika"
            >
              <span className="text-white text-sm font-medium">U</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 