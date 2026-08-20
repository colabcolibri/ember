import type { ProfileInput } from '../schemas/profile.js';

export type ProfileCompletenessField =
  | 'displayName'
  | 'editionYear'
  | 'timezone'
  | 'languages'
  | 'originPlace'
  | 'residencePlace';

export type ProfileCompletenessInput = Partial<ProfileInput> & {
  displayName?: string | null;
  editionYear?: number | null;
  timezone?: string | null;
  languages?: string[] | null;
  originPlace?: ProfileInput['originPlace'] | null;
  residencePlace?: ProfileInput['residencePlace'] | null;
};

const FIELD_LABELS: Record<ProfileCompletenessField, { pt: string; en: string }> = {
  displayName: { pt: 'nome', en: 'name' },
  editionYear: { pt: 'ano da edição', en: 'edition year' },
  timezone: { pt: 'fuso horário', en: 'timezone' },
  languages: { pt: 'idiomas', en: 'languages' },
  originPlace: { pt: 'cidade de origem', en: 'origin city' },
  residencePlace: { pt: 'onde moro hoje', en: 'current residence' },
};

export function profileCompleteness(profile: ProfileCompletenessInput): {
  complete: boolean;
  missing: ProfileCompletenessField[];
} {
  const missing: ProfileCompletenessField[] = [];

  if (!profile.displayName?.trim() || profile.displayName.trim().length < 2) {
    missing.push('displayName');
  }
  if (!profile.editionYear || profile.editionYear < 1990) {
    missing.push('editionYear');
  }
  if (!profile.timezone?.trim()) {
    missing.push('timezone');
  }
  if (!profile.languages?.length) {
    missing.push('languages');
  }
  if (!profile.originPlace) {
    missing.push('originPlace');
  }
  if (!profile.residencePlace) {
    missing.push('residencePlace');
  }

  return { complete: missing.length === 0, missing };
}

export function profileMissingFieldLabel(
  field: ProfileCompletenessField,
  locale: 'pt' | 'en' = 'pt',
): string {
  return FIELD_LABELS[field][locale];
}
