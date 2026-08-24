import { apiFetch } from './api.js';

type RoundDeclarationsPage<T> = {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

/** Loads every declaration for a round (API defaults to 20 per page). */
export async function fetchAllRoundDeclarations<T>(roundId: string): Promise<T[]> {
  const limit = 100;
  let page = 1;
  const items: T[] = [];

  for (;;) {
    const res = await apiFetch<RoundDeclarationsPage<T>>(
      `/admin/matching-rounds/${roundId}/declarations?page=${page}&limit=${limit}`,
    );
    items.push(...res.items);

    const pages = res.pagination?.pages;
    if (!pages || page >= pages) break;
    page += 1;
  }

  return items;
}
