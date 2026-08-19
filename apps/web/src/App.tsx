import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from './components/app/index.js';
import { LoginPage } from './pages/LoginPage.js';
import { PresencePage } from './pages/PresencePage.js';
import { CirclesPage } from './pages/CirclesPage.js';
import { CircleDetailPage } from './pages/CircleDetailPage.js';
import { FacilitatorPage } from './pages/FacilitatorPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { DesignLayout } from './pages/design/DesignLayout.js';
import { DesignIndexPage } from './pages/design/DesignIndexPage.js';
import { DesignTokensPage } from './pages/design/DesignTokensPage.js';
import { DesignComponentsPage } from './pages/design/DesignComponentsPage.js';
import { DesignPatternsPage } from './pages/design/DesignPatternsPage.js';
import { apiFetch } from './lib/api.js';

function ProductLayout({
  authed,
  variant,
  onLoggedOut,
  children,
}: {
  authed: boolean | null;
  variant: 'auth' | 'app' | 'facilitator';
  onLoggedOut: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  if (authed === null && variant !== 'auth') {
    return (
      <AppShell variant={variant} authed={authed}>
        <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      </AppShell>
    );
  }

  return (
    <AppShell variant={variant} authed={authed} onLoggedOut={onLoggedOut}>
      {children}
    </AppShell>
  );
}

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/me/profile')
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, [location.pathname]);

  function handleLoggedOut() {
    setAuthed(false);
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      {import.meta.env.DEV ? (
        <Route path="/design" element={<DesignLayout />}>
          <Route index element={<DesignIndexPage />} />
          <Route path="tokens" element={<DesignTokensPage />} />
          <Route path="components" element={<DesignComponentsPage />} />
          <Route path="patterns" element={<DesignPatternsPage />} />
        </Route>
      ) : null}

      <Route
        path="/login"
        element={
          <ProductLayout authed={authed} variant="auth" onLoggedOut={handleLoggedOut}>
            <LoginPage />
          </ProductLayout>
        }
      />

      <Route
        path="/circles"
        element={
          authed === false ? (
            <Navigate to="/login" replace />
          ) : (
            <ProductLayout authed={authed} variant="app" onLoggedOut={handleLoggedOut}>
              <CirclesPage />
            </ProductLayout>
          )
        }
      />
      <Route
        path="/circles/:id"
        element={
          authed === false ? (
            <Navigate to="/login" replace />
          ) : (
            <ProductLayout authed={authed} variant="app" onLoggedOut={handleLoggedOut}>
              <CircleDetailPage />
            </ProductLayout>
          )
        }
      />
      <Route
        path="/facilitator"
        element={
          authed === false ? (
            <Navigate to="/login" replace />
          ) : (
            <ProductLayout authed={authed} variant="facilitator" onLoggedOut={handleLoggedOut}>
              <FacilitatorPage />
            </ProductLayout>
          )
        }
      />
      <Route
        path="/profile"
        element={
          authed === false ? (
            <Navigate to="/login" replace />
          ) : (
            <ProductLayout authed={authed} variant="app" onLoggedOut={handleLoggedOut}>
              <ProfilePage />
            </ProductLayout>
          )
        }
      />
      <Route
        path="/presence"
        element={
          authed === false ? (
            <Navigate to="/login" replace />
          ) : (
            <ProductLayout authed={authed} variant="app" onLoggedOut={handleLoggedOut}>
              <PresencePage />
            </ProductLayout>
          )
        }
      />
      <Route path="/" element={<Navigate to={authed ? '/presence' : '/login'} replace />} />
    </Routes>
  );
}
