import { renderHook, act, waitFor } from '@testing-library/react';
import { useRAG, RAGDocument, RAGSearchResult, RAGProgress } from '@/hooks/useRAG';
import { ragAPI } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  ragAPI: {
    searchDocuments: jest.fn(),
  },
}));

const mockRagAPI = ragAPI as jest.Mocked<typeof ragAPI>;

describe('useRAG', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useRAG());

      expect(result.current.searchResults).toBeNull();
      expect(result.current.progress).toEqual({
        stage: 'idle',
        progress: 0,
        message: '',
      });
      expect(result.current.error).toBeNull();
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('searchDocuments', () => {
    it('should return null for empty query', async () => {
      const { result } = renderHook(() => useRAG());

      const searchResult = await act(async () => {
        return await result.current.searchDocuments('');
      });

      expect(searchResult).toBeNull();
      expect(result.current.searchResults).toBeNull();
      expect(result.current.isSearching).toBe(false);
    });

    it('should return null for whitespace-only query', async () => {
      const { result } = renderHook(() => useRAG());

      const searchResult = await act(async () => {
        return await result.current.searchDocuments('   ');
      });

      expect(searchResult).toBeNull();
      expect(result.current.searchResults).toBeNull();
      expect(result.current.isSearching).toBe(false);
    });

    it('should perform successful search', async () => {
      const mockDocuments = [
        {
          id: 'doc1',
          title: 'Test Document 1',
          content: 'This is test content',
          source: 'test-source',
          similarity: 0.95,
          metadata: { category: 'test' },
        },
        {
          id: 'doc2',
          title: 'Test Document 2',
          content: 'Another test content',
          source: 'test-source-2',
          similarity: 0.87,
          metadata: { category: 'test' },
        },
      ];

      mockRagAPI.searchDocuments.mockResolvedValue({
        data: mockDocuments,
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      let searchResult: RAGSearchResult | null = null;

      await act(async () => {
        searchResult = await result.current.searchDocuments('test query');
      });

      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith('test query', 5);
      expect(searchResult).not.toBeNull();
      expect(searchResult?.documents).toHaveLength(2);
      expect(searchResult?.query).toBe('test query');
      expect(result.current.searchResults).toEqual(searchResult);
      expect(result.current.progress.stage).toBe('complete');
      expect(result.current.progress.progress).toBe(100);
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle custom topK parameter', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query', { topK: 10 });
      });

      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith('test query', 10);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockRagAPI.searchDocuments.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query');
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.progress.stage).toBe('error');
      expect(result.current.progress.message).toBe(`❌ ${errorMessage}`);
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      mockRagAPI.searchDocuments.mockRejectedValue('String error');

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query');
      });

      expect(result.current.error).toBe('Błąd wyszukiwania');
      expect(result.current.progress.stage).toBe('error');
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle documents with missing fields', async () => {
      const mockDocuments = [
        {
          // Missing id, title, content
          source: 'test-source',
          similarity: 0.95,
        },
        {
          id: 'doc2',
          // Missing title, content
          source: 'test-source-2',
          similarity: 0.87,
        },
      ];

      mockRagAPI.searchDocuments.mockResolvedValue({
        data: mockDocuments,
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query');
      });

      expect(result.current.searchResults?.documents).toHaveLength(2);
      expect(result.current.searchResults?.documents[0]).toEqual({
        id: 'doc_0',
        title: 'Dokument 1',
        content: '',
        source: 'test-source',
        similarity: 0.95,
        metadata: {},
      });
      expect(result.current.searchResults?.documents[1]).toEqual({
        id: 'doc2',
        title: 'Dokument 2',
        content: '',
        source: 'test-source-2',
        similarity: 0.87,
        metadata: {},
      });
    });
  });

  describe('searchWithContext', () => {
    it('should combine query with context', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchWithContext('test query', 'additional context');
      });

      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith('test query additional context', 5);
    });

    it('should handle empty context', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchWithContext('test query', '');
      });

      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith('test query', 5);
    });

    it('should pass options to searchDocuments', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchWithContext('test query', 'context', { topK: 15 });
      });

      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith('test query context', 15);
    });
  });

  describe('getRelevantDocuments', () => {
    it('should extract context from conversation history', async () => {
      const conversationHistory = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Second message' },
        { role: 'assistant', content: 'Second response' },
        { role: 'user', content: 'Third message' },
        { role: 'assistant', content: 'Third response' },
      ];

      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.getRelevantDocuments('current query', conversationHistory);
      });

      // Should use last 3 messages: Second response, Third message, Third response
      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith(
        'current query Second response Third message Third response',
        5
      );
    });

    it('should handle empty conversation history', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.getRelevantDocuments('current query', []);
      });

      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith('current query', 5);
    });

    it('should pass options to searchWithContext', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.getRelevantDocuments('current query', [], { topK: 20 });
      });

      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith('current query', 20);
    });
  });

  describe('clearResults', () => {
    it('should reset all state to initial values', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [{ id: 'doc1', title: 'Test', content: 'Content', source: 'test', similarity: 0.9 }],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query');
      });

      // Verify state is populated
      expect(result.current.searchResults).not.toBeNull();
      expect(result.current.progress.stage).toBe('complete');

      // Clear results
      act(() => {
        result.current.clearResults();
      });

      expect(result.current.searchResults).toBeNull();
      expect(result.current.progress).toEqual({
        stage: 'idle',
        progress: 0,
        message: '',
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('resetProgress', () => {
    it('should reset only progress state', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [{ id: 'doc1', title: 'Test', content: 'Content', source: 'test', similarity: 0.9 }],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query');
      });

      // Verify state is populated
      expect(result.current.searchResults).not.toBeNull();
      expect(result.current.progress.stage).toBe('complete');

      // Reset progress only
      act(() => {
        result.current.resetProgress();
      });

      expect(result.current.searchResults).not.toBeNull(); // Should remain
      expect(result.current.progress).toEqual({
        stage: 'idle',
        progress: 0,
        message: '',
      });
    });
  });

  describe('Document Processing', () => {
    it('should handle various document field mappings', async () => {
      const mockDocuments = [
        {
          id: 'doc1',
          name: 'Document with name field',
          text: 'Content in text field',
          url: 'https://example.com',
          score: 0.95,
        },
        {
          id: 'doc2',
          title: 'Document with title field',
          description: 'Content in description field',
          source: 'local-file',
          similarity: 0.87,
        },
      ];

      mockRagAPI.searchDocuments.mockResolvedValue({
        data: mockDocuments,
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query');
      });

      expect(result.current.searchResults?.documents[0]).toEqual({
        id: 'doc1',
        title: 'Document with name field',
        content: 'Content in text field',
        source: 'https://example.com',
        similarity: 0.95,
        metadata: {},
      });

      expect(result.current.searchResults?.documents[1]).toEqual({
        id: 'doc2',
        title: 'Document with title field',
        content: 'Content in description field',
        source: 'local-file',
        similarity: 0.87,
        metadata: {},
      });
    });

    it('should handle documents with only required fields', async () => {
      const mockDocuments = [
        {
          id: 'doc1',
          title: 'Test Document',
          content: 'Test Content',
          source: 'test-source',
          similarity: 0.9,
        },
      ];

      mockRagAPI.searchDocuments.mockResolvedValue({
        data: mockDocuments,
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query');
      });

      expect(result.current.searchResults?.documents[0]).toEqual({
        id: 'doc1',
        title: 'Test Document',
        content: 'Test Content',
        source: 'test-source',
        similarity: 0.9,
        metadata: {},
      });
    });
  });

  describe('Document Search', () => {
    it('should search documents successfully', async () => {
      const mockDocuments = [
        {
          id: 'doc1',
          title: 'Test Document',
          content: 'Test content',
          source: 'test-source',
          similarity: 0.9,
        },
      ];

      mockRagAPI.searchDocuments.mockResolvedValue({
        data: mockDocuments,
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('test query');
      });

      expect(mockRagAPI.searchDocuments).toHaveBeenCalledWith('test query', 5);
      expect(result.current.searchResults?.documents).toHaveLength(1);
      expect(result.current.searchResults?.query).toBe('test query');
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle empty search results', async () => {
      mockRagAPI.searchDocuments.mockResolvedValue({
        data: [],
        status: 'success',
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('empty query');
      });

      expect(result.current.searchResults?.documents).toEqual([]);
      expect(result.current.searchResults?.totalResults).toBe(0);
    });

    it('should handle search errors', async () => {
      const errorMessage = 'Search failed';
      mockRagAPI.searchDocuments.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRAG());

      await act(async () => {
        await result.current.searchDocuments('error query');
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.progress.stage).toBe('error');
      expect(result.current.isSearching).toBe(false);
    });
  });
}); 