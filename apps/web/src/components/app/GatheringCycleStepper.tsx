import {
  deriveGatheringCycleSteps,
  type GatheringCycleStepId,
  type GatheringMatchProgress,
  type StepVisualState,
} from '@/lib/gathering-cycle.js';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type GatheringCycleStepperProps = {
  status: string;
  match: GatheringMatchProgress;
  className?: string;
};

const STEP_ICONS: Record<GatheringCycleStepId, string> = {
  registrations: 'campaign',
  closed: 'lock',
  matching: 'shuffle',
  published: 'send',
};

function stepCircleClass(state: StepVisualState): string {
  if (state === 'complete') {
    return 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/12 text-[hsl(var(--success))]';
  }
  if (state === 'current') {
    return 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]';
  }
  return 'border-outline-variant/40 bg-background text-muted-foreground';
}

function stepCardClass(state: StepVisualState): string {
  if (state === 'complete') {
    return 'border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5';
  }
  if (state === 'current') {
    return 'border-primary/30 bg-primary/5 ring-1 ring-primary/10';
  }
  return 'border-outline-variant/30 bg-background/40';
}

type StepContentProps = {
  state: StepVisualState;
  label: string;
  hint: string;
  doneLabel: string;
  align?: 'left' | 'center';
};

function StepIcon({ stepId, state }: { stepId: GatheringCycleStepId; state: StepVisualState }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full border-2',
        stepCircleClass(state),
      )}
      aria-hidden="true"
    >
      {state === 'complete' ? (
        <span className="material-symbols-outlined text-lg leading-none">check</span>
      ) : (
        <span className="material-symbols-outlined text-lg leading-none">{STEP_ICONS[stepId]}</span>
      )}
    </span>
  );
}

function StepContent({ state, label, hint, doneLabel, align = 'left' }: StepContentProps) {
  return (
    <div className={cn('min-w-0 flex-1', align === 'center' && 'text-center')}>
      <p
        className={cn(
          'text-sm font-semibold leading-snug',
          state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {label}
      </p>
      {state === 'current' && hint ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      {state === 'complete' ? (
        <p className="mt-1 text-xs font-medium text-success">{doneLabel}</p>
      ) : null}
    </div>
  );
}

function StepCard({
  stepId,
  state,
  label,
  hint,
  doneLabel,
  align = 'left',
}: {
  stepId: GatheringCycleStepId;
  state: StepVisualState;
  label: string;
  hint: string;
  doneLabel: string;
  align?: 'left' | 'center';
}) {
  return (
    <article
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-2xl border px-3 py-4 sm:px-4',
        stepCardClass(state),
      )}
    >
      <StepIcon stepId={stepId} state={state} />
      <StepContent state={state} label={label} hint={hint} doneLabel={doneLabel} align={align} />
    </article>
  );
}

export function GatheringCycleStepper({ status, match, className }: GatheringCycleStepperProps) {
  const { t } = useTranslation();
  const steps = deriveGatheringCycleSteps(status, match);
  const doneLabel = t('facilitator.cycle.done');

  return (
    <nav
      aria-label={t('facilitator.cycle.title')}
      className={cn(
        'min-w-0 rounded-card border border-outline-variant/25 bg-paper p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="mb-5 space-y-1">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {t('facilitator.cycle.title')}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('facilitator.cycle.subtitle')}</p>
      </div>

      <ol className="flex flex-col gap-3 md:hidden">
        {steps.map((step, index) => {
          const label = t(`facilitator.cycle.steps.${step.id}`);
          const hint =
            step.state === 'current'
              ? t(`facilitator.cycle.hints.${step.id}`, { defaultValue: '' })
              : '';

          return (
            <li key={step.id} aria-current={step.state === 'current' ? 'step' : undefined} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepIcon stepId={step.id} state={step.state} />
                {index < steps.length - 1 ? (
                  <div
                    className={cn(
                      'my-1 w-0.5 min-h-6 flex-1 rounded-full',
                      step.state === 'complete' ? 'bg-[hsl(var(--success))]/40' : 'bg-outline-variant/40',
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <StepCard
                stepId={step.id}
                state={step.state}
                label={label}
                hint={hint}
                doneLabel={doneLabel}
              />
            </li>
          );
        })}
      </ol>

      <ol className="hidden min-w-0 gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => {
          const label = t(`facilitator.cycle.steps.${step.id}`);
          const hint =
            step.state === 'current'
              ? t(`facilitator.cycle.hints.${step.id}`, { defaultValue: '' })
              : '';

          return (
            <li
              key={step.id}
              aria-current={step.state === 'current' ? 'step' : undefined}
              className="min-w-0"
            >
              <StepCard
                stepId={step.id}
                state={step.state}
                label={label}
                hint={hint}
                doneLabel={doneLabel}
                align="center"
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
