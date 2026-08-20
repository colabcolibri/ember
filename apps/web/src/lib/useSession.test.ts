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
    vi.mocked(apiFetch).mockResolvedValueOnce({
      authenticated: true,
      isFacilitator: false,
      isOrgAdmin: false,
      role: 'member',
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.authed).toBe(null);

    await waitFor(() => expect(result.current.authed).toBe(true));
    expect(result.current.isFacilitator).toBe(false);
    expect(apiFetch).toHaveBeenCalledWith('/auth/session');
  });

  it('sets facilitator flag from session', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      authenticated: true,
      isFacilitator: true,
      isOrgAdmin: false,
      role: 'facilitator',
    });
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.isFacilitator).toBe(true));
  });

  it('sets authed false when guest session is returned', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ authenticated: false });
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.authed).toBe(false));
    expect(result.current.isFacilitator).toBe(false);
  });

  it('onAuthenticated refetches session', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ authenticated: false })
      .mockResolvedValueOnce({
        authenticated: true,
        isFacilitator: true,
        isOrgAdmin: false,
        role: 'facilitator',
      });
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.authed).toBe(false));

    result.current.onAuthenticated();
    await waitFor(() => expect(result.current.authed).toBe(true));
    expect(result.current.isFacilitator).toBe(true);
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('onLoggedOut clears session and navigates to login', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      authenticated: true,
      isFacilitator: false,
      isOrgAdmin: false,
      role: 'member',
    });
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.authed).toBe(true));

    act(() => {
      result.current.onLoggedOut();
    });
    await waitFor(() => expect(result.current.authed).toBe(false));
    expect(result.current.isFacilitator).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
