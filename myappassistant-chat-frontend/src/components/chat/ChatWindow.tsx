"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Send,
  AttachFile,
  SmartToy,
  Person,
} from '@mui/icons-material';
import { useChatStore, Message } from '@/stores/chatStore';
import { chatAPI } from '@/lib/api';
import { useFontSize } from '../providers';
import { TypewriterText } from './TypewriterText';
import { ChatReceiptProcessor } from './ChatReceiptProcessor';

export function ChatWindow() {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReceiptProcessor, setShowReceiptProcessor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { messages, addMessage, setTyping, updateMessage } = useChatStore();
  const { fontSize } = useFontSize();
  let fontSizeValue = '1rem';
  if (fontSize === 'small') fontSizeValue = '0.9rem';
  if (fontSize === 'large') fontSizeValue = '1.2rem';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputValue('');
    setIsTyping(true);

    // Dodaj tymczasową wiadomość asystenta
    const tempAssistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
    };

    addMessage(tempAssistantMessage);

    try {
      const response = await chatAPI.sendMessage({
        message: inputValue,
        session_id: 'default',
        usePerplexity: false,
        useBielik: true,
        agent_states: {},
      });

      // Zaktualizuj wiadomość asystenta
      updateMessage(tempAssistantMessage.id, {
        content: response.data.data?.reply || 'Przepraszam, nie udało się przetworzyć Twojego zapytania.',
        isStreaming: false,
        agentType: response.data.data?.agent_type,
      });
    } catch (error) {
      console.error('Błąd wysyłania wiadomości:', error);
      updateMessage(tempAssistantMessage.id, {
        content: 'Przepraszam, wystąpił błąd podczas przetwarzania Twojego zapytania. Spróbuj ponownie.',
        isStreaming: false,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Sprawdź czy to paragon (obrazek lub PDF)
      const file = files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setShowReceiptProcessor(true);
        // Dodaj wiadomość o rozpoczęciu przetwarzania paragonu
        addMessage({
          id: Date.now().toString(),
          content: `📄 Rozpoczynam przetwarzanie paragonu: ${file.name}`,
          role: 'assistant',
          timestamp: new Date(),
        });
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
  };

  const handleReceiptComplete = (receiptData: any) => {
    setShowReceiptProcessor(false);
    
    // Dodaj wiadomość o pomyślnym przetworzeniu
    addMessage({
      id: Date.now().toString(),
      content: `✅ Paragon został pomyślnie przetworzony i zapisany!\n\n🏪 **Sklep:** ${receiptData.store_name}\n📅 **Data:** ${receiptData.date}\n💰 **Suma:** ${receiptData.total_amount.toFixed(2)} zł\n📦 **Produktów:** ${receiptData.items.length}`,
      role: 'assistant',
      timestamp: new Date(),
    });
  };

  const handleReceiptCancel = () => {
    setShowReceiptProcessor(false);
    
    // Dodaj wiadomość o anulowaniu
    addMessage({
      id: Date.now().toString(),
      content: '❌ Przetwarzanie paragonu zostało anulowane.',
      role: 'assistant',
      timestamp: new Date(),
    });
  };

  const handleReceiptError = (error: string) => {
    setShowReceiptProcessor(false);
    
    // Dodaj wiadomość o błędzie
    addMessage({
      id: Date.now().toString(),
      content: `❌ Błąd przetwarzania paragonu: ${error}`,
      role: 'assistant',
      timestamp: new Date(),
    });
  };

  return (
    <Box 
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', fontSize: fontSizeValue }}
      data-testid="chat-window"
    >
      {/* Obszar wiadomości */}
      <Box
        data-testid="messages-area"
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box
            data-testid="welcome-message"
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
              data-testid={`message-${message.role}-${message.id}`}
              sx={{
                display: 'flex',
                gap: 2,
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
              
              <Paper
                data-testid={`message-content-${message.id}`}
                sx={{
                  p: 2,
                  maxWidth: '70%',
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
                
                {message.agentType && (
                  <Chip
                    data-testid={`agent-type-${message.id}`}
                    label={message.agentType}
                    size="small"
                    sx={{
                      mt: 1,
                      background: 'rgba(52, 199, 89, 0.2)',
                      color: '#34C759',
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Paper>

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

        {/* Procesor paragonów */}
        {showReceiptProcessor && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-start',
            }}
          >
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
                p: 2,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxWidth: '80%',
              }}
            >
              <ChatReceiptProcessor
                onComplete={handleReceiptComplete}
                onCancel={handleReceiptCancel}
                onError={handleReceiptError}
              />
            </Paper>
          </Box>
        )}
        
        {isTyping && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
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
                p: 2,
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
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Obszar wprowadzania */}
      <Box
        data-testid="input-area"
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(28, 28, 30, 0.5)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            data-testid="message-input"
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Napisz wiadomość..."
            variant="outlined"
            size="small"
            disabled={isTyping || showReceiptProcessor}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused': {
                  border: '1px solid #007AFF',
                },
              },
            }}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            data-testid="file-input"
          />
          
          <IconButton
            data-testid="attach-file-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping || showReceiptProcessor}
            sx={{
              color: 'text.primary',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <AttachFile />
          </IconButton>
          
          <IconButton
            data-testid="send-message-button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || showReceiptProcessor}
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
  );
} 