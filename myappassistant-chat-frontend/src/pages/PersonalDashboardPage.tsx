import React, { useState } from 'react';
import Card from '../components/ui/atoms/Card';
import Button from '../components/ui/atoms/Button';
import { Badge } from '../components/ui/atoms/Badge';
import { Spinner } from '../components/ui/atoms/Spinner';

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

  // Mock data - w przyszłości z API
  const quickActions: QuickAction[] = [
    {
      id: 'add-receipt',
      title: 'Add Receipt',
      description: 'Scan and process receipt',
      icon: '📄',
      action: () => console.log('Add receipt'),
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
      action: () => console.log('Ask AI'),
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
                placeholder="Ask me anything about your food, expenses, or documents..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="primary" size="lg" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : 'Ask'}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              "What's expiring soon?"
            </Button>
            <Button variant="outline" size="sm">
              "Show me this month's expenses"
            </Button>
            <Button variant="outline" size="sm">
              "Find recipe for chicken"
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PersonalDashboardPage; 