import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './components/LanguageSwitcher.js';
import { LoginPage } from './pages/LoginPage.js';
import { PresencePage } from './pages/PresencePage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { apiFetch } from './lib/api.js';

export function App() {
  const { t } = useTranslation();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    apiFetch('/me/profile')
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, [location.pathname]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t('app.title')}</p>
          <h1>{t('app.tagline')}</h1>
        </div>
        <LanguageSwitcher />
      </header>

      <nav className="nav">
        <Link to="/login">{t('nav.login')}</Link>
        <Link to="/profile">{t('nav.profile')}</Link>
        <Link to="/presence">{t('nav.presence')}</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={authed === false ? <Navigate to="/login" replace /> : <ProfilePage />}
        />
        <Route
          path="/presence"
          element={authed === false ? <Navigate to="/login" replace /> : <PresencePage />}
        />
        <Route path="/" element={<Navigate to={authed ? '/presence' : '/login'} replace />} />
      </Routes>
    </main>
  );
}
