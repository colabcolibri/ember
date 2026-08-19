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

export function DeclarationTable({ items, emptyMessage, slotLabels = {} }: DeclarationTableProps) {
  const { t, i18n } = useTranslation();

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
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
              <TableCell className="max-w-[14rem] text-sm leading-relaxed">
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
  );
}
