import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import ThemeToggle from '../ThemeToggle';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { name: "Dashboard", icon: "🏠", path: "/dashboard" },
  { name: "Chat", icon: "💬", path: "/chat" },
  { name: "Zakupy", icon: "🛒", path: "/shopping" },
  { name: "Produkty", icon: "📦", path: "/pantry" },
  { name: "OCR", icon: "📷", path: "/ocr" },
  { name: "Pogoda", icon: "🌤️", path: "/weather" },
  { name: "Ustawienia", icon: "⚙️", path: "/settings" },
];

/**
 * Sidebar component for navigation.
 * 
 * This component provides the main navigation structure with
 * proper active states and responsive design, following the .cursorrules guidelines.
 */
export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside 
      className={`
        ${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        border-r transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
        flex flex-col h-screen sticky top-0 z-20
      `}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">FoodSave AI</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
        >
          {collapsed ? (
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? resolvedTheme === 'dark'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                      : resolvedTheme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${collapsed ? 'justify-center' : 'justify-start space-x-3'}
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!collapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={collapsed ? 'flex justify-center' : ''}>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
} 