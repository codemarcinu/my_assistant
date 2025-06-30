"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  ShoppingCart, 
  Store, 
  Calendar, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Copy
} from "lucide-react";
import { FileUpload } from "@/components/chat/FileUpload";
import { useTauriAPI } from "@/hooks/useTauriAPI";
import { toast } from "sonner";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

interface ReceiptAnalysis {
  store_name: string;
  total_amount: number;
  purchase_date: string;
  items: ReceiptItem[];
  vat_summary?: {
    rate: number;
    amount: number;
  };
}

interface OCRResult {
  text: string;
  message: string;
  metadata?: any;
}

export default function OCRPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { makeApiRequest } = useTauriAPI();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setOcrResult(null);
    setAnalysisResult(null);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    setOcrResult(null);
    setAnalysisResult(null);
  };

  const processReceipt = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Upload and process with OCR
      setProgress(20);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const ocrResponse = await fetch('http://localhost:8000/api/v2/receipts/process', {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json();
        throw new Error(errorData.detail?.message || 'OCR processing failed');
      }

      const ocrData = await ocrResponse.json();
      setOcrResult(ocrData.data);
      setProgress(60);

      // Step 2: Analyze the receipt data
      setProgress(80);
      const analysisResponse = await fetch('http://localhost:8000/api/v2/receipts/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `ocr_text=${encodeURIComponent(ocrData.data.ocr_text)}`,
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.detail?.message || 'Receipt analysis failed');
      }

      const analysisData = await analysisResponse.json();
      setAnalysisResult(analysisData.data.analysis);
      setProgress(100);

      toast.success('Paragon został pomyślnie przetworzony!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd';
      setError(errorMessage);
      toast.error(`Błąd przetwarzania: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Skopiowano do schowka');
    } catch (err) {
      toast.error('Nie udało się skopiować');
    }
  };

  const downloadResults = () => {
    if (!ocrResult || !analysisResult) return;

    const data = {
      ocr_text: ocrResult.text,
      analysis: analysisResult,
      processed_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Przetwarzanie Paragonów OCR</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Prześlij Paragon</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              onCancel={handleCancel}
              isUploading={isProcessing}
              progress={progress}
            />

            {selectedFile && !isProcessing && (
              <Button 
                onClick={processReceipt}
                className="w-full"
                size="lg"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                Przetwórz Paragon
              </Button>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-medium">Błąd</span>
                </div>
                <p className="text-red-600 mt-2">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Wyniki Analizy</span>
              </span>
              {ocrResult && analysisResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadResults}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Pobierz
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!ocrResult && !analysisResult ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Prześlij paragon, aby zobaczyć wyniki analizy</p>
              </div>
            ) : (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Podsumowanie</TabsTrigger>
                  <TabsTrigger value="items">Produkty</TabsTrigger>
                  <TabsTrigger value="ocr">Tekst OCR</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  {analysisResult && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Store className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Sklep:</span>
                          <span>{analysisResult.store_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Suma:</span>
                          <span>{analysisResult.total_amount.toFixed(2)} PLN</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">Data:</span>
                          <span>{analysisResult.purchase_date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">Produktów:</span>
                          <span>{analysisResult.items.length}</span>
                        </div>
                      </div>

                      {analysisResult.vat_summary && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="font-medium mb-2">Podsumowanie VAT</h4>
                          <div className="flex justify-between">
                            <span>Stawka {analysisResult.vat_summary.rate}%:</span>
                            <span>{analysisResult.vat_summary.amount.toFixed(2)} PLN</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="items" className="space-y-3">
                  {analysisResult?.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.category && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.price.toFixed(2)} PLN</p>
                        <p className="text-sm text-gray-500">Ilość: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="ocr" className="space-y-3">
                  {ocrResult && (
                    <>
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Wyodrębniony tekst</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(ocrResult.text)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Kopiuj
                        </Button>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {ocrResult.text}
                        </pre>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 