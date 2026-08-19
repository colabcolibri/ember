import { AppCard, AppEmptyState, AppFormField, AppInput, AppPageHeader, CircleListRow } from '@/components/app';

export function DesignPatternsPage() {
  return (
    <div className="grid gap-10">
      <section id="shell">
        <AppPageHeader
          eyebrow="pattern"
          title="App shell"
          lead="Nav pill fixa, brand mark, lang switcher e conteúdo contido."
        />
        <AppCard>Shell aplicado em todas as rotas de produto via App.tsx.</AppCard>
      </section>

      <section id="form">
        <AppPageHeader title="Form pattern" lead="Login, perfil e presença." />
        <AppCard>
          <div className="grid gap-4">
            <AppFormField label="Email" htmlFor="pattern-email">
              <AppInput id="pattern-email" type="email" />
            </AppFormField>
          </div>
        </AppCard>
      </section>

      <section id="list">
        <AppPageHeader title="List pattern" lead="Minhas rodas." />
        <div className="grid gap-3">
          <CircleListRow id="1" communityName="GSA" question="Pergunta da rodada" status="open" />
          <CircleListRow id="2" communityName="GSA" question="Outra roda" />
        </div>
      </section>

      <section id="detail">
        <AppPageHeader title="Detail pattern" lead="Convite da roda com ações primárias." />
        <AppCard title="Convite" description="Jitsi + .ics + confirmar">
          Ações empilhadas no mobile; inline no desktop.
        </AppCard>
      </section>

      <section id="empty">
        <AppPageHeader title="Empty pattern" />
        <AppEmptyState
          title="Nenhuma rodada aberta"
          description="Volte quando o facilitador abrir uma nova rodada."
        />
      </section>
    </div>
  );
}
