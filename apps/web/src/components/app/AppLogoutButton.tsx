import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api.js';
import { cn } from '@/lib/utils';

type AppLogoutButtonProps = {
  onLoggedOut: () => void;
  className?: string;
};

export function AppLogoutButton({ onLoggedOut, className }: AppLogoutButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST', body: '{}' });
      onLoggedOut();
    } catch {
      onLoggedOut();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary disabled:opacity-50 sm:text-sm',
        className,
      )}
      aria-label={t('nav.logout')}
    >
      <span className="material-symbols-outlined text-base" aria-hidden>
        logout
      </span>
      <span className="hidden sm:inline">{t('nav.logout')}</span>
    </button>
  );
}
