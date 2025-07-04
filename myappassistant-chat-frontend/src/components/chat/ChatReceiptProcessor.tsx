"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "./FileUpload";
import { ReceiptDataTable } from "./ReceiptDataTable";
import { receiptAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X,
  Edit,
  Receipt
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

interface ChatReceiptProcessorProps {
  onComplete?: (data: ReceiptData) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

type ProcessingStep = 'upload' | 'processing' | 'editing' | 'saving' | 'complete' | 'error';

export function ChatReceiptProcessor({ onComplete, onCancel, onError }: ChatReceiptProcessorProps) {
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
          
          if (status === 'completed') {
            const analysis = statusResponse.data.result?.analysis as Record<string, unknown>;
            // Konwertuj dane z analizy na format ReceiptData
            const convertedData: ReceiptData = {
              store_name: (analysis?.store_name as string) || 'Nieznany sklep',
              date: (analysis?.date as string) || new Date().toISOString().split('T')[0],
              total_amount: (analysis?.total_amount as number) || 0,
              items: (analysis?.items as Array<Record<string, unknown>>)?.map((item) => ({
                name: (item.name as string) || 'Nieznany produkt',
                quantity: (item.quantity as number) || 1,
                unit_price: (item.unit_price as number) || 0,
                total_price: (item.total_price as number) || 0,
                category: item.category as string,
                expiration_date: item.expiration_date as string,
                unit: (item.unit as string) || 'szt.'
              })) || []
            };
            setReceiptData(convertedData);
            setCurrentStep('editing');
            setProcessingProgress(100);
          } else if (status === 'failed') {
            const errorMsg = statusResponse.data.error || 'Błąd przetwarzania paragonu';
            setError(errorMsg);
            setCurrentStep('error');
            onError?.(errorMsg);
          } else if (status === 'processing') {
            setProcessingProgress(statusResponse.data.progress || 0);
          }
        } catch (err) {
          console.error('Błąd sprawdzania statusu:', err);
          const errorMsg = 'Błąd sprawdzania statusu przetwarzania';
          setError(errorMsg);
          setCurrentStep('error');
          onError?.(errorMsg);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [taskId, currentStep, onError]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setCurrentStep('processing');
    setProcessingProgress(0);
    setError(null);

    try {
      // Użyj asynchronicznego przetwarzania
      const response = await receiptAPI.processReceiptAsync(file);
      setTaskId(response.data.task_id);
    } catch (err) {
      console.error('Błąd uruchomienia przetwarzania:', err);
      const errorMsg = 'Błąd uruchomienia przetwarzania paragonu';
      setError(errorMsg);
      setCurrentStep('error');
      onError?.(errorMsg);
    }
  };

  const handleSave = async (data: ReceiptData) => {
    setCurrentStep('saving');
    setError(null);

    try {
      // Przygotuj dane do zapisu
      const saveData = {
        items: data.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.unit_price,
          category: item.category
        })),
        total: data.total_amount,
        store: data.store_name,
        date: data.date,
        receipt_id: Date.now().toString()
      };

      await receiptAPI.saveReceiptData(saveData);
      setCurrentStep('complete');
      onComplete?.(data);
    } catch (err) {
      console.error('Błąd zapisywania:', err);
      const errorMsg = 'Błąd zapisywania danych do bazy';
      setError(errorMsg);
      setCurrentStep('error');
      onError?.(errorMsg);
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
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Receipt className="w-4 h-4" />
              <span>Prześlij paragon do przetworzenia</span>
            </div>
            <FileUpload
              onFileSelect={handleFileSelect}
              onCancel={handleCancel}
              acceptedTypes={["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"]}
              maxSize={10}
            />
          </div>
        );

      case 'processing':
        return (
          <Card className="border border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
              <h4 className="text-sm font-semibold mb-2">Przetwarzanie paragonu...</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Postęp</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="w-full h-2" />
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div className="flex items-center justify-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>Rozpoznawanie tekstu (OCR)</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Edit className="w-3 h-3" />
                  <span>Analiza strukturalna</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Kategoryzacja produktów</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'editing':
        return receiptData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Edit className="w-4 h-4" />
                <span>Sprawdź i edytuj dane paragonu</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ReceiptDataTable
              data={receiptData}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={false}
            />
          </div>
        ) : null;

      case 'saving':
        return (
          <Card className="border border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-500" />
              <h4 className="text-sm font-semibold mb-2">Zapisywanie danych...</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Zapisuję dane paragonu do bazy danych
              </p>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card className="border border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <h4 className="text-sm font-semibold mb-2 text-green-600">Sukces!</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Paragon został pomyślnie przetworzony i zapisany
              </p>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card className="border border-red-200 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
              <h4 className="text-sm font-semibold mb-2 text-red-600">Błąd</h4>
              <p className="text-xs text-red-600 mb-3">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Spróbuj ponownie
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
    <div className="w-full max-w-2xl">
      {renderStepContent()}
    </div>
  );
} 