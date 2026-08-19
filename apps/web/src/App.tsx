import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
  children,
}: {
  authed: boolean | null;
  variant: 'auth' | 'app';
  children: ReactNode;
}) {
  return (
    <AppShell variant={variant} authed={authed}>
      {children}
    </AppShell>
  );
}

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    apiFetch('/me/profile')
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, [location.pathname]);

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
          <ProductLayout authed={authed} variant="auth">
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
            <ProductLayout authed={authed} variant="app">
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
            <ProductLayout authed={authed} variant="app">
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
            <ProductLayout authed={authed} variant="app">
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
            <ProductLayout authed={authed} variant="app">
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
            <ProductLayout authed={authed} variant="app">
              <PresencePage />
            </ProductLayout>
          )
        }
      />
      <Route path="/" element={<Navigate to={authed ? '/presence' : '/login'} replace />} />
    </Routes>
  );
}
