import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './components/ThemeProvider';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load pages for better performance
const PersonalDashboardPage = lazy(() => import('./pages/PersonalDashboardPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PantryPage = lazy(() => import('./pages/PantryPage'));
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const OCRPage = lazy(() => import('./pages/OCRPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));

/**
 * Main App Component
 * 
 * Features:
 * - Error boundary for graceful error handling
 * - Theme provider for dark/light mode
 * - Toast notifications
 * - Lazy loading for better performance
 * - Internationalization support
 * - Responsive layout with navigation
 */
const App: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider />
        <MainLayout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Navigate to="/personal" replace />} />
              <Route path="/personal" element={<PersonalDashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pantry" element={<PantryPage />} />
              <Route path="/shopping" element={<ShoppingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/ocr" element={<OCRPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="*" element={<Navigate to="/personal" replace />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
