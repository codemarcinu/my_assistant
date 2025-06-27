import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeProvider';
import { Badge } from '../ui/atoms/Badge';
import type { FoodItem, FoodStatus } from '../../types';

// src/modules/PantryModule.tsx
interface PantryModuleProps {
  onClose: () => void;
  onManagePantry: () => void;
}

/**
 * PantryModule component for quick pantry overview.
 * 
 * This component provides a quick overview of pantry items
 * with expiration dates and status, following the .cursorrules guidelines.
 */
const PantryModule: React.FC<PantryModuleProps> = ({ onClose, onManagePantry }) => {
  const { resolvedTheme } = useTheme();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockItems: FoodItem[] = [
      {
        id: '1',
        name: 'Mleko',
        category: 'dairy' as any,
        expirationDate: new Date('2025-07-01'),
        quantity: 1,
        unit: 'l',
        status: 'expiring_soon' as FoodStatus,
        addedDate: new Date('2025-06-20')
      },
      {
        id: '2',
        name: 'Jajka',
        category: 'dairy' as any,
        expirationDate: new Date('2025-06-28'),
        quantity: 10,
        unit: 'szt',
        status: 'expiring_soon' as FoodStatus,
        addedDate: new Date('2025-06-18')
      },
      {
        id: '3',
        name: 'Chleb',
        category: 'bakery' as any,
        expirationDate: new Date('2025-06-25'),
        quantity: 1,
        unit: 'szt',
        status: 'expired' as FoodStatus,
        addedDate: new Date('2025-06-20')
      },
      {
        id: '4',
        name: 'Ser żółty',
        category: 'dairy' as any,
        expirationDate: new Date('2025-07-05'),
        quantity: 200,
        unit: 'g',
        status: 'fresh' as FoodStatus,
        addedDate: new Date('2025-06-22')
      }
    ];

    setTimeout(() => {
      setItems(mockItems);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status: FoodStatus) => {
    switch (status) {
      case 'fresh': return 'success';
      case 'expiring_soon': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: FoodStatus) => {
    switch (status) {
      case 'fresh': return 'Świeży';
      case 'expiring_soon': return 'Kończy się';
      case 'expired': return 'Przeterminowany';
      default: return 'Nieznany';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL');
  };

  const getDaysUntilExpiry = (expirationDate: Date) => {
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 relative">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Ładowanie spiżarni...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 relative">
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl transition-colors"
        aria-label="Zamknij"
      >
        &times;
      </button>
      
      <h3 className="text-xl font-bold mb-3 text-blue-600 dark:text-blue-400">
        Twoja Spiżarnia - Szybki Podgląd
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Oto produkty, które zaraz się kończą lub zbliża się ich termin ważności:
      </p>
      
      <div className="space-y-3 mb-5">
        {items.map((item) => {
          const daysUntilExpiry = getDaysUntilExpiry(item.expirationDate);
          return (
            <div 
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </span>
                  <Badge variant={getStatusColor(item.status)} size="sm">
                    {getStatusText(item.status)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.quantity} {item.unit} • Termin: {formatDate(item.expirationDate)}
                  {daysUntilExpiry > 0 && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                      (za {daysUntilExpiry} dni)
                    </span>
                  )}
                  {daysUntilExpiry <= 0 && (
                    <span className="ml-2 text-red-600 dark:text-red-400">
                      (przeterminowany)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button
        onClick={onManagePantry}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Pełne Zarządzanie Spiżarnią
      </button>
    </div>
  );
};

export default PantryModule; 