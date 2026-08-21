import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PanelLeft } from 'lucide-react';
import { AppBrand } from './AppBrand.js';
import { LanguageSwitcher } from '../LanguageSwitcher.js';
import { cn } from '@/lib/utils';

type AppShellHeaderProps = {
  homeTo: string;
  onToggleSidebar?: () => void;
  className?: string;
};

export function AppShellHeader({ homeTo, onToggleSidebar, className }: AppShellHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-3 border-b border-outline-variant/30 bg-paper/95 px-4 backdrop-blur-md sm:px-6',
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
        aria-label={t('sidebar.navigation')}
      >
        <PanelLeft className="size-5" aria-hidden />
      </button>

      <Link
        to={homeTo}
        className="flex min-w-0 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-90"
        aria-label="Ember — início"
      >
        <AppBrand markOnly size="sm" />
        <span className="truncate font-serif text-lg font-semibold text-foreground">Ember</span>
      </Link>

      <div className="ml-auto shrink-0">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
