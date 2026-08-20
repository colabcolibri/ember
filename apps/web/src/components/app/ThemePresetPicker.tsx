import type { CommunityThemePreset } from '@ember/domain/schemas/community-branding';
import { useTranslation } from 'react-i18next';
import {
  COMMUNITY_THEME_PRESET_IDS,
  COMMUNITY_THEME_PRESETS,
  themeColorCss,
} from '@/lib/community-theme.js';
import { cn } from '@/lib/utils';

type ThemePresetPickerProps = {
  value: CommunityThemePreset;
  onChange: (preset: CommunityThemePreset) => void;
};

export function ThemePresetPicker({ value, onChange }: ThemePresetPickerProps) {
  const { t } = useTranslation();

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      role="radiogroup"
      aria-label={t('adminCommunity.themePreset')}
    >
      {COMMUNITY_THEME_PRESET_IDS.map((preset) => {
        const colors = COMMUNITY_THEME_PRESETS[preset];
        const selected = value === preset;

        return (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(preset)}
            className={cn(
              'flex w-full min-w-0 flex-col gap-3 rounded-2xl border px-3 py-3 text-left transition-colors',
              selected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                : 'border-outline-variant/30 bg-paper hover:border-primary/30 hover:bg-primary/5',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className="size-7 shrink-0 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: themeColorCss(colors.primary) }}
                aria-hidden="true"
              />
              <span
                className="size-7 shrink-0 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: themeColorCss(colors.accent) }}
                aria-hidden="true"
              />
              <span
                className="size-7 shrink-0 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: themeColorCss(colors.sage) }}
                aria-hidden="true"
              />
            </div>
            <span className="min-w-0 text-sm font-semibold leading-snug text-foreground">
              {t(`adminCommunity.themes.${preset}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
