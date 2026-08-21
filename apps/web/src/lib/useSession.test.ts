// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSession } from './useSession.js';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('./api.js', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from './api.js';

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with authed null then true when session is authenticated', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        authenticated: true,
        isFacilitator: false,
        isOrgAdmin: false,
        role: 'member',
      })
      .mockResolvedValueOnce({
        displayName: 'Alex',
        editionYear: 2024,
        timezone: 'America/Sao_Paulo',
        languages: ['pt'],
        originPlace: { city: 'SP' },
        residencePlace: { city: 'RJ' },
      });
    const { result } = renderHook(() => useSession());
    expect(result.current.authed).toBe(null);

    await waitFor(() => expect(result.current.authed).toBe(true));
    expect(result.current.isFacilitator).toBe(false);
    expect(result.current.profileComplete).toBe(true);
    expect(apiFetch).toHaveBeenCalledWith('/auth/session');
    expect(apiFetch).toHaveBeenCalledWith('/me/profile');
  });

  it('sets facilitator flag from session', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        authenticated: true,
        isFacilitator: true,
        isOrgAdmin: false,
        role: 'facilitador',
      })
      .mockResolvedValueOnce({
        displayName: 'Facilitator',
        editionYear: 2020,
        timezone: 'America/Sao_Paulo',
        languages: ['pt', 'en'],
        originPlace: { city: 'SP' },
        residencePlace: { city: 'SP' },
      });
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.isFacilitator).toBe(true));
    await waitFor(() => expect(result.current.profileComplete).toBe(true));
  });

  it('sets authed false when guest session is returned', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ authenticated: false });
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.authed).toBe(false));
    expect(result.current.isFacilitator).toBe(false);
    expect(result.current.profileComplete).toBe(null);
  });

  it('onAuthenticated refetches session and profile', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ authenticated: false })
      .mockResolvedValueOnce({
        authenticated: true,
        isFacilitator: true,
        isOrgAdmin: false,
        role: 'facilitador',
      })
      .mockResolvedValueOnce({
        displayName: 'Facilitator',
        editionYear: 2020,
        timezone: 'America/Sao_Paulo',
        languages: ['pt'],
        originPlace: { city: 'SP' },
        residencePlace: { city: 'SP' },
      });
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.authed).toBe(false));

    await act(async () => {
      await result.current.onAuthenticated();
    });
    await waitFor(() => expect(result.current.authed).toBe(true));
    expect(result.current.isFacilitator).toBe(true);
    expect(apiFetch).toHaveBeenCalledTimes(3);
  });

  it('onLoggedOut clears session and navigates to login', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        authenticated: true,
        isFacilitator: false,
        isOrgAdmin: false,
        role: 'member',
      })
      .mockResolvedValueOnce({
        displayName: 'Alex',
        editionYear: 2024,
        timezone: 'America/Sao_Paulo',
        languages: ['pt'],
        originPlace: { city: 'SP' },
        residencePlace: { city: 'RJ' },
      });
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.authed).toBe(true));

    act(() => {
      result.current.onLoggedOut();
    });
    await waitFor(() => expect(result.current.authed).toBe(false));
    expect(result.current.isFacilitator).toBe(false);
    expect(result.current.profileComplete).toBe(null);
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
