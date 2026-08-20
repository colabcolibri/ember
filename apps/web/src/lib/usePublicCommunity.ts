import { useEffect, useState } from 'react';
import type { CommunityPublicResponse } from '@ember/domain/schemas/community-branding';
import { apiFetch } from './api.js';
import { applyCommunityTheme } from './community-theme.js';

export function usePublicCommunity() {
  const [data, setData] = useState<CommunityPublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<CommunityPublicResponse>('/public/community')
      .then((response) => {
        if (!cancelled) {
          setData(response);
          applyCommunityTheme(response.settings.theme);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('load_failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
