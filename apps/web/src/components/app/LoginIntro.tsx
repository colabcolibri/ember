import { useTranslation } from 'react-i18next';
import { AppBrand } from './AppBrand.js';
import { cn } from '@/lib/utils';

type LoginIntroProps = {
  /** Versão curta no passo de verificação do código */
  compact?: boolean;
  /** Demo no GitHub Pages */
  demo?: boolean;
  className?: string;
};

export function LoginIntro({ compact = false, demo = false, className }: LoginIntroProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-3xl overflow-hidden rounded-[28px] border border-outline-variant/25 bg-paper px-6 py-8 shadow-sm sm:px-10 sm:py-10',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -top-8 -right-8 size-28 rounded-full border border-primary/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full border border-primary/5"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-row items-start gap-5 sm:gap-8">
        <AppBrand
          markOnly={false}
          size="lg"
          className={cn(
            'h-14 w-auto max-w-[9rem] shrink-0 sm:h-[5.5rem] sm:max-w-[13rem]',
            compact && 'sm:h-14 sm:max-w-[10rem]',
          )}
        />

        <div className="min-w-0 flex-1 space-y-3 text-left">
          {!compact ? (
            <>
              <p className="font-serif text-[clamp(1.75rem,4vw,2.25rem)] leading-tight font-bold text-foreground">
                {t('login.communityCall')}
              </p>
              <p className="text-base leading-relaxed text-foreground/90 sm:text-lg">
                {t('login.communityLead')}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {demo ? t('login.demoCommunityNote') : t('login.communityNote')}
              </p>
            </>
          ) : (
            <p className="font-serif text-[clamp(1.5rem,3.5vw,1.875rem)] leading-tight font-bold text-foreground">
              {t('login.communityCall')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
