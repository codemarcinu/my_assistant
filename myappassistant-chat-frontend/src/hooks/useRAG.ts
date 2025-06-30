import { useState, useCallback, useRef } from 'react';
import { ragAPI } from '@/lib/api';

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface RAGSearchResult {
  documents: RAGDocument[];
  query: string;
  totalResults: number;
  searchTime: number;
  confidence: number;
}

export interface RAGProgress {
  stage: 'idle' | 'searching' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export function useRAG() {
  const [searchResults, setSearchResults] = useState<RAGSearchResult | null>(null);
  const [progress, setProgress] = useState<RAGProgress>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const searchDocuments = useCallback(async (
    query: string,
    options: {
      topK?: number;
      threshold?: number;
      includeMetadata?: boolean;
    } = {}
  ) => {
    const { topK = 5 } = options;

    if (!query.trim()) {
      setSearchResults(null);
      return null;
    }

    setIsSearching(true);
    setError(null);
    setProgress({
      stage: 'searching',
      progress: 0,
      message: '🔍 Wyszukiwanie kontekstu...',
    });

    try {
      // Simulate progress updates
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 100);

      const response = await ragAPI.searchDocuments(query, topK);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setProgress({
        stage: 'processing',
        progress: 95,
        message: '📄 Przetwarzanie wyników...',
      });

      // Process and format results
      const documents: RAGDocument[] = (response.data || []).map((doc: any, index: number) => ({
        id: doc.id || `doc_${index}`,
        title: doc.title || doc.name || `Dokument ${index + 1}`,
        content: doc.content || doc.text || doc.description || '',
        source: doc.source || doc.url || 'unknown',
        similarity: doc.similarity || doc.score || 0,
        metadata: doc.metadata || {},
      }));

      const result: RAGSearchResult = {
        documents,
        query,
        totalResults: documents.length,
        searchTime: 0, // API doesn't return this
        confidence: 0, // API doesn't return this
      };

      setSearchResults(result);
      setProgress({
        stage: 'complete',
        progress: 100,
        message: `Znaleziono ${documents.length} dokumentów`,
      });

      return result;

    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Błąd wyszukiwania';
      setError(errorMessage);
      setProgress({
        stage: 'error',
        progress: 0,
        message: `❌ ${errorMessage}`,
      });
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchWithContext = useCallback(async (
    query: string,
    context: string = '',
    options: {
      topK?: number;
      threshold?: number;
      includeMetadata?: boolean;
    } = {}
  ) => {
    // Combine query with context for better search
    const enhancedQuery = context ? `${query} ${context}` : query;
    return await searchDocuments(enhancedQuery, options);
  }, [searchDocuments]);

  const getRelevantDocuments = useCallback(async (
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    options: {
      topK?: number;
      threshold?: number;
      includeMetadata?: boolean;
    } = {}
  ) => {
    // Extract key terms from user message and recent conversation
    const recentContext = conversationHistory
      .slice(-3) // Last 3 messages
      .map(msg => msg.content)
      .join(' ');

    return await searchWithContext(userMessage, recentContext, options);
  }, [searchWithContext]);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setProgress({
      stage: 'idle',
      progress: 0,
      message: '',
    });
    setError(null);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      stage: 'idle',
      progress: 0,
      message: '',
    });
  }, []);

  return {
    searchDocuments,
    searchWithContext,
    getRelevantDocuments,
    searchResults,
    progress,
    error,
    isSearching,
    clearResults,
    resetProgress,
  };
} 