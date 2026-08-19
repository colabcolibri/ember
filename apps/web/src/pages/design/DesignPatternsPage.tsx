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
          <CircleListRow id="1" communityName="Ember Community" question="Pergunta / Question" status="open" />
          <CircleListRow id="2" communityName="Ember Community" question="Outro encontro / Another gathering" />
        </div>
      </AppCard>

      <AppCard title="Detail pattern">
        Convite do encontro com ações primárias empilhadas no mobile.
      </AppCard>

      <AppEmptyState
        title="Nenhuma inscrição aberta"
        description="Volte quando o facilitador abrir um novo convite."
      />
    </AppPage>
  );
}
