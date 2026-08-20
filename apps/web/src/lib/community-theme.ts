import type { CommunityTheme } from '@ember/domain/schemas/community-branding';

const PRESETS: Record<
  NonNullable<CommunityTheme['preset']>,
  { primary: string; accent: string; sage: string }
> = {
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
};

export function applyCommunityTheme(theme: CommunityTheme | undefined, target: HTMLElement = document.documentElement) {
  const preset = theme?.preset ?? 'ember';
  const colors = PRESETS[preset] ?? PRESETS.ember;

  target.style.setProperty('--primary', theme?.primaryOverride ? hexToHsl(theme.primaryOverride) : colors.primary);
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
