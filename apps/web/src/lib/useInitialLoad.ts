import { useEffect, useState } from 'react';

export function useInitialLoad(
  loader: () => Promise<void>,
  deps: readonly unknown[],
) {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setInitialLoading(true);

    loader()
      .catch(() => {
        // caller handles errors inside loader when needed
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps passed by caller
  }, deps);

  return { initialLoading };
}
