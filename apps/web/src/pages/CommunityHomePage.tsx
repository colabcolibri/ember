import { AppBrand, AppButton, AppLoading } from '@/components/app/index.js';
import { loginPath } from '@/lib/app-mode.js';
import { shellContainerClass } from '@/lib/layout';
import { usePublicCommunity } from '@/lib/usePublicCommunity.js';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function CommunityHomePage() {
  const { t } = useTranslation();
  const { data, loading, error } = usePublicCommunity();

  if (loading) {
    return (
      <div className={cn(shellContainerClass(), 'py-24')}>
        <AppLoading />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn(shellContainerClass(), 'py-24 text-center text-muted-foreground')}>
        {t('communityHome.loadError')}
      </div>
    );
  }

  const { settings } = data;
  const hero = settings.hero ?? {};
  const blocks = settings.blocks ?? [];

  return (
    <div className="relative z-10 w-full">
      <section className="landing-hero-glow border-b border-outline-variant/15">
        <div className={cn(shellContainerClass(), 'py-16 sm:py-24 lg:py-28')}>
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            {hero.logoUrl ? (
              <img
                src={hero.logoUrl}
                alt={data.name}
                className="mb-8 h-16 w-auto max-w-48 object-contain sm:h-20"
              />
            ) : (
              <AppBrand markOnly={false} size="lg" className="mb-8 h-16 w-auto sm:h-20" />
            )}

            <p className="font-serif text-sm uppercase tracking-[0.18em] text-primary">{data.name}</p>
            <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight text-foreground">
              {hero.title}
            </h1>
            {hero.subtitle ? (
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">{hero.subtitle}</p>
            ) : null}

            <AppButton asChild variant="ink" size="lg" className="mt-10 w-full sm:w-auto sm:min-w-48">
              <Link to={loginPath()}>{t('communityHome.cta')}</Link>
            </AppButton>
          </div>
        </div>
      </section>

      {settings.introParagraph ? (
        <section className="border-b border-outline-variant/15">
          <div className={cn(shellContainerClass(), 'py-14 sm:py-16')}>
            <p className="mx-auto max-w-3xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
              {settings.introParagraph}
            </p>
          </div>
        </section>
      ) : null}

      {blocks.length > 0 ? (
        <section>
          <div className={cn(shellContainerClass(), 'py-14 sm:py-16')}>
            <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6">
              {blocks.map((block) => (
                <li
                  key={`${block.title}-${block.body.slice(0, 12)}`}
                  className="rounded-2xl border border-outline-variant/25 bg-paper/70 p-6 shadow-sm"
                >
                  <h2 className="font-serif text-xl font-bold text-foreground">{block.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{block.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
