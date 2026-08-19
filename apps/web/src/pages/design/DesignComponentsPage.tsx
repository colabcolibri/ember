import { useState } from 'react';
import {
  AppAlert,
  AppAlertDialog,
  AppBadge,
  AppBrand,
  AppButton,
  AppCard,
  AppDialog,
  AppEmptyState,
  AppFormField,
  AppInput,
  AppPage,
  AttendancePrompt,
  AvailabilityPicker,
  CircleInviteCard,
  CircleListRow,
  IntentionPicker,
  LanguageChipPicker,
  TimezoneCombobox,
  TrioPreview,
} from '@/components/app';

export function DesignComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [timezone, setTimezone] = useState('America/Sao_Paulo');

  return (
    <AppPage title="Components" lead="Templates App* com variantes e estados.">
      <section id="brand" className="space-y-3">
        <h2 className="font-serif text-2xl">Brand</h2>
        <div className="flex flex-wrap items-center gap-8">
          <AppBrand />
          <AppBrand markOnly={false} />
        </div>
      </section>

      <section id="button" className="space-y-3">
        <h2 className="font-serif text-2xl">Button</h2>
        <div className="flex flex-wrap gap-2">
          <AppButton>Primary</AppButton>
          <AppButton variant="secondary">Secondary</AppButton>
          <AppButton variant="outline">Outline</AppButton>
          <AppButton variant="ghost">Ghost</AppButton>
          <AppButton variant="destructive">Destructive</AppButton>
          <AppButton loading>Loading</AppButton>
        </div>
      </section>

      <section id="card" className="space-y-3">
        <h2 className="font-serif text-2xl">Card</h2>
        <AppCard title="Card title" description="Supporting text">
          Body content
        </AppCard>
      </section>

      <section id="form-field" className="space-y-3">
        <h2 className="font-serif text-2xl">Form field</h2>
        <AppFormField label="Email" htmlFor="demo-email">
          <AppInput id="demo-email" type="email" placeholder="voce@exemplo.com" />
        </AppFormField>
      </section>

      <section id="timezone" className="max-w-md space-y-3">
        <h2 className="font-serif text-2xl">Timezone combobox</h2>
        <AppFormField label="Fuso horário" htmlFor="demo-timezone">
          <TimezoneCombobox id="demo-timezone" value={timezone} onChange={setTimezone} />
        </AppFormField>
      </section>

      <section id="alert" className="space-y-3">
        <h2 className="font-serif text-2xl">Alert</h2>
        <AppAlert variant="success">Presença registrada.</AppAlert>
        <AppAlert variant="error">Código inválido.</AppAlert>
      </section>

      <section id="badge" className="space-y-3">
        <h2 className="font-serif text-2xl">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <AppBadge>Default</AppBadge>
          <AppBadge variant="sage">Confirmed</AppBadge>
          <AppBadge variant="rust">Invited</AppBadge>
        </div>
      </section>

      <section id="dialog" className="space-y-3">
        <h2 className="font-serif text-2xl">Dialog</h2>
        <AppButton onClick={() => setDialogOpen(true)}>Open dialog</AppButton>
        <AppDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Confirmar publicação"
          description="Esta ação envia convites para todos os trios."
          body={<p className="text-sm text-muted-foreground">Revise o preview antes de continuar.</p>}
          footer={
            <>
              <AppButton variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </AppButton>
              <AppButton onClick={() => setDialogOpen(false)}>Publicar</AppButton>
            </>
          }
        />
      </section>

      <section id="alert-dialog" className="space-y-3">
        <h2 className="font-serif text-2xl">Alert dialog</h2>
        <p className="text-sm text-muted-foreground">
          Confirmações destrutivas — não fecha ao clicar fora nem com Escape sem cancelar.
        </p>
        <AppButton variant="destructive" onClick={() => setAlertDialogOpen(true)}>
          Confirmar ação destrutiva
        </AppButton>
        <AppAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          title="Publicar encontros?"
          description="Esta ação envia convites para todos os trios."
          body="Revise o preview antes de continuar."
          cancelLabel="Cancelar"
          confirmLabel="Publicar"
          variant="destructive"
          onConfirm={() => setAlertDialogOpen(false)}
        />
      </section>

      <section id="empty" className="space-y-3">
        <h2 className="font-serif text-2xl">Empty state</h2>
        <AppEmptyState
          title="Nenhum encontro no momento"
          description="Quando um convite for publicado, seu encontro aparecerá aqui."
        />
      </section>

      <section id="availability" className="space-y-3">
        <h2 className="font-serif text-2xl">Availability picker</h2>
        <AvailabilityPicker
          slots={['mon-evening', 'wed-evening']}
          selected={['mon-evening']}
          onToggle={() => undefined}
          label={(s) => s}
        />
      </section>

      <section id="intention" className="space-y-3">
        <h2 className="font-serif text-2xl">Intention picker</h2>
        <IntentionPicker
          value="surprise"
          onChange={() => undefined}
          options={['surprise', 'frontier', 'ease']}
          label={(v) => v}
        />
      </section>

      <section id="languages" className="space-y-3">
        <h2 className="font-serif text-2xl">Language chips</h2>
        <LanguageChipPicker options={['pt', 'en']} selected={['pt']} onToggle={() => undefined} />
      </section>

      <section id="invite" className="space-y-3">
        <h2 className="font-serif text-2xl">Circle invite</h2>
        <CircleInviteCard
          communityName="Ember Community / Comunidade Ember"
          question="O que você precisa ouvir hoje?"
          when="Quarta, 19h"
          status="invited"
        />
        <CircleListRow id="demo" communityName="Ember Community / Comunidade Ember" question="Encontro de abril / April gathering" status="open" />
      </section>

      <section id="attendance" className="space-y-3">
        <h2 className="font-serif text-2xl">Attendance</h2>
        <AttendancePrompt
          title="O encontro aconteceu?"
          subtitle="Ajude a rede a lembrar quem se encontrou."
          yesLabel="Sim"
          noLabel="Não"
          onYes={() => undefined}
          onNo={() => undefined}
        />
      </section>

      <section id="trio" className="space-y-3">
        <h2 className="font-serif text-2xl">Trio preview</h2>
        <TrioPreview
          trios={[{ memberIds: ['u1', 'u2', 'u3'], slot: 'mon-19h', score: 12 }]}
          unmatched={1}
          unmatchedLabel="1 membro sem trio"
        />
      </section>

      <section id="page-header" className="space-y-3">
        <h2 className="font-serif text-2xl">Page header</h2>
        <p className="text-sm text-muted-foreground">
          Use <code>AppPage</code> com props <code>title</code> e <code>lead</code>.
        </p>
      </section>
    </AppPage>
  );
}
