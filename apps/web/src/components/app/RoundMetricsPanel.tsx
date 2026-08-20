import { useTranslation } from 'react-i18next';
import { AppBadge } from './AppBadge.js';
import { AppCard } from './AppCard.js';

export type RoundMetricsData = {
  newPairs: number;
  noShow: {
    invited: number;
    responded: number;
    yes: number;
    no: number;
    rate: number | null;
  };
  diversity: {
    editionYears: number[];
    languages: string[];
    countries: string[];
  };
  exceptions: {
    unmatched: number;
  };
};

export type RoundMetricsResponse = {
  roundId: string;
  metrics: RoundMetricsData;
  previous: {
    roundId: string;
    metrics: RoundMetricsData;
    delta: {
      newPairs: number;
      noShowRate: number | null;
    };
  } | null;
};

type RoundMetricsPanelProps = {
  data: RoundMetricsResponse;
};

function formatDelta(value: number, suffix = ''): string {
  if (value === 0) return '0';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${suffix}`;
}

function formatRateDelta(value: number | null): string | null {
  if (value === null) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value * 100)} pp`;
}

function formatPercent(rate: number | null): string {
  if (rate === null) return '—';
  return `${Math.round(rate * 100)}%`;
}

export function RoundMetricsPanel({ data }: RoundMetricsPanelProps) {
  const { t } = useTranslation();
  const { metrics, previous } = data;

  const statCards = [
    {
      key: 'newPairs',
      label: t('facilitator.metrics.newPairs'),
      value: String(metrics.newPairs),
      delta: previous ? formatDelta(previous.delta.newPairs) : null,
    },
    {
      key: 'noShow',
      label: t('facilitator.metrics.noShowRate'),
      value: formatPercent(metrics.noShow.rate),
      delta: previous ? formatRateDelta(previous.delta.noShowRate) : null,
      hint: t('facilitator.metrics.noShowHint', {
        no: metrics.noShow.no,
        responded: metrics.noShow.responded,
      }),
    },
    {
      key: 'unmatched',
      label: t('facilitator.metrics.unmatched'),
      value: String(metrics.exceptions.unmatched),
      delta: previous
        ? formatDelta(metrics.exceptions.unmatched - previous.metrics.exceptions.unmatched)
        : null,
    },
  ];

  return (
    <AppCard title={t('facilitator.metrics.title')} className="min-w-0">
      <p className="mb-4 text-sm text-muted-foreground">{t('facilitator.metrics.subtitle')}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-outline-variant/60 bg-muted/10 px-4 py-3"
          >
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {card.label}
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <p className="text-2xl font-semibold text-foreground">{card.value}</p>
              {card.delta ? (
                <AppBadge variant={card.delta.startsWith('+') ? 'rust' : 'muted'}>{card.delta}</AppBadge>
              ) : null}
            </div>
            {card.hint ? <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p> : null}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/60 px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t('facilitator.metrics.editions')}
          </p>
          <p className="mt-2 text-sm text-foreground">
            {metrics.diversity.editionYears.length > 0
              ? metrics.diversity.editionYears.join(', ')
              : t('facilitator.metrics.noData')}
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant/60 px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t('facilitator.metrics.languages')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {metrics.diversity.languages.length > 0 ? (
              metrics.diversity.languages.map((lang) => (
                <AppBadge key={lang} variant="muted">
                  {lang}
                </AppBadge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t('facilitator.metrics.noData')}</span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant/60 px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t('facilitator.metrics.regions')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {metrics.diversity.countries.length > 0 ? (
              metrics.diversity.countries.map((country) => (
                <AppBadge key={country} variant="muted">
                  {country}
                </AppBadge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t('facilitator.metrics.noData')}</span>
            )}
          </div>
        </div>
      </div>

      {previous ? (
        <p className="mt-4 text-xs text-muted-foreground">
          {t('facilitator.metrics.comparedToPrevious')}
        </p>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">{t('facilitator.metrics.noPrevious')}</p>
      )}
    </AppCard>
  );
}
