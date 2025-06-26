import React, { useState, useEffect, useRef } from 'react';

// src/components/ChatBox.tsx
// Rozszerzony komponent okna czatu, który może wysyłać polecenia do nadrzędnego komponentu.
type ChatBoxProps = {
  onSendMessage: (message: string) => void;
  chatHistory: string[];
};

const ChatBox: React.FC<ChatBoxProps> = ({ onSendMessage, chatHistory }) => {
  const [msg, setMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scrolluje do najnowszej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const sendMsg = () => {
    if (!msg.trim()) return;
    onSendMessage(msg); // Wysyła wiadomość do funkcji nadrzędnej
    setMsg("");
  };

  // Obsługa naciśnięcia klawisza Enter
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMsg();
    }
  };

  return (
    <div className="bg-cosmic-primary-container-bg rounded-xl p-6 shadow-xl flex flex-col flex-1 border border-cosmic-neutral-3 dark:bg-cosmic-neutral-9 dark:text-cosmic-bg dark:border-cosmic-neutral-8 transition-colors duration-300 min-h-[300px]">
      <h2 className="text-xl font-bold mb-4 text-cosmic-accent dark:text-cosmic-ext-blue">Czat z FoodSave AI</h2>
      {/* Obszar historii czatu */}
      <div className="flex-1 overflow-y-auto mb-4 p-2 rounded-lg bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8 transition-colors duration-300 scrollbar-thin scrollbar-thumb-cosmic-neutral-5 scrollbar-track-cosmic-neutral-4">
        {chatHistory.length === 0 ? (
          <p className="text-cosmic-neutral-6 dark:text-cosmic-neutral-5 text-center mt-8">Rozpocznij rozmowę z FoodSave AI!</p>
        ) : (
          chatHistory.map((m, i) => (
            <div key={i} className={`mb-2 p-2 rounded-lg ${m.startsWith("Ty:") ? 'bg-cosmic-bright-green text-cosmic-neutral-0 self-end text-right ml-auto' : 'bg-cosmic-neutral-4 text-cosmic-text dark:bg-cosmic-neutral-6 dark:text-cosmic-neutral-0 self-start mr-auto'}`}>
              {m}
            </div>
          ))
        )}
        <div ref={messagesEndRef} /> {/* Pusty div do scrollowania */}
      </div>
      {/* Pole do wprowadzania wiadomości i przycisk Wyślij */}
      <div className="flex">
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-3 rounded-l-lg bg-cosmic-neutral-3 focus:outline-none focus:ring-2 focus:ring-cosmic-bright-green placeholder-cosmic-neutral-6 dark:bg-cosmic-neutral-8 dark:text-cosmic-bg dark:placeholder-cosmic-neutral-5 transition-colors duration-300"
          placeholder="💬 Wpisz wiadomość..."
        />
        <button
          onClick={sendMsg}
          className="bg-cosmic-bright-green hover:bg-cosmic-accent-green text-cosmic-neutral-0 p-3 rounded-r-lg font-semibold shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span className="text-xl">📨</span> <span>Wyślij</span>
        </button>
      </div>
    </div>
  );
};

export default ChatBox; 