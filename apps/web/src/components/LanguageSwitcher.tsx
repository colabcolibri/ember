import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LOCALES = ['pt', 'en'] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {LOCALES.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1">
          {index > 0 ? <span className="text-outline-variant/50">/</span> : null}
          <button
            type="button"
            className={cn(
              'rounded-full px-2 py-1 text-xs font-semibold tracking-wide transition-colors sm:text-sm',
              i18n.language === locale
                ? 'font-bold text-primary'
                : 'text-muted-foreground hover:text-primary',
            )}
            onClick={() => {
              void i18n.changeLanguage(locale);
              localStorage.setItem('ember_locale', locale);
            }}
          >
            {locale.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
