"use client";

import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  SmartToy,
  Person,
  Send,
  AttachFile,
  ClearAll,
} from '@mui/icons-material';
import { useChatStore } from '@/stores/chatStore';
import { TypewriterText } from '../chat/TypewriterText';
import { QuickCommands } from './QuickCommands';
import { ErrorBanner } from '../chat/ErrorBanner';
import { RAGProgressIndicator } from '../chat/RAGProgressIndicator';
import { AgentMetadata } from '../chat/AgentMetadata';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useRAG } from '@/hooks/useRAG';
import { chatAPI } from '@/lib/api';
import { receiptAPI } from '@/lib/api';

export function Dashboard() {
  const theme = useTheme();
  const { messages, addMessage, clearMessages, updateMessage } = useChatStore();
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [showReceiptProcessor, setShowReceiptProcessor] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebSocket for real-time dashboard updates
  const { isConnected: wsConnected, agents: wsAgents, systemMetrics } = useWebSocket();
  
  // RAG integration
  const { 
    getRelevantDocuments, 
    searchResults, 
    progress: ragProgress, 
    error: ragError,
    clearResults: clearRAGResults 
  } = useRAG();

  // Automatyczne scrollowanie do najnowszej wiadomości
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user' as const,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    // Dodaj tymczasową wiadomość asystenta
    const tempAssistantMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant' as const,
      timestamp: new Date(),
      isStreaming: true,
    };

    addMessage(tempAssistantMessage);

    try {
      // Automatyczne wyszukiwanie RAG przed wysłaniem do API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      const ragResults = await getRelevantDocuments(inputValue, conversationHistory);
      
      // Wyślij wiadomość do prawdziwego API z kontekstem RAG
      const response = await chatAPI.sendMessage({
        message: inputValue,
        session_id: 'default',
        usePerplexity: false,
        useBielik: true,
        agent_states: {},
        context_docs: ragResults?.documents || [], // Dodaj dokumenty RAG jako kontekst
      });

      // Przygotuj źródła dla metadanych
      const sources = ragResults?.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        similarity: doc.similarity,
      })) || [];

      // Zaktualizuj wiadomość asystenta z metadanymi
      updateMessage(tempAssistantMessage.id, {
        content: response.data.text || response.data.data?.reply || 'Przepraszam, nie udało się przetworzyć Twojego zapytania.',
        isStreaming: false,
        agentType: response.data.data?.agent_type,
        responseTime: response.data.data?.response_time,
        confidence: response.data.data?.rag_confidence,
        usedRAG: response.data.data?.used_rag || (ragResults?.documents?.length || 0) > 0,
        usedInternet: response.data.data?.used_internet,
        sources,
      });
    } catch (error) {
      console.error('Błąd wysyłania wiadomości:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      setError(`Błąd komunikacji z serwerem: ${errorMessage}`);
      updateMessage(tempAssistantMessage.id, {
        content: 'Przepraszam, wystąpił błąd podczas przetwarzania Twojego zapytania. Spróbuj ponownie.',
        isStreaming: false,
      });
    } finally {
      setIsTyping(false);
      // Wyczyść wyniki RAG po zakończeniu
      setTimeout(() => clearRAGResults(), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Sprawdź czy to paragon (obrazek lub PDF)
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        // Dodaj wiadomość o rozpoczęciu przetwarzania paragonu
        addMessage({
          id: Date.now().toString(),
          content: `📄 Rozpoczynam przetwarzanie paragonu: ${file.name}`,
          role: 'assistant',
          timestamp: new Date(),
          agentType: 'ocr',
        });

        try {
          // Przetwórz paragon
          const receiptResult = await receiptAPI.processReceipt(file);
          
          // Sprawdź czy odpowiedź ma poprawną strukturę
          if (receiptResult.data && receiptResult.data.analysis) {
            const analysis = receiptResult.data.analysis;
            
            // Dodaj wiadomość o pomyślnym przetworzeniu
            addMessage({
              id: (Date.now() + 1).toString(),
              content: `✅ Paragon został pomyślnie przetworzony!\n\n🏪 **Sklep:** ${analysis.store_name || 'Nieznany'}\n📅 **Data:** ${analysis.date || 'Nieznana'}\n💰 **Suma:** ${analysis.total_amount?.toFixed(2) || '0.00'} zł\n📦 **Produktów:** ${analysis.items?.length || 0}`,
              role: 'assistant',
              timestamp: new Date(),
              agentType: 'receipt_analysis',
              confidence: receiptResult.data.confidence,
            });

            // Dodaj pytanie "byłeś na zakupach?"
            setTimeout(() => {
              addMessage({
                id: (Date.now() + 2).toString(),
                content: 'Byłeś na zakupach? 🛒',
                role: 'assistant',
                timestamp: new Date(),
                agentType: 'default',
              });
            }, 1000);
          } else {
            // Fallback dla nieoczekiwanej struktury odpowiedzi
            addMessage({
              id: (Date.now() + 1).toString(),
              content: `✅ Paragon został przetworzony, ale struktura odpowiedzi jest nieoczekiwana.`,
              role: 'assistant',
              timestamp: new Date(),
              agentType: 'receipt_analysis',
            });
          }

        } catch (error) {
          console.error('Błąd przetwarzania paragonu:', error);
          const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
          setError(`Błąd przetwarzania paragonu: ${errorMessage}`);
          addMessage({
            id: (Date.now() + 1).toString(),
            content: `❌ Błąd przetwarzania paragonu: ${errorMessage}`,
            role: 'assistant',
            timestamp: new Date(),
            agentType: 'ocr',
          });
        }
      } else {
        // Inne typy plików - dodaj jako zwykłą wiadomość
        addMessage({
          id: Date.now().toString(),
          content: `📎 Załączono plik: ${file.name}`,
          role: 'user',
          timestamp: new Date(),
        });
      }
    }
    
    // Wyczyść input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setError(null);
    // Można dodać logikę ponowienia ostatniej operacji
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Error Banner */}
      <ErrorBanner
        error={error || ragError}
        onRetry={handleRetry}
        onDismiss={() => setError(null)}
        severity="error"
        title="Błąd komunikacji"
        showRetry={true}
        autoHide={false}
      />

      {/* Dashboard Grid Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 320px' },
          gap: 3,
          height: 'calc(100vh - 80px)',
          minHeight: 400,
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* Chat Container */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-surface)',
            borderRadius: 3,
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            border: '1px solid var(--color-card-border)',
            height: '100%',
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2.5,
              borderBottom: '1px solid var(--color-card-border-inner)',
              background: 'rgba(59, 130, 246, 0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, m: 0 }}>
                Czat z Asystentem
              </Typography>
              {/* WebSocket status indicator */}
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: wsConnected ? '#4CAF50' : '#f44336',
                  animation: wsConnected ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            </Box>
            <IconButton
              onClick={clearMessages}
              sx={{
                color: 'text.secondary',
                '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              <ClearAll />
            </IconButton>
          </Box>

          {/* Chat Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minHeight: 0,
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mb: 2,
                    background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
                  }}
                >
                  <SmartToy sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Witaj w FoodSave AI
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
                  Jestem Twoim centrum dowodzenia AI. Pytaj mnie o dokumenty, przepisy, 
                  pogodę lub ogólne pytania. Przekieruję Twoje zapytanie do najlepszego agenta.
                </Typography>
              </Box>
            ) : (
              messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {message.role === 'assistant' && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
                      }}
                    >
                      <SmartToy sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                  
                  <Box sx={{ maxWidth: '70%', display: 'flex', flexDirection: 'column' }}>
                    <Paper
                      sx={{
                        p: 1.5,
                        background: message.role === 'user' 
                          ? 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: message.role === 'user' 
                          ? 'none'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {message.role === 'assistant' ? (
                        <TypewriterText 
                          text={message.content} 
                          speed={30}
                          variant="body2"
                          color="text.primary"
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {message.content}
                        </Typography>
                      )}
                    </Paper>
                    
                    {/* Agent Metadata for assistant messages */}
                    {message.role === 'assistant' && (
                      <AgentMetadata
                        agentType={message.agentType}
                        responseTime={message.responseTime}
                        confidence={message.confidence}
                        sources={message.sources}
                        usedRAG={message.usedRAG}
                        usedInternet={message.usedInternet}
                        timestamp={message.timestamp.toISOString()}
                        compact={true}
                      />
                    )}
                  </Box>

                  {message.role === 'user' && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Person sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                </Box>
              ))
            )}
            
            {/* RAG Progress Indicator */}
            <RAGProgressIndicator progress={ragProgress} compact={true} />
            
            {isTyping && (
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-start' }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
                  }}
                >
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Piszę...
                  </Typography>
                </Paper>
              </Box>
            )}
            
            {/* Invisible div for auto-scroll */}
            <div ref={messagesEndRef} />
          </Box>

          {/* Chat Input */}
          <Box
            sx={{
              borderTop: '1px solid var(--color-card-border-inner)',
              background: 'var(--color-surface)',
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '50px',
                  p: 0.5,
                }}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Wpisz wiadomość..."
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'none',
                    padding: '12px 16px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                
                {/* Ukryty input file */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  sx={{
                    color: 'text.primary',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <AttachFile />
                </IconButton>
              </Box>
              
              <IconButton
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                sx={{
                  color: 'white',
                  background: 'linear-gradient(45deg, #007AFF 30%, #5856D6 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #0056CC 30%, #4A4AC4 90%)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'text.disabled',
                  },
                }}
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Quick Commands Panel */}
        <Box
          sx={{
            background: 'var(--color-surface)',
            borderRadius: 3,
            p: 2.5,
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-card-border)',
            height: 'fit-content',
            maxHeight: '100%',
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Szybkie Komendy
          </Typography>
          <QuickCommands />
        </Box>
      </Box>
    </Box>
  );
} 