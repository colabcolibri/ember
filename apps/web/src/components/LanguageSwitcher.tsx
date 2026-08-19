import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LOCALES = ['pt', 'en'] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-1" role="group" aria-label="Language">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          className={cn(
            'min-h-9 rounded-full px-2.5 text-xs font-extrabold transition-colors',
            i18n.language === locale
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:bg-foreground/5',
          )}
          onClick={() => {
            void i18n.changeLanguage(locale);
            localStorage.setItem('ember_locale', locale);
          }}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
