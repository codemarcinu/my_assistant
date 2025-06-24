import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Trash2, Edit, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { shoppingAPI } from '../services/api';
import type { ShoppingItem } from '../types';
import { FoodCategory } from '../types';

const ShoppingPage: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // Form state for adding/editing items
  const [formData, setFormData] = useState({
    name: '',
    category: FoodCategory.OTHER,
    quantity: 1,
    unit: 'szt',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  // Load shopping items
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await shoppingAPI.getShoppingItems();
      setItems(response.data.items);
    } catch (err) {
      setError('Błąd podczas ładowania listy zakupów');
      console.error('Failed to load shopping items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Add new item
  const handleAddItem = async () => {
    try {
      const newItem = await shoppingAPI.createShoppingItem({
        ...formData,
        completed: false
      });
      setItems(prev => [...prev, newItem.data]);
      setFormData({
        name: '',
        category: FoodCategory.OTHER,
        quantity: 1,
        unit: 'szt',
        priority: 'medium',
        notes: ''
      });
      setIsAddingItem(false);
    } catch (err) {
      setError('Błąd podczas dodawania produktu');
      console.error('Failed to add item:', err);
    }
  };

  // Update item
  const handleUpdateItem = async (id: string, updates: Partial<ShoppingItem>) => {
    try {
      const updatedItem = await shoppingAPI.updateShoppingItem(id, updates);
      setItems(prev => prev.map(item => 
        item.id === id ? updatedItem.data : item
      ));
      setEditingItem(null);
    } catch (err) {
      setError('Błąd podczas aktualizacji produktu');
      console.error('Failed to update item:', err);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    try {
      await shoppingAPI.deleteShoppingItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Błąd podczas usuwania produktu');
      console.error('Failed to delete item:', err);
    }
  };

  // Toggle item completion
  const handleToggleCompletion = async (id: string) => {
    try {
      const updatedItem = await shoppingAPI.toggleItemCompletion(id);
      setItems(prev => prev.map(item => 
        item.id === id ? updatedItem.data : item
      ));
    } catch (err) {
      setError('Błąd podczas aktualizacji statusu');
      console.error('Failed to toggle completion:', err);
    }
  };

  // Clear completed items
  const handleClearCompleted = async () => {
    try {
      await shoppingAPI.clearCompletedItems();
      setItems(prev => prev.filter(item => !item.completed));
    } catch (err) {
      setError('Błąd podczas czyszczenia ukończonych produktów');
      console.error('Failed to clear completed items:', err);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCompletion = showCompleted || !item.completed;
    
    return matchesSearch && matchesCategory && matchesCompletion;
  });

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Lista Zakupów
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Zarządzaj produktami do kupienia i śledź postęp zakupów.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Wszystkie</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ukończone</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pozostało</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount - completedCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Szukaj produktów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as FoodCategory | 'all')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Wszystkie kategorie</option>
              {Object.values(FoodCategory).map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                showCompleted
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              {showCompleted ? 'Ukryj ukończone' : 'Pokaż ukończone'}
            </button>
          </div>
        </div>

        {/* Add Item Button */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setIsAddingItem(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj produkt
          </button>

          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Wyczyść ukończone
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Add Item Form */}
      {isAddingItem && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Dodaj nowy produkt
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Nazwa produktu"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as FoodCategory }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {Object.values(FoodCategory).map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Ilość"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Jednostka"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="low">Niski priorytet</option>
              <option value="medium">Średni priorytet</option>
              <option value="high">Wysoki priorytet</option>
            </select>
          </div>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Notatki (opcjonalnie)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddItem}
              disabled={!formData.name.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dodaj
            </button>
            <button
              onClick={() => setIsAddingItem(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Ładowanie...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || selectedCategory !== 'all' || !showCompleted
                ? 'Brak produktów spełniających kryteria'
                : 'Lista zakupów jest pusta. Dodaj pierwszy produkt!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  item.completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => handleToggleCompletion(item.id)}
                      className="text-gray-400 hover:text-green-500 transition-colors"
                    >
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {item.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {getPriorityIcon(item.priority)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.category}
                        </span>
                        {item.notes && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            • {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingPage;
