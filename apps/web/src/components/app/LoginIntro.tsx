import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBrand } from './AppBrand.js';
import { cn } from '@/lib/utils';

type LoginIntroProps = {
  /** Versão curta no passo de verificação do código */
  compact?: boolean;
  className?: string;
};

export function LoginIntro({ compact = false, className }: LoginIntroProps) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className={cn('mx-auto w-full max-w-xl text-center', className)}>
        <AppBrand markOnly={false} size="lg" className="mx-auto mb-4 h-9 w-auto max-w-[8rem] sm:h-10 sm:max-w-[9rem]" />
        <p className="font-serif text-xl font-bold tracking-tight text-foreground lowercase sm:text-2xl">
          {t('login.introTitleCompact')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto w-full max-w-xl text-center', className)}>
      <AppBrand
        markOnly={false}
        size="lg"
        className="mx-auto mb-6 h-11 w-auto max-w-[10rem] sm:mb-8 sm:h-14 sm:max-w-[12rem]"
      />

      <h1 className="font-serif text-[clamp(1.65rem,4.5vw,2.25rem)] leading-[1.08] font-bold tracking-tight text-foreground lowercase">
        <span>{t('login.introTitleLine1')}</span>{' '}
        <span className="text-primary">{t('login.introTitleLine2')}</span>
      </h1>

      <p className="mt-6">
        <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          {t('login.backToSite')}
        </Link>
      </p>
    </div>
  );
}
