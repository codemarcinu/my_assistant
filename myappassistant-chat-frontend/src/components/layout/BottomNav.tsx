import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Chat', href: '/chat', icon: '💬' },
  { name: 'OCR', href: '/ocr', icon: '📷' },
  { name: 'Weather', href: '/weather', icon: '🌤️' },
  { name: 'Shopping', href: '/shopping', icon: '🛒' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <nav className="flex justify-around">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`
                flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors
                ${isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}; 