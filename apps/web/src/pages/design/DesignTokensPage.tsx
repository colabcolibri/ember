import { AppCard } from '@/components/app';

const colors = [
  { name: 'background', className: 'bg-background' },
  { name: 'foreground', className: 'bg-foreground' },
  { name: 'card', className: 'bg-card' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'secondary', className: 'bg-secondary' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'destructive', className: 'bg-destructive' },
  { name: 'success', className: 'bg-[hsl(var(--success))]' },
];

const typeScale = [
  { label: 'Eyebrow', className: 'text-[11px] font-extrabold tracking-[0.12em] uppercase text-primary' },
  { label: 'Body', className: 'text-base' },
  { label: 'Lead', className: 'text-lg text-muted-foreground' },
  { label: 'Page title', className: 'font-serif text-4xl font-medium' },
];

export function DesignTokensPage() {
  return (
    <div className="grid gap-6">
      <AppCard title="Colors" description="Semantic tokens via Tailwind">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {colors.map((color) => (
            <div key={color.name} className="space-y-2">
              <div className={`h-16 rounded-xl border ${color.className}`} />
              <p className="text-sm font-medium">{color.name}</p>
            </div>
          ))}
        </div>
      </AppCard>

      <AppCard title="Typography" description="Inter + Georgia">
        <div className="grid gap-4">
          {typeScale.map((item) => (
            <div key={item.label} className="border-b border-border/60 pb-4 last:border-0">
              <p className="mb-1 text-xs text-muted-foreground">{item.label}</p>
              <p className={item.className}>Encontros pequenos, com intenção</p>
            </div>
          ))}
        </div>
      </AppCard>

      <AppCard title="Spacing" description="Tailwind 4px base">
        <div className="flex flex-wrap items-end gap-4">
          {[2, 4, 6, 8, 10, 12].map((n) => (
            <div key={n} className="text-center">
              <div className={`mb-2 bg-primary/20`} style={{ width: `${n * 4}px`, height: `${n * 4}px` }} />
              <p className="text-xs text-muted-foreground">{n}</p>
            </div>
          ))}
        </div>
      </AppCard>
    </div>
  );
}
