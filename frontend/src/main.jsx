import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import { GenerationProvider } from './contexts/GenerationContext';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import GeneratePage from './pages/GeneratePage';
import GalleryPage from './pages/GalleryPage';
import ProfilePage from './pages/ProfilePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AuthGuard from './components/AuthGuard';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GenerationProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/generate" element={
              <AuthGuard>
                <GeneratePage />
              </AuthGuard>
            } />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/profile" element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            } />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Route>
        </Routes>
      </GenerationProvider>
    </BrowserRouter>
  </StrictMode>,
);
