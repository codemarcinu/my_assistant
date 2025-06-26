import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { receiptAPI } from '../services/api';
import type { ReceiptData, ReceiptItem } from '../types';

const OCRPage: React.FC = () => {
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
      const response = await receiptAPI.uploadReceipt(file);
      setReceiptData(response.data);
    } catch (err) {
      setError('Błąd podczas przetwarzania paragonu. Spróbuj ponownie.');
      console.error('OCR upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Skanowanie Paragonów
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Prześlij zdjęcie paragonu, aby automatycznie rozpoznać produkty i dodać je do spiżarni.
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
          
          <div className="space-y-4">
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">
                  Przetwarzanie paragonu...
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Przeciągnij i upuść paragon
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    lub kliknij, aby wybrać plik
                  </p>
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Wybierz plik
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Obsługiwane formaty: JPG, PNG, GIF (max 10MB)
                </p>
              </>
            )}
          </div>
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

      {/* Results Display */}
      {receiptData && (
        <div className="space-y-6">
          {/* Receipt Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Szczegóły paragonu
              </h2>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  Rozpoznano
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sklep</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {receiptData.store}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(receiptData.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Suma</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(receiptData.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rozpoznane produkty ({receiptData.items.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {receiptData.items.map((item: ReceiptItem, index: number) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    {item.category && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kategoria: {item.category}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Dodaj do spiżarni
            </button>
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Dodaj do listy zakupów
            </button>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Edytuj
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRPage;
