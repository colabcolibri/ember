import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COMMUNITY_PUBLIC_SETTINGS,
  mergeCommunityPublicSettings,
} from './community-branding.js';

describe('community branding schema', () => {
  it('merges stored settings with defaults', () => {
    const merged = mergeCommunityPublicSettings({
      hero: { title: 'Minha comunidade' },
      blocks: [{ title: 'Um', body: 'Corpo' }],
    });

    expect(merged.hero?.title).toBe('Minha comunidade');
    expect(merged.hero?.subtitle).toBe(DEFAULT_COMMUNITY_PUBLIC_SETTINGS.hero?.subtitle);
    expect(merged.blocks).toHaveLength(1);
    expect(merged.theme?.preset).toBe('ember');
  });
});
