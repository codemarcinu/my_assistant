import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { receiptAPI, foodAPI } from '../../services/api';
import type { ReceiptData, ReceiptItem, FoodCategory, FoodStatus } from '../../types';
import { FoodCategory as FoodCategoryEnum, FoodStatus as FoodStatusEnum } from '../../types';
import Card from '../ui/atoms/Card';
import Button from '../ui/atoms/Button';
import { Badge } from '../ui/atoms/Badge';

// src/modules/ReceiptUploadModule.tsx
interface ReceiptUploadModuleProps {
  onReceiptProcessed?: (receiptData: ReceiptData) => void;
  onClose?: () => void;
  compact?: boolean;
}

/**
 * ReceiptUploadModule component for OCR receipt processing.
 * 
 * This component provides a drag-and-drop interface for uploading
 * receipts and processing them with OCR, following the .cursorrules guidelines.
 */
const ReceiptUploadModule: React.FC<ReceiptUploadModuleProps> = ({
  onReceiptProcessed,
  onClose,
  compact = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Proszę wybrać plik obrazu (JPG, PNG, etc.)');
      return;
    }

    setIsUploading(true);
    setError(null);
    setReceiptData(null);

    try {
      const response = await receiptAPI.processReceipt(file);
      
      console.log('Receipt processing response:', response);
      
      setReceiptData(response.data);
      onReceiptProcessed?.(response.data);
    } catch (err) {
      setError('Błąd podczas przetwarzania paragonu. Spróbuj ponownie.');
      console.error('OCR upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [onReceiptProcessed]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(price);
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'Brak daty';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Nieprawidłowa data';
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  };

  const handleAddToPantry = async () => {
    if (!receiptData || !receiptData.items || receiptData.items.length === 0) {
      setError('Brak produktów do dodania do spiżarni.');
      return;
    }
    setError(null);
    let successCount = 0;
    let failCount = 0;
    for (const item of receiptData.items) {
      try {
        await foodAPI.createFoodItem({
          name: item.name,
          category: (item.category as FoodCategory) || FoodCategoryEnum.OTHER,
          expirationDate: receiptData.date,
          quantity: item.quantity,
          unit: 'szt',
          status: FoodStatusEnum.FRESH,
        });
        successCount++;
      } catch (e) {
        failCount++;
        console.error('Błąd dodawania produktu do spiżarni:', e);
      }
    }
    if (successCount > 0) {
      setError(null);
      alert(`Dodano do spiżarni: ${successCount} produktów${failCount > 0 ? `, błędy: ${failCount}` : ''}`);
      resetForm();
    } else {
      setError('Nie udało się dodać produktów do spiżarni.');
    }
  };

  const handleAddToShoppingList = () => {
    // TODO: Implement add to shopping list functionality
    console.log('Adding to shopping list:', receiptData);
  };

  const resetForm = () => {
    setReceiptData(null);
    setError(null);
    setDragActive(false);
  };

  if (compact && !isUploading && !receiptData && !error) {
    return (
      <Card padding="md" shadow="sm">
        <div className="text-center">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Przeciągnij paragon lub kliknij
          </p>
          <input
            type="file"
            id="compact-file-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
          />
          <label
            htmlFor="compact-file-upload"
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-1" />
            Dodaj paragon
          </label>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dodaj paragon
        </h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      {!receiptData && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
            disabled={isUploading}
          />
          
          <div className="space-y-3">
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Przetwarzanie paragonu...
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Przeciągnij i upuść paragon
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    lub kliknij, aby wybrać plik
                  </p>
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Wybierz plik
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, GIF (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {receiptData && (
        <div className="space-y-4">
          {/* Receipt Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Szczegóły paragonu
              </h4>
              <Badge variant="success" size="sm">
                Rozpoznano
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Sklep</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {receiptData.store}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Data</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(receiptData.date)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Suma</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(receiptData.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Items Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Produkty ({Array.isArray(receiptData.items) ? receiptData.items.length : 0})
            </h4>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Array.isArray(receiptData.items)
                ? receiptData.items.slice(0, 5).map((item: ReceiptItem, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {item.name}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))
                : <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Brak produktów</p>
              }
              {Array.isArray(receiptData.items) && receiptData.items.length > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{receiptData.items.length - 5} więcej produktów
                </p>
              )}
            </div>
          </div>

          {/* Raw OCR Text (for debugging and fallback) */}
          {receiptData.ocr_text && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Rozpoznany tekst paragonu
              </h4>
              <div className="bg-white dark:bg-gray-700 rounded p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                  {receiptData.ocr_text}
                </pre>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Jeśli produkty nie zostały rozpoznane, sprawdź powyższy tekst
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToPantry}
              className="flex-1"
            >
              Dodaj do spiżarni
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddToShoppingList}
              className="flex-1"
            >
              Dodaj do listy zakupów
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
            >
              Nowy paragon
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReceiptUploadModule; 