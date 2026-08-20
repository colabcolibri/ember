import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLoading } from './components/app/index.js';
import { AppLayout } from './layouts/AppLayout.js';
import { LandingLayout } from './layouts/LandingLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { CommunityHomePage } from './pages/CommunityHomePage.js';
import { AdminCommunityPage } from './pages/AdminCommunityPage.js';
import { AdminMembersPage } from './pages/AdminMembersPage.js';
import { PresencePage } from './pages/PresencePage.js';
import { PresenceRoundPage } from './pages/PresenceRoundPage.js';
import { CirclesPage } from './pages/CirclesPage.js';
import { CircleDetailPage } from './pages/CircleDetailPage.js';
import { FacilitatorPage } from './pages/FacilitatorPage.js';
import { FacilitatorGatheringsPage } from './pages/FacilitatorGatheringsPage.js';
import { FacilitatorGatheringDetailPage } from './pages/FacilitatorGatheringDetailPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { DesignIndexPage } from './pages/design/DesignIndexPage.js';
import { DesignTokensPage } from './pages/design/DesignTokensPage.js';
import { DesignComponentsPage } from './pages/design/DesignComponentsPage.js';
import { DesignPatternsPage } from './pages/design/DesignPatternsPage.js';
import { useSession } from './lib/useSession.js';
import { isAppOnlyMode } from './lib/app-mode.js';

function PublicRoot({ authed }: { authed: boolean | null }) {
  if (authed === null) {
    return <AppLoading />;
  }

  if (authed) {
    return <Navigate to="/presence" replace />;
  }

  return <CommunityHomePage />;
}

function OrgAdminRoute({
  authed,
  isOrgAdmin,
  children,
}: {
  authed: boolean | null;
  isOrgAdmin: boolean;
  children: ReactNode;
}) {
  if (authed === null) {
    return <AppLoading />;
  }

  if (!isOrgAdmin) {
    return <Navigate to="/presence" replace />;
  }

  return children;
}

function FacilitatorRoute({
  authed,
  isFacilitator,
  children,
}: {
  authed: boolean | null;
  isFacilitator: boolean;
  children?: ReactNode;
}) {
  if (authed === null) {
    return <AppLoading />;
  }

  if (!isFacilitator) {
    return <Navigate to="/presence" replace />;
  }

  return children ?? <FacilitatorPage />;
}

export function App() {
  const { authed, isFacilitator, isOrgAdmin, onAuthenticated, onLoggedOut } = useSession();

  const layoutProps = {
    authed,
    isFacilitator,
    isOrgAdmin,
    onLoggedOut,
    onAuthenticated,
  };

  return (
    <Routes>
      {isAppOnlyMode ? (
        <>
          <Route element={<AppLayout {...layoutProps} mode="auth" auth="guest" />}>
            <Route path="/" element={<LoginPage />} />
          </Route>
          <Route path="/login" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route element={<LandingLayout />}>
            <Route path="/" element={<PublicRoot authed={authed} />} />
          </Route>

          <Route element={<AppLayout {...layoutProps} mode="auth" auth="guest" />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </>
      )}

      <Route element={<AppLayout {...layoutProps} mode="member" auth />}>
        <Route path="/presence" element={<PresencePage />} />
        <Route path="/presence/:roundId" element={<PresenceRoundPage />} />
        <Route path="/circles" element={<CirclesPage />} />
        <Route path="/circles/:id" element={<CircleDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/facilitator"
          element={<FacilitatorRoute authed={authed} isFacilitator={isFacilitator} />}
        />
        <Route
          path="/facilitator/gatherings"
          element={
            <FacilitatorRoute authed={authed} isFacilitator={isFacilitator}>
              <FacilitatorGatheringsPage />
            </FacilitatorRoute>
          }
        />
        <Route
          path="/facilitator/gatherings/:id"
          element={
            <FacilitatorRoute authed={authed} isFacilitator={isFacilitator}>
              <FacilitatorGatheringDetailPage />
            </FacilitatorRoute>
          }
        />
        <Route
          path="/admin/community"
          element={
            <OrgAdminRoute authed={authed} isOrgAdmin={isOrgAdmin}>
              <AdminCommunityPage />
            </OrgAdminRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <OrgAdminRoute authed={authed} isOrgAdmin={isOrgAdmin}>
              <AdminMembersPage />
            </OrgAdminRoute>
          }
        />
      </Route>

      {import.meta.env.DEV ? (
        <Route element={<AppLayout {...layoutProps} mode="catalog" />}>
          <Route path="/design" element={<DesignIndexPage />} />
          <Route path="/design/tokens" element={<DesignTokensPage />} />
          <Route path="/design/components" element={<DesignComponentsPage />} />
          <Route path="/design/patterns" element={<DesignPatternsPage />} />
        </Route>
      ) : null}
    </Routes>
  );
}
