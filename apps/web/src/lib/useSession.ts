import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './api.js';

export type MeProfile = {
  isFacilitator?: boolean;
  role?: string;
};

export function useSession() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isFacilitator, setIsFacilitator] = useState(false);
  const navigate = useNavigate();

  const refreshSession = useCallback(() => {
    return apiFetch<MeProfile>('/me/profile')
      .then((profile) => {
        setAuthed(true);
        setIsFacilitator(Boolean(profile.isFacilitator));
      })
      .catch(() => {
        setAuthed(false);
        setIsFacilitator(false);
      });
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  function onLoggedOut() {
    setAuthed(false);
    setIsFacilitator(false);
    navigate('/login', { replace: true });
  }

  function onAuthenticated() {
    void refreshSession();
  }

  return { authed, isFacilitator, onAuthenticated, onLoggedOut };
}
