/** Produção Docker / deploy fechado — sem landing de marketing; login na raiz. */
export const isAppOnlyMode = import.meta.env.VITE_APP_ONLY === 'true';

export function loginPath(): string {
  return isAppOnlyMode ? '/' : '/login';
}
