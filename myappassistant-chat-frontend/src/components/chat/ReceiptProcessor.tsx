"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "./FileUpload";
import { ReceiptDataTable } from "./ReceiptDataTable";
import { receiptAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X,
  Save,
  Edit
} from "lucide-react";

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  expiration_date?: string;
  unit?: string;
}

interface ReceiptData {
  store_name: string;
  date: string;
  total_amount: number;
  items: ReceiptItem[];
}

interface ReceiptProcessorProps {
  onComplete?: (data: ReceiptData) => void;
  onCancel?: () => void;
}

type ProcessingStep = 'upload' | 'processing' | 'editing' | 'saving' | 'complete' | 'error';

export function ReceiptProcessor({ onComplete, onCancel }: ReceiptProcessorProps) {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Polling statusu zadania
  useEffect(() => {
    if (taskId && currentStep === 'processing') {
      const interval = setInterval(async () => {
        try {
          const statusResponse = await receiptAPI.getTaskStatus(taskId);
          const status = statusResponse.data.status;
          
          if (status === 'SUCCESS') {
            setReceiptData(statusResponse.data.result.analysis);
            setCurrentStep('editing');
            setProcessingProgress(100);
          } else if (status === 'FAILURE') {
            setError(statusResponse.data.error || 'Błąd przetwarzania paragonu');
            setCurrentStep('error');
          } else if (status === 'PROGRESS') {
            setProcessingProgress(statusResponse.data.progress || 0);
          }
        } catch (err) {
          console.error('Błąd sprawdzania statusu:', err);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [taskId, currentStep]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setCurrentStep('processing');
    setProcessingProgress(0);
    setError(null);

    try {
      // Użyj asynchronicznego przetwarzania
      const response = await receiptAPI.processReceiptAsync(file);
      setTaskId(response.data.job_id);
    } catch (err) {
      console.error('Błąd uruchomienia przetwarzania:', err);
      setError('Błąd uruchomienia przetwarzania paragonu');
      setCurrentStep('error');
    }
  };

  const handleSave = async (data: ReceiptData) => {
    setCurrentStep('saving');
    setError(null);

    try {
      // Przygotuj dane do zapisu
      const saveData = {
        trip_date: data.date,
        store_name: data.store_name,
        total_amount: data.total_amount,
        products: data.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          category: item.category,
          expiration_date: item.expiration_date,
          unit: item.unit
        }))
      };

      await receiptAPI.saveReceiptData(saveData);
      setCurrentStep('complete');
      onComplete?.(data);
    } catch (err) {
      console.error('Błąd zapisywania:', err);
      setError('Błąd zapisywania danych do bazy');
      setCurrentStep('error');
    }
  };

  const handleCancel = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setReceiptData(null);
    setProcessingProgress(0);
    setError(null);
    setTaskId(null);
    onCancel?.();
  };

  const handleRetry = () => {
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUpload
            onFileSelect={handleFileSelect}
            onCancel={handleCancel}
            acceptedTypes={["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"]}
            maxSize={10}
          />
        );

      case 'processing':
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Przetwarzanie paragonu...</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Analizuję tekst i wyciągam dane produktów
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Postęp</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Rozpoznawanie tekstu (OCR)</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  <span>Analiza strukturalna</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Kategoryzacja produktów</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'editing':
        return receiptData ? (
          <ReceiptDataTable
            data={receiptData}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={false}
          />
        ) : null;

      case 'saving':
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Zapisywanie danych...</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Zapisuję dane paragonu do bazy danych
              </p>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2 text-green-600">Sukces!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Paragon został pomyślnie przetworzony i zapisany
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sklep:</span>
                  <span className="font-medium">{receiptData?.store_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span className="font-medium">{receiptData?.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Produktów:</span>
                  <span className="font-medium">{receiptData?.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Suma:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pl-PL', {
                      style: 'currency',
                      currency: 'PLN'
                    }).format(receiptData?.total_amount || 0)}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleCancel}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Przetwórz kolejny paragon
              </Button>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2 text-red-600">Błąd przetwarzania</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'Wystąpił nieoczekiwany błąd'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Spróbuj ponownie
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Anuluj
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Nagłówek z krokiem */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Przetwarzanie paragonu</h2>
          {currentStep !== 'upload' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Anuluj
            </Button>
          )}
        </div>

        {/* Pasek postępu */}
        <div className="flex items-center gap-4 mb-4">
          {[
            { step: 'upload', label: 'Upload', icon: Upload },
            { step: 'processing', label: 'Przetwarzanie', icon: FileText },
            { step: 'editing', label: 'Edycja', icon: Edit },
            { step: 'complete', label: 'Gotowe', icon: CheckCircle }
          ].map(({ step, label, icon: Icon }, index) => {
            const isActive = currentStep === step;
            const isCompleted = ['complete', 'editing', 'saving'].includes(currentStep) && 
                               ['upload', 'processing'].includes(step);
            
            return (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${isActive ? 'border-blue-500 bg-blue-500 text-white' : ''}
                  ${isCompleted ? 'border-green-500 bg-green-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'border-gray-300 text-gray-400' : ''}
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`
                  ml-2 text-sm font-medium
                  ${isActive ? 'text-blue-600' : ''}
                  ${isCompleted ? 'text-green-600' : ''}
                  ${!isActive && !isCompleted ? 'text-gray-400' : ''}
                `}>
                  {label}
                </span>
                {index < 3 && (
                  <div className={`
                    w-8 h-0.5 mx-2
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Zawartość kroku */}
      {renderStepContent()}
    </div>
  );
} 