"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
  Camera,
  RotateCw,
  Crop,
  Eye,
  Edit,
  Save,
  X,
  RefreshCw,
  AlertTriangle,
  Info,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Clock,
  Zap,
  Shield,
  Lightbulb
} from "lucide-react";
import { useTauriAPI } from "@/hooks/useTauriAPI";
import { toast } from "sonner";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
  confidence?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  selected?: boolean;
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

interface ImageQualityResult {
  sharpness_score: number;
  contrast_score: number;
  brightness_score: number;
  overall_quality: number;
  recommendations: string[];
}

interface ReceiptContourResult {
  detected: boolean;
  confidence: number;
  corners?: Array<[number, number]>;
  bounding_box?: [number, number, number, number];
  angle?: number;
}

type WizardStep = 'upload' | 'preview' | 'processing' | 'editing' | 'complete' | 'error';

export function ReceiptWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageQuality, setImageQuality] = useState<ImageQualityResult | null>(null);
  const [editableItems, setEditableItems] = useState<ReceiptItem[]>([]);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [contourResult, setContourResult] = useState<ReceiptContourResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [processingMessages, setProcessingMessages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { makeApiRequest } = useTauriAPI();

  // Obsługa wyboru pliku z natychmiastowym podglądem i analizą
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setOcrResult(null);
    setAnalysisResult(null);
    setWarnings([]);
    setProcessingMessages([]);
    
    // Utwórz podgląd
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Natychmiastowa analiza jakości obrazu
    await analyzeImageQuality(file);
    
    // Wykryj kontur paragonu
    await detectReceiptContour(file);
    
    setCurrentStep('preview');
  }, []);

  // Analiza jakości obrazu po stronie klienta
  const analyzeImageQuality = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const qualityResult = await makeApiRequest(
        'analyze_image_quality',
        'POST',
        JSON.stringify({ image_data: base64 })
      );
      
      const quality = JSON.parse(qualityResult);
      setImageQuality(quality);
      
      // Dodaj ostrzeżenia na podstawie jakości
      const newWarnings: string[] = [];
      if (quality.overall_quality < 0.6) {
        newWarnings.push("Jakość obrazu jest niska. Może to wpłynąć na dokładność OCR.");
      }
      if (quality.recommendations.length > 0) {
        newWarnings.push(...quality.recommendations);
      }
      setWarnings(newWarnings);
      
    } catch (err) {
      console.error('Błąd analizy jakości obrazu:', err);
    }
  };

  // Wykrywanie konturu paragonu
  const detectReceiptContour = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const contourResult = await makeApiRequest(
        'detect_receipt_contour',
        'POST',
        JSON.stringify({ image_data: base64 })
      );
      
      const contour = JSON.parse(contourResult);
      setContourResult(contour);
      
      if (!contour.detected) {
        setWarnings(prev => [...prev, "Nie wykryto wyraźnego konturu paragonu. Sprawdź czy obraz jest prosty."]);
      }
      
    } catch (err) {
      console.error('Błąd wykrywania konturu:', err);
    }
  };

  // Konwersja pliku do base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Kompresja obrazu przed wysłaniem
  const compressImage = async (file: File): Promise<File> => {
    try {
      const base64 = await fileToBase64(file);
      const compressedResult = await makeApiRequest(
        'compress_image',
        'POST',
        JSON.stringify({
          image_data: base64,
          options: {
            max_width: 1920,
            max_height: 1080,
            quality: 85,
            format: "jpeg"
          }
        })
      );
      
      const compressed = JSON.parse(compressedResult);
      const compressedBlob = await fetch(`data:image/jpeg;base64,${compressed.data}`).then(r => r.blob());
      return new File([compressedBlob], file.name, { type: 'image/jpeg' });
      
    } catch (err) {
      console.error('Błąd kompresji obrazu:', err);
      return file; // Fallback do oryginalnego pliku
    }
  };

  // Obsługa kamery
  const handleCameraCapture = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Tutaj można dodać logikę przechwytywania obrazu z kamery
        toast.info("Funkcja kamery będzie dostępna wkrótce");
      }
    } catch (err) {
      toast.error("Nie można uzyskać dostępu do kamery");
    }
  }, []);

  // Rotacja obrazu
  const handleRotateImage = useCallback(() => {
    if (previewUrl) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.height;
        canvas.height = img.width;
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, 0, -img.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], selectedFile?.name || 'rotated.jpg', { type: 'image/jpeg' });
            handleFileSelect(file);
          }
        }, 'image/jpeg');
      };
      img.src = previewUrl;
    }
  }, [previewUrl, selectedFile, handleFileSelect]);

  // Przetwarzanie paragonu z ulepszonym workflow i komunikatem "Poczekaj chwilę"
  const processReceipt = async () => {
    if (!selectedFile) return;

    // Utwórz AbortController dla możliwości anulowania
    const controller = new AbortController();
    setAbortController(controller);

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setCurrentStep('processing');
    setProcessingMessages([]);

    // DODAJ: Przyjazny komunikat dla użytkownika - KRYTYCZNY BRAK z raportu
    toast.info("🔍 Poczekaj chwilę, przeanalizuję dla Ciebie dane z paragonu...", {
      duration: 5000,
      style: {
        background: '#3B82F6',
        color: 'white',
      }
    });

    try {
      // Step 1: Kompresja obrazu
      setProgress(10);
      setProcessingMessages(prev => [...prev, "📸 Kompresuję obraz dla lepszej wydajności..."]);
      const compressedFile = await compressImage(selectedFile);
      
      // Dodatkowe komunikaty podczas procesu
      setTimeout(() => {
        setProcessingMessages(prev => [...prev, "📸 Rozpoznaję tekst z obrazu..."]);
        toast.info("📸 Rozpoznaję tekst z obrazu...");
      }, 2000);
      
      setTimeout(() => {
        setProcessingMessages(prev => [...prev, "🏪 Identyfikuję sklep i produkty..."]);
        toast.info("🏪 Identyfikuję sklep i produkty...");
      }, 5000);

      // Step 2: Upload and process with OCR
      setProgress(30);
      const formData = new FormData();
      formData.append('file', compressedFile);

      const ocrResponse = await fetch('http://localhost:8001/api/v3/receipts/process', {
        method: 'POST',
        body: formData,
        signal: controller.signal, // Dodaj abort signal
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json();
        throw new Error(errorData.detail?.message || 'OCR processing failed');
      }

      const ocrData = await ocrResponse.json();
      setOcrResult(ocrData.data);
      setProgress(60);

      // Step 3: Poll for results
      const jobId = ocrData.data.job_id;
      await pollForResults(jobId, controller);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        toast.info("Anulowano przetwarzanie paragonu");
        setCurrentStep('preview');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd';
      setError(errorMessage);
      setCurrentStep('error');
      toast.error(`Błąd przetwarzania: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  // Anulowanie przetwarzania
  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setCurrentStep('preview');
      toast.info("Przetwarzanie zostało anulowane");
    }
  };

  // Polling wyników z lepszym feedback
  const pollForResults = async (jobId: string, controller: AbortController) => {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await fetch(`http://localhost:8001/api/v3/receipts/status/${jobId}`, {
          signal: controller.signal
        });
        const statusData = await statusResponse.json();
        
        if (statusData.data.status === 'SUCCESS') {
          setAnalysisResult(statusData.data.result.analysis);
          setEditableItems(statusData.data.result.analysis.items?.map((item: ReceiptItem) => ({
            ...item,
            selected: false
          })) || []);
          setProgress(100);
          setCurrentStep('editing');
          toast.success('Paragon został pomyślnie przetworzony!');
          return;
        } else if (statusData.data.status === 'FAILURE') {
          throw new Error(statusData.data.error || 'Processing failed');
        } else {
          setProgress(60 + (attempts / maxAttempts) * 30);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }
        throw err;
      }
      attempts++;
    }
    
    throw new Error('Processing timeout');
  };

  // Edycja pozycji z inline editing
  const handleEditItem = (index: number) => {
    setEditingItem(index);
  };

  const handleSaveItem = (index: number, updatedItem: ReceiptItem) => {
    const newItems = [...editableItems];
    newItems[index] = updatedItem;
    setEditableItems(newItems);
    setEditingItem(null);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = editableItems.filter((_, i) => i !== index);
    setEditableItems(newItems);
  };

  // Bulk operations dla tabeli
  const handleSelectAll = () => {
    const allSelected = editableItems.every(item => item.selected);
    setEditableItems(editableItems.map(item => ({ ...item, selected: !allSelected })));
  };

  const handleDeleteSelected = () => {
    const newItems = editableItems.filter(item => !item.selected);
    setEditableItems(newItems);
    toast.success(`Usunięto ${editableItems.length - newItems.length} produktów`);
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      name: '',
      quantity: 1,
      price: 0,
      category: '',
      selected: false
    };
    setEditableItems([...editableItems, newItem]);
    setEditingItem(editableItems.length);
  };

  // Filtrowanie produktów
  const filteredItems = editableItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Zapisanie wyników
  const handleSaveResults = async () => {
    try {
      const finalData = {
        ...analysisResult,
        items: editableItems.filter(item => item.name.trim() !== ''),
        processed_at: new Date().toISOString(),
        image_quality: imageQuality
      };

      // Tutaj można dodać zapis do bazy danych
      toast.success('Wyniki zostały zapisane!');
      setCurrentStep('complete');
    } catch (err) {
      toast.error('Błąd podczas zapisywania wyników');
    }
  };

  // Reset wizarda
  const handleReset = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setAnalysisResult(null);
    setError(null);
    setProgress(0);
    setImageQuality(null);
    setEditableItems([]);
    setEditingItem(null);
    setContourResult(null);
    setWarnings([]);
    setProcessingMessages([]);
    setSearchTerm('');
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  // Funkcja do przyjaznych komunikatów błędów
  const getUserFriendlyError = (error: string | null): string => {
    if (!error) return "Wystąpił nieznany błąd";
    
    const errorMap: Record<string, string> = {
      'OCR processing failed': 'Nie udało się rozpoznać tekstu z obrazu. Sprawdź czy paragon jest czytelny.',
      'Processing timeout': 'Przetwarzanie trwało zbyt długo. Spróbuj ponownie z lepszym obrazem.',
      'Network error': 'Problem z połączeniem. Sprawdź połączenie z internetem.',
      'Invalid file format': 'Nieobsługiwany format pliku. Użyj JPG, PNG lub PDF.',
      'File too large': 'Plik jest zbyt duży. Skompresuj obraz przed przesłaniem.'
    };

    for (const [key, message] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return message;
      }
    }

    return error;
  };

  // Renderowanie kroków
  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Dodaj Paragon</h2>
              <p className="text-gray-600">Prześlij zdjęcie paragonu lub użyj kamery</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="h-32 flex flex-col items-center justify-center space-y-2"
                variant="outline"
              >
                <Upload className="w-8 h-8" />
                <span>Wybierz plik</span>
              </Button>
              
              <Button 
                onClick={handleCameraCapture}
                className="h-32 flex flex-col items-center justify-center space-y-2"
                variant="outline"
              >
                <Camera className="w-8 h-8" />
                <span>Użyj kamery</span>
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">📋 Sprawdź Paragon Przed Analizą</h2>
              <p className="text-gray-600">Upewnij się, że tekst jest czytelny i paragon jest dobrze widoczny</p>
            </div>
            
            {/* Wskazówki dla najlepszych rezultatów */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">💡 Wskazówki dla najlepszych rezultatów:</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Upewnij się, że cały paragon jest widoczny</li>
                      <li>Sprawdź czy tekst jest ostry i czytelny</li>
                      <li>Usuń odblaski i cienie</li>
                      <li>Ustaw paragon prosto względem krawędzi obrazu</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Ostrzeżenia i rekomendacje */}
            {warnings.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        {warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {previewUrl && (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Podgląd paragonu" 
                    className="w-full max-h-96 object-contain border rounded-lg"
                  />
                  
                  {/* Kontur paragonu */}
                  {contourResult?.detected && contourResult.corners && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <polygon
                        points={contourResult.corners.map(([x, y]) => `${x},${y}`).join(' ')}
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.8)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    </svg>
                  )}
                  
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <Button size="sm" variant="secondary" onClick={handleRotateImage}>
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Crop className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Analiza jakości obrazu */}
                {imageQuality && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Analiza Jakości Obrazu</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Ogólna jakość</Label>
                          <div className="flex items-center space-x-2">
                            <Progress value={imageQuality.overall_quality * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round(imageQuality.overall_quality * 100)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Ostrość</Label>
                          <div className="flex items-center space-x-2">
                            <Progress value={imageQuality.sharpness_score * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round(imageQuality.sharpness_score * 100)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Kontrast</Label>
                          <div className="flex items-center space-x-2">
                            <Progress value={imageQuality.contrast_score * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round(imageQuality.contrast_score * 100)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Jasność</Label>
                          <div className="flex items-center space-x-2">
                            <Progress value={imageQuality.brightness_score * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round(imageQuality.brightness_score * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={handleReset}>
                    <X className="w-4 h-4 mr-2" />
                    Anuluj
                  </Button>
                  <Button onClick={processReceipt} disabled={warnings.length > 2}>
                    <FileText className="w-4 h-4 mr-2" />
                    Przetwórz Paragon
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6 text-center">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-blue-500" />
            <h2 className="text-2xl font-bold">Przetwarzanie Paragonu</h2>
            <p className="text-gray-600">Analizuję tekst i wyciągam dane produktów</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Postęp</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
              
              {/* Komunikaty o statusie przetwarzania */}
              {processingMessages.length > 0 && (
                <div className="space-y-2 text-sm text-gray-600">
                  {processingMessages.map((message, index) => (
                    <div key={index} className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{message}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-2 text-xs text-gray-500">
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
              
              {/* Przycisk anulowania */}
              <Button variant="outline" onClick={handleCancel} className="mt-4">
                <X className="w-4 h-4 mr-2" />
                Anuluj przetwarzanie
              </Button>
            </div>
          </div>
        );

      case 'editing':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">🛒 Produkty z Paragonu</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showBoundingBoxes ? 'Ukryj' : 'Pokaż'} Bounding Boxes
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nowy paragon
                </Button>
                <Button onClick={handleSaveResults}>
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz
                </Button>
              </div>
            </div>
            
            {analysisResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Store className="w-5 h-5" />
                      <span>Informacje o sklepie</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nazwa sklepu</Label>
                      <Input value={analysisResult.store_name} readOnly />
                    </div>
                    <div>
                      <Label>Data zakupów</Label>
                      <Input value={analysisResult.purchase_date} readOnly />
                    </div>
                    <div>
                      <Label>Suma do zapłaty</Label>
                      <Input value={`${analysisResult.total_amount.toFixed(2)} zł`} readOnly />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>Produkty ({editableItems.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Bulk operations */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={editableItems.length > 0 && editableItems.every(item => item.selected)}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm">Zaznacz wszystkie</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleDeleteSelected}
                          disabled={!editableItems.some(item => item.selected)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Usuń zaznaczone
                        </Button>
                        <Button size="sm" onClick={handleAddItem}>
                          <Plus className="w-3 h-3 mr-1" />
                          Dodaj produkt
                        </Button>
                      </div>
                    </div>
                    
                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Szukaj produktów..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={item.selected}
                              onCheckedChange={(checked) => {
                                const newItems = [...editableItems];
                                newItems[index] = { ...item, selected: checked as boolean };
                                setEditableItems(newItems);
                              }}
                            />
                            <div className="flex-1">
                              {editingItem === index ? (
                                <div className="space-y-2">
                                  <Input
                                    value={item.name}
                                    onChange={(e) => {
                                      const newItems = [...editableItems];
                                      newItems[index] = { ...item, name: e.target.value };
                                      setEditableItems(newItems);
                                    }}
                                  />
                                  <div className="flex space-x-2">
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const newItems = [...editableItems];
                                        newItems[index] = { ...item, quantity: parseFloat(e.target.value) || 0 };
                                        setEditableItems(newItems);
                                      }}
                                      className="w-20"
                                    />
                                    <Input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => {
                                        const newItems = [...editableItems];
                                        newItems[index] = { ...item, price: parseFloat(e.target.value) || 0 };
                                        setEditableItems(newItems);
                                      }}
                                      className="w-24"
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button size="sm" onClick={() => handleSaveItem(index, item)}>
                                      <Save className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {item.quantity} x {item.price.toFixed(2)} zł
                                    </div>
                                    {item.category && (
                                      <Badge variant="secondary" className="text-xs">
                                        {item.category}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEditItem(index)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleDeleteItem(index)}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">Paragon Przetworzony!</h2>
            <p className="text-gray-600">Wszystkie dane zostały zapisane pomyślnie</p>
            
            <div className="flex justify-center space-x-4">
              <Button onClick={handleReset}>
                <Upload className="w-4 h-4 mr-2" />
                Dodaj kolejny paragon
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
            <h2 className="text-2xl font-bold">😕 Ups! Wystąpił problem</h2>
            <p className="text-gray-600">{getUserFriendlyError(error)}</p>
            
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                🔄 Spróbuj ponownie
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <Upload className="w-4 h-4 mr-2" />
                📋 Wybierz inny paragon
              </Button>
            </div>
            
            {/* Debug info for developers */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Szczegóły techniczne
              </summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-left">
                {error}
              </div>
            </details>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
} 