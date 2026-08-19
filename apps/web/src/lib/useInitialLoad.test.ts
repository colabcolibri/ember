// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInitialLoad } from './useInitialLoad.js';

describe('useInitialLoad', () => {
  it('starts loading and finishes after loader resolves', async () => {
    const loader = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInitialLoad(loader, []));

    expect(result.current.initialLoading).toBe(true);
    await waitFor(() => expect(result.current.initialLoading).toBe(false));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('finishes loading even when loader rejects', async () => {
    const loader = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useInitialLoad(loader, []));

    await waitFor(() => expect(result.current.initialLoading).toBe(false));
  });

  it('re-runs loader when deps change', async () => {
    const loader = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ id }) => useInitialLoad(loader, [id]),
      { initialProps: { id: 'a' } },
    );

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    rerender({ id: 'b' });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });
});
