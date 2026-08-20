import { z } from 'zod';

export const communityThemePresetSchema = z.enum([
  'ember',
  'warm',
  'forest',
  'ocean',
  'dusk',
  'clay',
  'slate',
  'rose',
  'citrus',
  'indigo',
  'sand',
  'moss',
  'berry',
]);
export type CommunityThemePreset = z.infer<typeof communityThemePresetSchema>;

export const communityThemeSchema = z.object({
  preset: communityThemePresetSchema.default('ember'),
  primaryOverride: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor primária deve ser hex #RRGGBB')
    .nullable()
    .optional(),
});

export type CommunityTheme = z.infer<typeof communityThemeSchema>;

export const communityHeroSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().min(1).max(200),
  logoUrl: z.string().url().max(2048).nullable().optional(),
});

export type CommunityHero = z.infer<typeof communityHeroSchema>;

export const communityBlockSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
});

export type CommunityBlock = z.infer<typeof communityBlockSchema>;

export const communityBrandingInputSchema = z.object({
  hero: communityHeroSchema.partial().optional(),
  introParagraph: z.string().trim().max(4000).nullable().optional(),
  blocks: z.array(communityBlockSchema).max(12).optional(),
  theme: communityThemeSchema.optional(),
});

export type CommunityBrandingInput = z.infer<typeof communityBrandingInputSchema>;

export const communityPublicSettingsSchema = z.object({
  hero: communityHeroSchema.partial().optional(),
  introParagraph: z.string().nullable().optional(),
  blocks: z.array(communityBlockSchema).optional(),
  theme: communityThemeSchema.optional(),
});

export type CommunityPublicSettings = z.infer<typeof communityPublicSettingsSchema>;

export const communityPublicResponseSchema = z.object({
  slug: z.string(),
  name: z.string(),
  settings: communityPublicSettingsSchema,
});

export type CommunityPublicResponse = z.infer<typeof communityPublicResponseSchema>;

export const DEFAULT_COMMUNITY_PUBLIC_SETTINGS: CommunityPublicSettings = {
  hero: {
    title: 'encontros intencionais',
    subtitle: 'infraestrutura silenciosa para comunidades fechadas',
  },
  introParagraph:
    'Ember ajuda grupos a formar círculos pequenos compatíveis com disponibilidade, idioma e intenção — sem feed, sem networking performático.',
  blocks: [
    {
      title: 'Declare quando pode',
      body: 'Informe fusos, idiomas e intenção. O sistema cruza disponibilidade com cuidado.',
    },
    {
      title: 'Receba convites',
      body: 'Círculos de três pessoas, horário claro, link de sala e pergunta comum.',
    },
    {
      title: 'Fortaleça a rede',
      body: 'Novos fios e pontes são priorizados — a tecnologia fica no fundo.',
    },
  ],
  theme: { preset: 'ember' },
};

export function mergeCommunityPublicSettings(
  stored: CommunityPublicSettings | null | undefined,
): CommunityPublicSettings {
  if (!stored) {
    return { ...DEFAULT_COMMUNITY_PUBLIC_SETTINGS };
  }

  return {
    hero: { ...DEFAULT_COMMUNITY_PUBLIC_SETTINGS.hero, ...stored.hero },
    introParagraph: stored.introParagraph ?? DEFAULT_COMMUNITY_PUBLIC_SETTINGS.introParagraph,
    blocks:
      stored.blocks && stored.blocks.length > 0
        ? stored.blocks
        : DEFAULT_COMMUNITY_PUBLIC_SETTINGS.blocks,
    theme: {
      preset:
        stored.theme?.preset ??
        DEFAULT_COMMUNITY_PUBLIC_SETTINGS.theme?.preset ??
        ('ember' as CommunityThemePreset),
      primaryOverride:
        stored.theme?.primaryOverride ?? DEFAULT_COMMUNITY_PUBLIC_SETTINGS.theme?.primaryOverride,
    },
  };
}
