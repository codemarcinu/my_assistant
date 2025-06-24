import React, { useState } from 'react';
import Layout from './components/Layout';
import WeatherCard from './components/WeatherCard';
import ChatBox from './components/ChatBox';
import PantryModule from './components/modules/PantryModule';
import ReceiptUploadModule from './components/modules/ReceiptUploadModule';
import PantryPage from './pages/PantryPage';
import ShoppingPage from './pages/ShoppingPage';
import SettingsPage from './pages/SettingsPage';

// src/App.tsx
// Główny komponent aplikacji, zarządzający widokami i interakcjami.
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<"pantry" | "receipt" | null>(null);

  // Funkcja symulująca odpowiedź AI i wywołująca moduły
  const handleUserMessage = (message: string) => {
    setChatHistory(prev => [...prev, `Ty: ${message}`]);

    let aiResponse = "";
    let moduleToActivate: "pantry" | "receipt" | null = null;

    const lowerCaseMsg = message.toLowerCase();

    if (lowerCaseMsg.includes("co mam do jedzenia") || lowerCaseMsg.includes("spiżarnia")) {
      aiResponse = "Sprawdzam Twoją spiżarnię...";
      moduleToActivate = "pantry";
    } else if (lowerCaseMsg.includes("nowy paragon") || lowerCaseMsg.includes("zakupy") || lowerCaseMsg.includes("ocr")) {
      aiResponse = "Przygotuj paragon do zeskanowania!";
      moduleToActivate = "receipt";
    } else if (lowerCaseMsg.includes("ustawienia")) {
      aiResponse = "Przenoszę Cię do ustawień asystenta.";
      setCurrentPage("Settings");
      moduleToActivate = null;
    } else if (lowerCaseMsg.includes("jak mogę ci pomóc") || lowerCaseMsg.includes("help") || lowerCaseMsg.includes("funkcje")) {
      aiResponse = "Jestem FoodSave AI, Twój asystent życia codziennego. Mogę pomóc Ci zarządzać spiżarnią, rejestrować zakupy, i wiele więcej! Spróbuj powiedzieć 'co mam do jedzenia' albo 'nowy paragon'.";
      moduleToActivate = null;
    }
    else {
      aiResponse = "AI: Hmm, rozumiem. Daj mi chwilę na przetworzenie tego.";
      moduleToActivate = null;
    }

    // Dodaj odpowiedź AI i ewentualnie aktywuj moduł po krótkim opóźnieniu
    setTimeout(() => {
      setChatHistory(prev => [...prev, `AI: ${aiResponse}`]);
      if (moduleToActivate) {
        setActiveModule(moduleToActivate);
      }
    }, 800);
  };

  // Funkcja do zamykania modułu
  const handleCloseModule = () => {
    setActiveModule(null);
  };

  // Funkcja do przejścia na stronę spiżarni z modułu szybkiego podglądu
  const handleGoToPantryPage = () => {
    setCurrentPage("Pantry");
    setActiveModule(null); // Zamknij moduł po przejściu na stronę
  };

  // Funkcja do renderowania odpowiedniego komponentu na podstawie currentPage
  const renderContent = () => {
    switch (currentPage) {
      case "Dashboard":
        return (
          <div className="flex flex-col h-full">
            <WeatherCard
              location="Warszawa"
              temp={23}
              condition="Clear"
              forecast="Prognoza: 26°C po południu, przyjemny wiatr."
            />
            {/* Kontekstowe moduły obok/nad ChatBoxem */}
            <div className="relative flex-1 mt-6">
              {activeModule === "pantry" && (
                <div className="absolute z-10 w-full md:w-3/4 lg:w-1/2 left-1/2 -translate-x-1/2 top-4 animate-fade-in">
                  <PantryModule onClose={handleCloseModule} onManagePantry={handleGoToPantryPage} />
                </div>
              )}
              {activeModule === "receipt" && (
                <div className="absolute z-10 w-full md:w-3/4 lg:w-1/2 left-1/2 -translate-x-1/2 top-4 animate-fade-in">
                  <ReceiptUploadModule onClose={handleCloseModule} onUploadSuccess={() => {
                    setChatHistory(prev => [...prev, "AI: Paragon pomyślnie przetworzony!"]);
                  }} />
                </div>
              )}
              <ChatBox onSendMessage={handleUserMessage} chatHistory={chatHistory} />
            </div>

            {/* Floating Action Button for Quick Actions */}
            <div className="fixed bottom-6 right-6 z-20">
              <button
                onClick={() => {
                  // Możesz tutaj otworzyć modal z akcjami, lub bezpośrednio zmienić stronę
                  // Dla prostoty, na razie przejdziemy na stronę zakupów
                  setCurrentPage("Shopping");
                  setChatHistory(prev => [...prev, "AI: Przenoszę Cię do strony zarządzania zakupami."]);
                }}
                className="bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0 rounded-full p-4 shadow-lg text-2xl animate-bounce-in transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cosmic-bright-green focus:ring-opacity-75"
                title="Szybkie Akcje"
              >
                +
              </button>
            </div>
          </div>
        );
      case "Pantry":
        return <PantryPage />;
      case "Shopping":
        return <ShoppingPage />;
      case "Settings":
        return <SettingsPage />;
      default:
        return <div className="p-4 text-cosmic-neutral-8 dark:text-cosmic-neutral-3">Wybierz opcję z nawigacji.</div>;
    }
  };

  return (
    <Layout setCurrentPage={setCurrentPage} currentPage={currentPage}>
      {renderContent()}
    </Layout>
  );
};

export default App;
