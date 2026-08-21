import { AppCard, AppPage } from '@/components/app';

export function DesignPatternsPage() {
  return (
    <AppPage title="Layout do produto" lead="Sidebar shadcn overlay + conteúdo full-width até o fim.">
      <AppCard title="App sidebar">
        <div className="grid gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <code className="text-foreground">AppSidebarShell</code> (shadcn) + template{' '}
            <code className="text-foreground">AppSidebar</code>: barra flutuante por cima do conteúdo (offcanvas) e
            coluna principal em 100% da largura.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Participação — presença e meus encontros.</li>
            <li>Facilitação — encontros e painel (facilitador/admin).</li>
            <li>Organização — identidade e membros (org admin).</li>
            <li>Conta — perfil e sair no rodapé.</li>
          </ul>
        </div>
      </AppCard>

      <AppCard title="App shell">
        Com sidebar, o conteúdo ocupa 100% da largura; a barra flutua por cima (offcanvas). Login continua com nav
        horizontal compacta.
      </AppCard>

      <AppCard title="Form pattern">
        Campos empilhados no mobile; duas colunas a partir de <code className="text-foreground">sm</code>.
      </AppCard>

      <AppCard title="List pattern">
        Cards de lista com hierarquia clara: data, chips e ação primária separados.
      </AppCard>

      <AppCard title="Detail pattern">
        Convite do encontro com ações primárias empilhadas no mobile.
      </AppCard>
    </AppPage>
  );
}
