import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from './components/app/AppShell.js';
import { AppLayout } from './layouts/AppLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { PresencePage } from './pages/PresencePage.js';
import { CirclesPage } from './pages/CirclesPage.js';
import { CircleDetailPage } from './pages/CircleDetailPage.js';
import { FacilitatorPage } from './pages/FacilitatorPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { DesignIndexPage } from './pages/design/DesignIndexPage.js';
import { DesignTokensPage } from './pages/design/DesignTokensPage.js';
import { DesignComponentsPage } from './pages/design/DesignComponentsPage.js';
import { DesignPatternsPage } from './pages/design/DesignPatternsPage.js';
import { apiFetch } from './lib/api.js';

function HomeRedirect({ authed }: { authed: boolean | null }) {
  const { t } = useTranslation();

  if (authed === null) {
    return (
      <AppShell mode="member" authed={null}>
        <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      </AppShell>
    );
  }

  return <Navigate to={authed ? '/presence' : '/login'} replace />;
}

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/me/profile')
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  function handleLoggedOut() {
    setAuthed(false);
    navigate('/login', { replace: true });
  }

  function handleAuthenticated() {
    setAuthed(true);
  }

  const layoutProps = {
    authed,
    onLoggedOut: handleLoggedOut,
    onAuthenticated: handleAuthenticated,
  };

  return (
    <Routes>
      <Route element={<AppLayout {...layoutProps} mode="auth" auth="guest" />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<AppLayout {...layoutProps} mode="member" auth />}>
        <Route path="/presence" element={<PresencePage />} />
        <Route path="/circles" element={<CirclesPage />} />
        <Route path="/circles/:id" element={<CircleDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/facilitator" element={<FacilitatorPage />} />
      </Route>

      {import.meta.env.DEV ? (
        <Route element={<AppLayout {...layoutProps} mode="catalog" />}>
          <Route path="/design" element={<DesignIndexPage />} />
          <Route path="/design/tokens" element={<DesignTokensPage />} />
          <Route path="/design/components" element={<DesignComponentsPage />} />
          <Route path="/design/patterns" element={<DesignPatternsPage />} />
        </Route>
      ) : null}

      <Route path="/" element={<HomeRedirect authed={authed} />} />
    </Routes>
  );
}
