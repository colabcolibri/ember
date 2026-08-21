import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './api.js';
import { loginPath } from './app-mode.js';

type SessionGuest = { authenticated: false };
type SessionUser = {
  authenticated: true;
  isFacilitator?: boolean;
  isOrgAdmin?: boolean;
  role?: string;
};
type SessionResponse = SessionGuest | SessionUser;

export type MeProfile = {
  isFacilitator?: boolean;
  isOrgAdmin?: boolean;
  role?: string;
};

export function useSession() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isFacilitator, setIsFacilitator] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const navigate = useNavigate();

  const refreshSession = useCallback(() => {
    return apiFetch<SessionResponse>('/auth/session')
      .then((session) => {
        if (!session.authenticated) {
          setAuthed(false);
          setIsFacilitator(false);
          setIsOrgAdmin(false);
          return;
        }

        setAuthed(true);
        setIsFacilitator(Boolean(session.isFacilitator) || session.role === 'org_admin');
        setIsOrgAdmin(Boolean(session.isOrgAdmin) || session.role === 'org_admin');
      })
      .catch(() => {
        setAuthed(false);
        setIsFacilitator(false);
        setIsOrgAdmin(false);
      });
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  function onLoggedOut() {
    setAuthed(false);
    setIsFacilitator(false);
    setIsOrgAdmin(false);
    navigate(loginPath(), { replace: true });
  }

  function onAuthenticated() {
    void refreshSession();
  }

  return { authed, isFacilitator, isOrgAdmin, onAuthenticated, onLoggedOut };
}
