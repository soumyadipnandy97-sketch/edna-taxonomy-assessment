import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { HomePage } from './pages/HomePage';
import {
  AboutPage,
  ContactPage,
  FeaturesPage,
  HowItWorksPage,
  PrivacyPage,
  ScientificWorkflowPage,
  TermsPage,
} from './pages/PublicInfoPages';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from './pages/AuthPages';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { UploadDatasetPage } from './pages/UploadDatasetPage';
import { DatasetLibraryPage } from './pages/DatasetLibraryPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { TaxonomyExplorerPage } from './pages/TaxonomyExplorerPage';
import { BiodiversityPage } from './pages/BiodiversityPage';
import { SampleComparisonPage } from './pages/SampleComparisonPage';
import { BioAIAssistantPage } from './pages/BioAIAssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { AccountSettingsPage, ProfilePage } from './pages/ProfileAndSettingsPages';
import { AdminControlCenterPage } from './pages/AdminControlCenterPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/scientific-workflow" element={<ScientificWorkflowPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Authentication Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Authenticated Researcher Workspace */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/upload"
              element={
                <ProtectedRoute>
                  <UploadDatasetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/datasets"
              element={
                <ProtectedRoute>
                  <DatasetLibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analysis"
              element={
                <ProtectedRoute>
                  <AnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/taxonomy"
              element={
                <ProtectedRoute>
                  <TaxonomyExplorerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/biodiversity"
              element={
                <ProtectedRoute>
                  <BiodiversityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/compare"
              element={
                <ProtectedRoute>
                  <SampleComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/assistant"
              element={
                <ProtectedRoute>
                  <BioAIAssistantPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Restricted Hidden Admin Section (never linked in public/user UI) */}
            <Route
              path="/secure-control-center"
              element={
                <AdminRoute>
                  <AdminControlCenterPage />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
