import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBrand, AppButton } from '../components/app/index.js';
import { DemoResetButton } from '../components/app/DemoResetButton.js';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';
import { ScrollArea, scrollAreaFillClass } from '@/components/ui/scroll-area.js';
import { shellContainerClass } from '@/lib/layout';
import { loginPath } from '@/lib/app-mode.js';
import { isMockMode } from '@/lib/mock-mode.js';
import { usePublicCommunity } from '@/lib/usePublicCommunity.js';
import { cn } from '@/lib/utils';

export function LandingLayout() {
  const { t } = useTranslation();
  const { data } = usePublicCommunity();
  const hero = data?.settings.hero;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background ember-orbital-radial">
      <div className="ember-orbit-bg" aria-hidden="true" />
      <div className="ember-orbit-dot-rust" aria-hidden="true" />
      <div className="ember-orbit-dot-sage" aria-hidden="true" />

      <header className="relative z-20 shrink-0 border-b border-outline-variant/20 bg-paper/80 backdrop-blur-md">
        <div className={cn(shellContainerClass(), 'flex items-center justify-between gap-4 py-3 sm:py-4')}>
          <Link to="/" className="shrink-0" aria-label={data?.name ?? t('app.title')}>
            {hero?.logoUrl ? (
              <img
                src={hero.logoUrl}
                alt={data?.name ?? t('app.title')}
                className="h-8 w-auto max-w-30 object-contain sm:h-9 sm:max-w-34"
              />
            ) : (
              <AppBrand markOnly={false} size="lg" className="h-8 w-auto max-w-30 sm:h-9 sm:max-w-34" />
            )}
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <AppButton asChild variant="ink" size="sm" className="sm:px-5">
              <Link to={loginPath()}>{t('communityHome.cta')}</Link>
            </AppButton>
          </div>
        </div>
      </header>

      <ScrollArea className={cn(scrollAreaFillClass, 'relative z-10 flex-1')}>
        <Outlet />
      </ScrollArea>

      {isMockMode ? <DemoResetButton /> : null}
    </div>
  );
}
