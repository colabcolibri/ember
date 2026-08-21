import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatTimezoneOffset, formatTimezoneShort, parseSlotLabel } from '@/lib/slot-label.js';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { AppBadge } from './AppBadge.js';

export type DeclarationRow = {
  userId: string;
  memberLabel: string;
  emailMasked: string;
  slots: string[];
  intention: string;
  languages: string[];
  timezone: string | null;
  response?: 'attending' | 'declined';
};

type DeclarationTableProps = {
  items: DeclarationRow[];
  emptyMessage: string;
  slotLabels?: Record<string, string>;
};

function resolveSlotWhen(slot: string, labels: Record<string, string>): string {
  const label = labels[slot] ?? slot;
  const { when } = parseSlotLabel(label);
  return when || label;
}

function resolveSlotTimezone(slot: string, labels: Record<string, string>, memberTimezone: string | null): string {
  const label = labels[slot] ?? slot;
  const { timezone } = parseSlotLabel(label);
  return timezone || memberTimezone || '';
}

function DeclarationSlotsList({
  slots,
  slotLabels,
  memberTimezone,
  locale,
  compact = false,
}: {
  slots: string[];
  slotLabels: Record<string, string>;
  memberTimezone: string | null;
  locale: string;
  compact?: boolean;
}) {
  if (slots.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <ul className={cn('flex flex-wrap gap-1.5', compact ? 'min-w-0 max-w-60' : '')}>
      {slots.map((slot) => {
        const when = resolveSlotWhen(slot, slotLabels);
        const timezone = resolveSlotTimezone(slot, slotLabels, memberTimezone);
        const offset = timezone ? formatTimezoneOffset(timezone, locale) : '';

        return (
          <li
            key={slot}
            className="inline-flex max-w-full items-baseline gap-1 rounded-md border border-outline-variant/35 bg-muted/20 px-2 py-0.5 text-xs font-medium leading-snug text-foreground"
          >
            <span className="min-w-0 wrap-break-word">{when}</span>
            {offset ? <span className="shrink-0 text-[11px] text-muted-foreground">{offset}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

function IntentionBadge({ intention }: { intention: string }) {
  if (intention === 'declined') return null;
  const { t } = useTranslation();
  return (
    <AppBadge variant="muted">
      {t(`presence.intentions.${intention}`, { defaultValue: intention })}
    </AppBadge>
  );
}

function ResponseBadge({ response }: { response?: DeclarationRow['response'] }) {
  const { t } = useTranslation();
  if (response === 'declined') {
    return <AppBadge variant="muted">{t('facilitator.declinedPresence')}</AppBadge>;
  }
  return null;
}

function DeclarationCard({
  row,
  slotLabels,
}: {
  row: DeclarationRow;
  slotLabels: Record<string, string>;
}) {
  const { t, i18n } = useTranslation();

  return (
    <article className="space-y-4 rounded-2xl border border-outline-variant/40 bg-background/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{row.memberLabel}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{row.emailMasked}</p>
        </div>
        <div className="shrink-0">
          {row.response === 'declined' ? (
            <ResponseBadge response={row.response} />
          ) : (
            <IntentionBadge intention={row.intention} />
          )}
        </div>
      </div>

      <dl className="grid gap-3 text-sm">
        <div className="min-w-0">
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('facilitator.table.slots')}
          </dt>
          <dd className="mt-2 min-w-0">
            <DeclarationSlotsList
              slots={row.slots}
              slotLabels={slotLabels}
              memberTimezone={row.timezone}
              locale={i18n.language}
            />
          </dd>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('facilitator.table.languages')}
            </dt>
            <dd className="mt-1 font-medium text-foreground">{row.languages.join(', ') || '—'}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('facilitator.table.timezone')}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {row.timezone ? formatTimezoneShort(row.timezone, i18n.language) : '—'}
            </dd>
          </div>
        </div>
      </dl>
    </article>
  );
}

export function DeclarationTable({ items, emptyMessage, slotLabels = {} }: DeclarationTableProps) {
  const { t, i18n } = useTranslation();

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-muted-foreground lg:hidden">
        {t('facilitator.declarationsCount', { count: items.length })}
      </p>

      <div className="grid min-w-0 gap-3 lg:hidden">
        {items.map((row) => (
          <DeclarationCard key={row.userId} row={row} slotLabels={slotLabels} />
        ))}
      </div>

      <div className="hidden min-w-0 rounded-xl border lg:block">
        <Table className="min-w-[640px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">{t('facilitator.table.member')}</TableHead>
              <TableHead className="w-[26%]">{t('facilitator.table.slots')}</TableHead>
              <TableHead className="w-[14%]">{t('facilitator.table.intention')}</TableHead>
              <TableHead className="w-[8%]">{t('facilitator.table.languages')}</TableHead>
              <TableHead className="w-[16%]">{t('facilitator.table.timezone')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.userId} className="align-top">
                <TableCell className="whitespace-normal break-words align-top">
                  <div className="font-semibold text-foreground">{row.memberLabel}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{row.emailMasked}</div>
                </TableCell>
                <TableCell className="whitespace-normal align-top pr-1">
                  <DeclarationSlotsList
                    slots={row.slots}
                    slotLabels={slotLabels}
                    memberTimezone={row.timezone}
                    locale={i18n.language}
                    compact
                  />
                </TableCell>
                <TableCell className="whitespace-normal align-top">
                  {row.response === 'declined' ? (
                    <ResponseBadge response={row.response} />
                  ) : (
                    <IntentionBadge intention={row.intention} />
                  )}
                </TableCell>
                <TableCell className="whitespace-normal align-top px-1 font-medium text-foreground">
                  {row.languages.join(', ') || '—'}
                </TableCell>
                <TableCell className="whitespace-normal wrap-break-word align-top font-medium text-foreground">
                  {row.timezone ? formatTimezoneShort(row.timezone, i18n.language) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
