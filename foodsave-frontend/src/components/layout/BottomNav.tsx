import React from 'react';
import { useTheme } from '../ThemeProvider';

const NAV_ITEMS = [
  { name: "Czat", icon: "💬", path: "/chat" },
  { name: "Zakupy", icon: "🛒", path: "/shopping" },
  { name: "Produkty", icon: "📦", path: "/products" },
  { name: "Ustawienia", icon: "⚙️", path: "/settings" },
];

export default function BottomNav() {
  const { resolvedTheme } = useTheme();

  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-50 lg:hidden
      ${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
      border-t
    `}>
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.name}
            className={`
              flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors
              ${resolvedTheme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
} 