import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatTimezoneShort } from '@/lib/slot-label.js';
import { AppBadge } from './AppBadge.js';

export type DeclarationRow = {
  userId: string;
  memberLabel: string;
  emailMasked: string;
  slots: string[];
  intention: string;
  languages: string[];
  timezone: string | null;
};

type DeclarationTableProps = {
  items: DeclarationRow[];
  emptyMessage: string;
  slotLabels?: Record<string, string>;
};

function formatSlotList(slots: string[], labels: Record<string, string>): string {
  return slots.map((slot) => labels[slot] ?? slot).join(' · ');
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
    <article className="space-y-3 rounded-xl border border-outline-variant/40 bg-background/50 p-4 sm:hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{row.memberLabel}</p>
          <p className="text-xs text-muted-foreground">{row.emailMasked}</p>
        </div>
        <AppBadge variant="muted" className="shrink-0">
          {t(`presence.intentions.${row.intention}`, { defaultValue: row.intention })}
        </AppBadge>
      </div>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('facilitator.table.slots')}
          </dt>
          <dd className="mt-1 leading-relaxed">{formatSlotList(row.slots, slotLabels)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('facilitator.table.languages')}
          </dt>
          <dd className="mt-1">{row.languages.join(', ') || '—'}</dd>
        </div>
        {row.timezone ? (
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('facilitator.table.timezone')}
            </dt>
            <dd className="mt-1 text-muted-foreground">
              {formatTimezoneShort(row.timezone, i18n.language)}
            </dd>
          </div>
        ) : null}
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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground sm:hidden">
        {t('facilitator.declarationsCount', { count: items.length })}
      </p>

      <div className="grid gap-3 sm:hidden">
        {items.map((row) => (
          <DeclarationCard key={row.userId} row={row} slotLabels={slotLabels} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('facilitator.table.member')}</TableHead>
              <TableHead>{t('facilitator.table.slots')}</TableHead>
              <TableHead>{t('facilitator.table.intention')}</TableHead>
              <TableHead>{t('facilitator.table.languages')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('facilitator.table.timezone')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>
                  <div className="font-medium">{row.memberLabel}</div>
                  <div className="text-xs text-muted-foreground">{row.emailMasked}</div>
                </TableCell>
                <TableCell className="max-w-56 text-sm leading-relaxed">
                  {formatSlotList(row.slots, slotLabels)}
                </TableCell>
                <TableCell>
                  {t(`presence.intentions.${row.intention}`, { defaultValue: row.intention })}
                </TableCell>
                <TableCell>{row.languages.join(', ')}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
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
