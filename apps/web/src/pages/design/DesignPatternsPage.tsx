import { AppCard, AppEmptyState, AppFormField, AppInput, AppPage, CircleListRow } from '@/components/app';

export function DesignPatternsPage() {
  return (
    <AppPage title="Layout do produto" lead="AppLayout → AppShell (max-w-ember-xl único) → AppPage.">
      <AppCard title="App shell">
        Um único container com max-w para nav e conteúdo. Rotas definem a largura via handle.
      </AppCard>

      <AppCard title="Form pattern">
        <AppFormField label="Email" htmlFor="pattern-email">
          <AppInput id="pattern-email" type="email" />
        </AppFormField>
      </AppCard>

      <AppCard title="List pattern">
        <div className="grid gap-3">
          <CircleListRow id="1" communityName="GSA" question="Pergunta da rodada" status="open" />
          <CircleListRow id="2" communityName="GSA" question="Outra roda" />
        </div>
      </AppCard>

      <AppCard title="Detail pattern">
        Convite da roda com ações primárias empilhadas no mobile.
      </AppCard>

      <AppEmptyState
        title="Nenhuma rodada aberta"
        description="Volte quando o facilitador abrir uma nova rodada."
      />
    </AppPage>
  );
}
