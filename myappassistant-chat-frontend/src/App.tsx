import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PantryPage = lazy(() => import('./pages/PantryPage'));
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const OCRPage = lazy(() => import('./pages/OCRPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));

/**
 * Main App component for FoodSave AI Frontend.
 * 
 * This component provides the main routing structure and error handling
 * for the application, following the .cursorrules guidelines.
 */
const App: React.FC = () => {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pantry" element={<PantryPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ocr" element={<OCRPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
};

export default App;
