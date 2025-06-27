import React, { useState } from 'react';
import Card from '../components/ui/atoms/Card';
import Button from '../components/ui/atoms/Button';
import { Badge } from '../components/ui/atoms/Badge';
import { Spinner } from '../components/ui/atoms/Spinner';
import ReceiptUploadModule from '../components/modules/ReceiptUploadModule';
import RAGManagerModule from '../components/modules/RAGManagerModule';
import type { ReceiptData } from '../types';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  variant: 'primary' | 'secondary';
}

interface Alert {
  id: string;
  type: 'expiry' | 'bill' | 'email' | 'reminder';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface Activity {
  id: string;
  type: 'pantry' | 'expense' | 'ai' | 'receipt';
  message: string;
  timestamp: Date;
}

const PersonalDashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRAGModal, setShowRAGModal] = useState(false);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptData[]>([]);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  // Mock data - w przyszłości z API
  const quickActions: QuickAction[] = [
    {
      id: 'add-receipt',
      title: 'Add Receipt',
      description: 'Scan and process receipt',
      icon: '📄',
      action: () => setShowReceiptModal(true),
      variant: 'primary'
    },
    {
      id: 'check-pantry',
      title: 'Check Pantry',
      description: 'View food inventory',
      icon: '🏠',
      action: () => console.log('Check pantry'),
      variant: 'secondary'
    },
    {
      id: 'ask-ai',
      title: 'Ask AI Assistant',
      description: 'Get smart recommendations',
      icon: '🤖',
      action: () => setShowRAGModal(true),
      variant: 'primary'
    },
    {
      id: 'view-expenses',
      title: 'View Expenses',
      description: 'Check spending overview',
      icon: '💰',
      action: () => console.log('View expenses'),
      variant: 'secondary'
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      type: 'expiry',
      message: '3 items expiring soon',
      priority: 'high'
    },
    {
      id: '2',
      type: 'bill',
      message: '2 upcoming bills',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'email',
      message: '1 unread important email',
      priority: 'low'
    }
  ];

  const recentActivity: Activity[] = [
    {
      id: '1',
      type: 'pantry',
      message: 'Added milk to pantry',
      timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 min ago
    },
    {
      id: '2',
      type: 'expense',
      message: 'Spent $45.20 on groceries',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      id: '3',
      type: 'ai',
      message: 'Asked about recipe for chicken',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
    }
  ];

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'expiry': return '⚠️';
      case 'bill': return '📅';
      case 'email': return '📧';
      case 'reminder': return '⏰';
      default: return 'ℹ️';
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'pantry': return '🏠';
      case 'expense': return '💰';
      case 'ai': return '🤖';
      case 'receipt': return '📄';
      default: return '📝';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleReceiptProcessed = (receiptData: ReceiptData) => {
    setRecentReceipts(prev => [receiptData, ...prev.slice(0, 4)]); // Keep last 5 receipts
    setShowReceiptModal(false);
  };

  const handleAskAI = async () => {
    if (!aiMessage.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiMessage
        }),
      });
      
      const data = await response.json();
      setAiResponse(data.data || 'Przepraszam, wystąpił błąd.');
    } catch (error) {
      console.error('Error asking AI:', error);
      setAiResponse('Przepraszam, wystąpił błąd komunikacji z serwerem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setAiMessage(question);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Personal AI Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Your smart companion for daily tasks
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="success" size="md">
              Active
            </Badge>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <Card padding="lg" shadow="md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                size="lg"
                onClick={action.action}
                className="flex flex-col items-center justify-center h-24 space-y-2"
              >
                <span className="text-2xl">{action.icon}</span>
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Alerts */}
          <Card padding="lg" shadow="md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Today's Alerts
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getAlertIcon(alert.type)}</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {alert.message}
                    </span>
                  </div>
                  <Badge
                    variant={alert.priority === 'high' ? 'error' : alert.priority === 'medium' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {alert.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card padding="lg" shadow="md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {activity.message}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Assistant Widget */}
        <Card padding="lg" shadow="md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            AI Assistant
          </h2>
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                placeholder="Ask me anything about your food, expenses, or documents..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="primary" size="lg" disabled={isLoading || !aiMessage.trim()} onClick={handleAskAI}>
              {isLoading ? <Spinner size="sm" /> : 'Ask'}
            </Button>
          </div>
          
          {aiResponse && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">AI Response:</h3>
              <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("What's expiring soon?")}>
              "What's expiring soon?"
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("Show me this month's expenses")}>
              "Show me this month's expenses"
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickQuestion("Find recipe for chicken")}>
              "Find recipe for chicken"
            </Button>
          </div>
        </Card>

        {/* Recent Receipts */}
        {recentReceipts.length > 0 && (
          <Card padding="lg" shadow="md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Receipts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReceipts.map((receipt, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {receipt.store}
                    </h3>
                    <Badge variant="info" size="sm">
                      {receipt.items.length} items
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {new Date(receipt.date).toLocaleDateString('pl-PL')}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('pl-PL', {
                      style: 'currency',
                      currency: 'PLN'
                    }).format(receipt.total)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Receipt Upload Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ReceiptUploadModule
              onReceiptProcessed={handleReceiptProcessed}
              onClose={() => setShowReceiptModal(false)}
            />
          </div>
        </div>
      )}

      {/* RAG Manager Modal */}
      {showRAGModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <RAGManagerModule
              onClose={() => setShowRAGModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDashboardPage; 