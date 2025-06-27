import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
 * Main App component for Personal AI Assistant.
 * 
 * This component provides the main routing structure and error handling
 * for the personal AI assistant application.
 */
const App: React.FC = () => {
  return (
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
  );
};

export default App;
