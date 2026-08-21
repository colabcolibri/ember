import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileCompleteness, type ProfileCompletenessField } from '@ember/domain/profile/completeness';
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

type ProfileResponse = {
  displayName: string;
  editionYear: number | null;
  timezone: string;
  languages: string[];
  originPlace: unknown;
  residencePlace: unknown;
};

export type MeProfile = {
  isFacilitator?: boolean;
  isOrgAdmin?: boolean;
  role?: string;
};

export function useSession() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isFacilitator, setIsFacilitator] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [profileMissing, setProfileMissing] = useState<ProfileCompletenessField[]>([]);
  const navigate = useNavigate();

  const refreshProfile = useCallback(async (): Promise<boolean | null> => {
    try {
      const profile = await apiFetch<ProfileResponse>('/me/profile');
      const result = profileCompleteness(profile);
      setProfileComplete(result.complete);
      setProfileMissing(result.missing);
      return result.complete;
    } catch {
      setProfileComplete(null);
      setProfileMissing([]);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean | null> => {
    try {
      const session = await apiFetch<SessionResponse>('/auth/session');
      if (!session.authenticated) {
        setAuthed(false);
        setIsFacilitator(false);
        setIsOrgAdmin(false);
        setProfileComplete(null);
        setProfileMissing([]);
        return null;
      }

      setAuthed(true);
      setIsFacilitator(Boolean(session.isFacilitator) || session.role === 'org_admin');
      setIsOrgAdmin(Boolean(session.isOrgAdmin) || session.role === 'org_admin');
      return refreshProfile();
    } catch {
      setAuthed(false);
      setIsFacilitator(false);
      setIsOrgAdmin(false);
      setProfileComplete(null);
      setProfileMissing([]);
      return null;
    }
  }, [refreshProfile]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  function onLoggedOut() {
    setAuthed(false);
    setIsFacilitator(false);
    setIsOrgAdmin(false);
    setProfileComplete(null);
    setProfileMissing([]);
    navigate(loginPath(), { replace: true });
  }

  async function onAuthenticated(): Promise<boolean | null> {
    return refreshSession();
  }

  return {
    authed,
    isFacilitator,
    isOrgAdmin,
    profileComplete,
    profileMissing,
    refreshProfile,
    onAuthenticated,
    onLoggedOut,
  };
}
