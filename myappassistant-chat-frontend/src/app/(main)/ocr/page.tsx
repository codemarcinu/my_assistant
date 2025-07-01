"use client";

import { ReceiptWizard } from "@/components/ocr/ReceiptWizard";

export default function OCRPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <h1 className="text-3xl font-bold">Przetwarzanie Paragonów OCR</h1>
      </div>
      
      <ReceiptWizard />
    </div>
  );
} 