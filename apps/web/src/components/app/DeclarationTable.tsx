import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
};

export function DeclarationTable({ items, emptyMessage }: DeclarationTableProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membro</TableHead>
            <TableHead>Horários</TableHead>
            <TableHead>Intenção</TableHead>
            <TableHead>Idiomas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.userId}>
              <TableCell className="font-medium">{row.memberLabel}</TableCell>
              <TableCell>{row.slots.join(', ')}</TableCell>
              <TableCell>{row.intention}</TableCell>
              <TableCell>{row.languages.join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
