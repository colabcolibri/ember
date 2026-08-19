import { Link } from 'react-router-dom';
import { AppCard } from '@/components/app';

const sections = [
  { to: '/design/tokens', title: 'Tokens', desc: 'Cores, tipografia e spacing do 09.' },
  { to: '/design/components', title: 'Components', desc: 'Templates App* com variantes e estados.' },
  { to: '/design/patterns', title: 'Patterns', desc: 'Shell, form, list, detail e empty state.' },
];

export function DesignIndexPage() {
  return (
    <div className="grid gap-4">
      <AppCard title="Ember design catalog" description="Stack: ts-shadcn · light only · dev only">
        <p className="text-sm text-muted-foreground">
          Contrato visual em <code>docs/09_design_system.md</code>. Showcase importa apenas componentes
          compostos de <code>components/app/</code>.
        </p>
      </AppCard>
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.to} to={section.to} className="block">
            <AppCard title={section.title} description={section.desc} interactive />
          </Link>
        ))}
      </div>
    </div>
  );
}
