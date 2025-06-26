import React, { useState, useRef } from 'react';
import { useTheme } from '../ThemeProvider';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

// src/modules/ReceiptUploadModule.tsx
interface ReceiptUploadModuleProps {
  onClose: () => void;
  onUploadSuccess: () => void;
}

/**
 * ReceiptUploadModule component for OCR receipt processing.
 * 
 * This component provides a drag-and-drop interface for uploading
 * receipts and processing them with OCR, following the .cursorrules guidelines.
 */
const ReceiptUploadModule: React.FC<ReceiptUploadModuleProps> = ({ onClose, onUploadSuccess }) => {
  const { resolvedTheme } = useTheme();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
    } else {
      setFileName(null);
      setFileSize(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      setFileSize(file.size);
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  const handleAnalyze = async () => {
    if (!fileName) return;

    setIsProcessing(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadProgress(100);
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 relative">
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl transition-colors"
        aria-label="Zamknij"
        disabled={isProcessing}
      >
        &times;
      </button>
      
      <h3 className="text-xl font-bold mb-3 text-blue-600 dark:text-blue-400">
        Wgraj Paragon (OCR)
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Prześlij zdjęcie paragonu, a FoodSave AI wyodrębni z niego dane o zakupach.
      </p>

      {/* Upload Area */}
      <div 
        className={`
          mt-4 p-6 border-2 border-dashed rounded-lg text-center transition-all duration-200
          ${resolvedTheme === 'dark' 
            ? 'border-gray-600 hover:border-blue-500 bg-gray-700' 
            : 'border-gray-300 hover:border-blue-500 bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-4">📷</div>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Przeciągnij i upuść plik lub
        </p>
        
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          id="receipt-upload-module" 
          onChange={handleFileChange} 
          accept="image/*,.pdf"
          disabled={isProcessing}
        />
        
        <label 
          htmlFor="receipt-upload-module" 
          className={`
            cursor-pointer inline-block px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200
            ${fileName 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {fileName ? `Wybrano: ${fileName}` : 'Wybierz plik'}
        </label>
        
        {fileName && fileSize && (
          <div className="mt-2">
            <Badge variant="info" size="sm">
              {formatFileSize(fileSize)}
            </Badge>
          </div>
        )}
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Przetwarzanie paragonu...
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={!fileName || isProcessing}
        className={`
          mt-5 w-full p-3 rounded-lg font-semibold shadow-md transition-all duration-200
          ${!fileName || isProcessing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <Spinner size="sm" className="mr-2" />
            Analizuję...
          </div>
        ) : (
          'Analizuj Paragon'
        )}
      </button>

      {/* Supported Formats */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Obsługiwane formaty: JPG, PNG, PDF
      </div>
    </div>
  );
};

export default ReceiptUploadModule; 