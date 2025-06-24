import React, { useState } from 'react';

// src/modules/ReceiptUploadModule.tsx
type ReceiptUploadModuleProps = {
  onClose: () => void;
  onUploadSuccess: () => void;
};

// Moduł do przesyłania paragonów.
const ReceiptUploadModule: React.FC<ReceiptUploadModuleProps> = ({ onClose, onUploadSuccess }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileName(event.target.files[0].name);
    } else {
      setFileName(null);
    }
  };

  const handleAnalyze = () => {
    if (fileName) {
      // alert(`Analizowanie paragonu: ${fileName}... (symulacja)`); // Zastąp alertem z UI
      onUploadSuccess();
      onClose();
    } else {
      // alert("Proszę wybrać plik paragonu."); // Zastąp alertem z UI
    }
  };

  return (
    <div className="bg-cosmic-neutral-3 rounded-xl p-5 shadow-lg border border-cosmic-neutral-4 dark:bg-cosmic-neutral-8 dark:text-cosmic-bg dark:border-cosmic-neutral-6 transition-all duration-300 relative">
      <button onClick={onClose} className="absolute top-2 right-2 text-cosmic-neutral-6 hover:text-cosmic-text dark:text-cosmic-neutral-5 dark:hover:text-cosmic-bg text-2xl">&times;</button>
      <h3 className="text-xl font-bold mb-3 text-cosmic-accent dark:text-cosmic-ext-blue">Wgraj Paragon (OCR)</h3>
      <p className="text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-4">Prześlij zdjęcie paragonu, a FoodSave AI wyodrębni z niego dane o zakupach.</p>
      <div className="mt-4 p-6 border-2 border-dashed border-cosmic-neutral-5 rounded-lg text-center dark:border-cosmic-neutral-6">
        <p className="text-cosmic-neutral-6 dark:text-cosmic-neutral-5 mb-2">Przeciągnij i upuść plik lub</p>
        <input type="file" className="hidden" id="receipt-upload-module" onChange={handleFileChange} accept="image/*,.pdf" />
        <label htmlFor="receipt-upload-module" className="cursor-pointer bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0 p-3 rounded-lg font-semibold shadow-md transition-all duration-200">
          {fileName ? `Wybrano: ${fileName}` : 'Wybierz plik'}
        </label>
        {fileName && <p className="text-cosmic-neutral-6 dark:text-cosmic-neutral-5 mt-2 text-sm">{fileName}</p>}
      </div>
      <button
        onClick={handleAnalyze}
        disabled={!fileName}
        className={`mt-5 p-3 rounded-lg font-semibold shadow-md transition-all duration-200 ${!fileName ? 'bg-cosmic-neutral-5 cursor-not-allowed text-cosmic-neutral-7' : 'bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0'}`}
      >
        Analizuj Paragon
      </button>
    </div>
  );
};

export default ReceiptUploadModule; 