import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Search, MessageSquare, Trash2, Eye, Plus } from 'lucide-react';
import { ragAPI } from '../../services/api';
import Card from '../ui/atoms/Card';
import Button from '../ui/atoms/Button';
import { Badge } from '../ui/atoms/Badge';
import { Spinner } from '../ui/atoms/Spinner';

interface RAGDocument {
  id: string;
  filename: string;
  description?: string;
  tags?: string[];
  directory_path?: string;
  created_at: string;
  chunks_count?: number;
}

interface RAGQueryResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

interface RAGManagerModuleProps {
  compact?: boolean;
  onClose?: () => void;
}

const RAGManagerModule: React.FC<RAGManagerModuleProps> = ({
  compact = false,
  onClose
}) => {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<RAGQueryResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'chat'>('documents');

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ragAPI.getDocuments();
      setDocuments(response.data || []);
    } catch (err) {
      setError('Failed to load documents');
      console.error('RAG documents error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name) {
      setError('Invalid file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await ragAPI.uploadDocument(file);
      await loadDocuments(); // Reload documents
    } catch (err) {
      setError('Failed to upload document');
      console.error('RAG upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [loadDocuments]);

  const handleQuery = useCallback(async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    setError(null);
    setResponse(null);

    try {
      const response = await ragAPI.queryRAG(query);
      setResponse(response.data);
    } catch (err) {
      setError('Failed to query RAG system');
      console.error('RAG query error:', err);
    } finally {
      setIsQuerying(false);
    }
  }, [query]);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      await ragAPI.deleteDocument(documentId);
      await loadDocuments(); // Reload documents
    } catch (err) {
      setError('Failed to delete document');
      console.error('RAG delete error:', err);
    }
  }, [loadDocuments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (compact) {
    return (
      <Card padding="md" shadow="sm">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Chat with your documents
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Ask Documents
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          RAG Document Manager
        </h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            ×
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'documents'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Chat
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upload documents to your knowledge base
              </p>
              <input
                type="file"
                id="rag-file-upload"
                className="hidden"
                accept=".pdf,.txt,.docx,.md,.rtf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                disabled={isUploading}
              />
              <label
                htmlFor="rag-file-upload"
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-1">Uploading...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-1" />
                    Upload Document
                  </>
                )}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PDF, TXT, DOCX, MD, RTF (max 10MB)
              </p>
            </div>
          </div>

          {/* Documents List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.filename}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(doc.created_at)}
                        {doc.chunks_count && ` • ${doc.chunks_count} chunks`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.tags && doc.tags.length > 0 && (
                      <Badge variant="info" size="sm">
                        {doc.tags[0]}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          {/* Query Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuery}
              disabled={!query.trim() || isQuerying}
            >
              {isQuerying ? <Spinner size="sm" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Response */}
          {response && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Answer
              </h4>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {response.answer}
              </p>
              
              {response.sources && response.sources.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Sources:
                  </h5>
                  <div className="space-y-1">
                    {response.sources.map((source, index) => (
                      <p key={index} className="text-xs text-gray-500 dark:text-gray-400">
                        • {source}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {response.confidence && (
                <div className="mt-2">
                  <Badge variant="info" size="sm">
                    Confidence: {Math.round(response.confidence * 100)}%
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Quick Questions */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Quick Questions
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('What documents do I have?')}
              >
                What documents do I have?
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('Summarize my documents')}
              >
                Summarize my documents
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('Find recipes in my documents')}
              >
                Find recipes
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RAGManagerModule; 