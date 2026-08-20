import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  deriveGatheringCycleSteps,
  type GatheringCycleStepId,
  type GatheringMatchProgress,
  type StepVisualState,
} from '@/lib/gathering-cycle.js';

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
    return 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]';
  }
  if (state === 'current') {
    return 'border-primary bg-primary/10 text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]';
  }
  return 'border-outline-variant/50 bg-background text-muted-foreground';
}

export function GatheringCycleStepper({ status, match, className }: GatheringCycleStepperProps) {
  const { t } = useTranslation();
  const steps = deriveGatheringCycleSteps(status, match);

  return (
    <nav
      aria-label={t('facilitator.cycle.title')}
      className={cn(
        'rounded-[28px] border border-outline-variant/25 bg-paper p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="mb-4 space-y-1">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {t('facilitator.cycle.title')}
        </p>
        <p className="text-sm text-muted-foreground">{t('facilitator.cycle.subtitle')}</p>
      </div>

      <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
        {steps.map((step, index) => {
          const label = t(`facilitator.cycle.steps.${step.id}`);
          const hint =
            step.state === 'current' ? t(`facilitator.cycle.hints.${step.id}`, { defaultValue: '' }) : '';

          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-center">
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-start gap-3 rounded-2xl border px-3 py-3 transition-colors',
                  step.state === 'current'
                    ? 'border-primary/25 bg-primary/5'
                    : 'border-transparent bg-transparent',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                    stepCircleClass(step.state),
                  )}
                  aria-hidden="true"
                >
                  {step.state === 'complete' ? (
                    <span className="material-symbols-outlined text-base leading-none">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-base leading-none">
                      {STEP_ICONS[step.id]}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {label}
                  </p>
                  {hint ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
                  {step.state === 'complete' ? (
                    <p className="mt-0.5 text-xs font-medium text-[hsl(var(--success))]">
                      {t('facilitator.cycle.done')}
                    </p>
                  ) : null}
                </div>
              </div>

              {index < steps.length - 1 ? (
                <div
                  className="flex items-center justify-center px-1 py-1 lg:px-3 lg:py-0"
                  aria-hidden="true"
                >
                  <ChevronRight className="hidden size-5 shrink-0 text-primary/35 lg:block" />
                  <span className="material-symbols-outlined text-primary/35 lg:hidden">south</span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
