import type { CommunityTheme, CommunityThemePreset } from '@ember/domain/schemas/community-branding';

export type CommunityThemeColors = {
  primary: string;
  accent: string;
  sage: string;
};

export const COMMUNITY_THEME_PRESETS: Record<CommunityThemePreset, CommunityThemeColors> = {
  ember: {
    primary: '16 58% 44%',
    accent: '16 45% 55%',
    sage: '140 16% 36%',
  },
  warm: {
    primary: '24 70% 46%',
    accent: '28 55% 58%',
    sage: '130 18% 38%',
  },
  forest: {
    primary: '140 22% 32%',
    accent: '140 16% 42%',
    sage: '150 20% 30%',
  },
  ocean: {
    primary: '198 55% 38%',
    accent: '195 45% 52%',
    sage: '170 22% 36%',
  },
  dusk: {
    primary: '260 28% 42%',
    accent: '270 22% 55%',
    sage: '150 14% 38%',
  },
  clay: {
    primary: '18 42% 42%',
    accent: '22 35% 54%',
    sage: '85 16% 36%',
  },
  slate: {
    primary: '215 18% 38%',
    accent: '210 14% 50%',
    sage: '160 12% 40%',
  },
  rose: {
    primary: '350 45% 48%',
    accent: '355 38% 58%',
    sage: '140 18% 38%',
  },
  citrus: {
    primary: '42 78% 48%',
    accent: '38 65% 58%',
    sage: '130 20% 36%',
  },
  indigo: {
    primary: '232 42% 44%',
    accent: '228 32% 56%',
    sage: '145 16% 38%',
  },
  sand: {
    primary: '32 28% 46%',
    accent: '35 22% 58%',
    sage: '120 14% 40%',
  },
  moss: {
    primary: '105 22% 34%',
    accent: '98 18% 44%',
    sage: '130 18% 32%',
  },
  berry: {
    primary: '320 38% 42%',
    accent: '315 30% 52%',
    sage: '140 14% 36%',
  },
};

export const COMMUNITY_THEME_PRESET_IDS = Object.keys(
  COMMUNITY_THEME_PRESETS,
) as CommunityThemePreset[];

export function themeColorCss(value: string): string {
  return `hsl(${value})`;
}

export function getCommunityThemeColors(
  preset: CommunityThemePreset | undefined,
): CommunityThemeColors {
  return COMMUNITY_THEME_PRESETS[preset ?? 'ember'] ?? COMMUNITY_THEME_PRESETS.ember;
}

export function applyCommunityTheme(
  theme: CommunityTheme | undefined,
  target: HTMLElement = document.documentElement,
) {
  const preset = theme?.preset ?? 'ember';
  const colors = getCommunityThemeColors(preset);

  target.style.setProperty(
    '--primary',
    theme?.primaryOverride ? hexToHsl(theme.primaryOverride) : colors.primary,
  );
  target.style.setProperty('--accent', colors.accent);
  target.style.setProperty('--success', colors.sage);
  target.dataset.communityTheme = preset;
}

function hexToHsl(hex: string): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
