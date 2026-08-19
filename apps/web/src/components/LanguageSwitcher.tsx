import { useTranslation } from 'react-i18next';

const LOCALES = ['pt', 'en'] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          className={i18n.language === locale ? 'lang active' : 'lang'}
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
