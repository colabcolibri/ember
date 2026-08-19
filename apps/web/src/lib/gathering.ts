export type GatheringSummary = {
  id: string;
  status: string;
  theme: string | null;
  questions: string[];
  createdAt: string;
  declarationCount: number;
  templateName: string | null;
  circleSize: number | null;
  durationMinutes: number | null;
  slotCount: number;
  slotPreview: string[];
  circleCount: number;
};

export type GatheringDetail = GatheringSummary & {
  slotLabels: Record<string, string>;
};

export function formatGatheringDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function gatheringTitle(gathering: Pick<GatheringSummary, 'theme'>, fallback: string): string {
  return gathering.theme?.trim() || fallback;
}
