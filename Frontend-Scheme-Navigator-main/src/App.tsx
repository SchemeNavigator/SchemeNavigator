import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/appStore';
import { initStoredLanguage } from './utils/translator';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { SurveyPage } from './pages/SurveyPage';
import { AnalyzingPage } from './pages/AnalyzingPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { ExplorePage } from './pages/ExplorePage';
import { DashboardPage } from './pages/DashboardPage';
import { AssistantPage } from './pages/AssistantPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

export function App() {
  useEffect(() => {
    initStoredLanguage();
  }, []);

  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<HomePage />} />
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/analyzing" element={<AnalyzingPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/schemes/:id" element={<SchemeDetailPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
