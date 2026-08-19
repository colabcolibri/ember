import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppAlert,
  AppAlertDialog,
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  AppPage,
  AvailabilityPicker,
  DeclarationTable,
  TrioPreview,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import { cn } from '@/lib/utils';

const FACILITATOR_SLOTS = ['mon-19h', 'tue-19h', 'wed-19h', 'thu-19h', 'sat-10h'] as const;

type Template = {
  id: string;
  name: string;
  circleSize: number;
  durationMinutes: number;
};

type Declaration = {
  userId: string;
  memberLabel: string;
  emailMasked: string;
  slots: string[];
  intention: string;
  languages: string[];
  timezone: string | null;
};

type Trio = {
  memberIds: [string, string, string];
  slot: string;
  score: number;
};

export function FacilitatorPage() {
  const { t } = useTranslation();
  const [template, setTemplate] = useState<Template | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [theme, setTheme] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [trios, setTrios] = useState<Trio[]>([]);
  const [unmatched, setUnmatched] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ template: Template }>('/admin/templates/tpl-gsa-fogo')
      .then((res) => setTemplate(res.template))
      .catch((err) => setError(formatApiError(err, t)))
      .finally(() => setInitialLoading(false));
  }, [t]);

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) return prev.filter((s) => s !== slot);
      if (prev.length >= 5) return prev;
      return [...prev, slot];
    });
  };

  const createRound = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch<{ round: { id: string } }>('/admin/matching-rounds', {
        method: 'POST',
        body: JSON.stringify({
          theme,
          questions: questions.map((q) => q.trim()).filter((q) => q.length >= 3),
          slots: selectedSlots,
          templateId: template?.id,
        }),
      });
      setRoundId(res.round.id);
      setMessage(t('facilitator.roundCreated'));
      await loadDeclarations(res.round.id);
    } catch (e) {
      setError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const loadDeclarations = async (id: string) => {
    const res = await apiFetch<{ items: Declaration[] }>(`/admin/matching-rounds/${id}/declarations`);
    setDeclarations(res.items);
  };

  const runMatch = async () => {
    if (!roundId) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ trios: Trio[]; unmatched: number }>(
        `/admin/matching-rounds/${roundId}/match`,
        { method: 'POST', body: '{}' },
      );
      setTrios(res.trios);
      setUnmatched(res.unmatched);
      setMessage(t('facilitator.matchReady'));
    } catch (e) {
      setError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    if (!roundId || trios.length === 0) return;
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/admin/matching-rounds/${roundId}/publish`, {
        method: 'POST',
        body: JSON.stringify({ trios }),
      });
      setPublishOpen(false);
      setMessage(t('facilitator.published'));
    } catch (e) {
      setError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!template) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ template: Template }>(`/admin/templates/${template.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: template.name,
          circleSize: template.circleSize,
          durationMinutes: template.durationMinutes,
        }),
      });
      setTemplate(res.template);
      setMessage(t('facilitator.templateSaved'));
    } catch (e) {
      setError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <AppPage title={t('facilitator.title')} lead={t('facilitator.subtitle')}>
        <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      </AppPage>
    );
  }

  return (
    <AppPage title={t('facilitator.title')} lead={t('facilitator.subtitle')}>

      <div className="grid w-full gap-8 lg:grid-cols-12">
        {template ? (
          <AppCard title={t('facilitator.template')} className="lg:col-span-4">
            <div className="grid gap-4">
              <AppFormField label={t('facilitator.templateName')} htmlFor="template-name">
                <AppInput
                  id="template-name"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                />
              </AppFormField>
              <AppFormField label={t('facilitator.circleSize')} htmlFor="circle-size">
                <AppInput
                  id="circle-size"
                  type="number"
                  min={3}
                  max={5}
                  value={template.circleSize}
                  onChange={(e) =>
                    setTemplate({ ...template, circleSize: Number(e.target.value) })
                  }
                />
              </AppFormField>
              <AppFormField label={t('facilitator.duration')} htmlFor="duration">
                <AppInput
                  id="duration"
                  type="number"
                  min={15}
                  max={90}
                  value={template.durationMinutes}
                  onChange={(e) =>
                    setTemplate({ ...template, durationMinutes: Number(e.target.value) })
                  }
                />
              </AppFormField>
              <AppButton onClick={saveTemplate} loading={loading} variant="outline" className="w-full">
                {t('facilitator.saveTemplate')}
              </AppButton>
            </div>
          </AppCard>
        ) : null}

        <AppCard
          title={t('facilitator.newRound')}
          className={cn(template ? 'lg:col-span-8' : 'lg:col-span-12')}
        >
          <div className="grid gap-4">
            <AppFormField label={t('facilitator.theme')} htmlFor="theme">
              <AppInput
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder={t('facilitator.themePlaceholder')}
                required
                minLength={3}
              />
            </AppFormField>

            <AppFormField label={t('facilitator.questions')}>
              <div className="grid gap-3">
                {questions.map((q, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      className="min-h-20 min-w-0 flex-1 rounded-xl border border-outline-variant/60 bg-background px-4 py-3 text-sm focus:border-primary focus:ring-primary/20 focus:outline-none"
                      value={q}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((item, i) => (i === index ? e.target.value : item)),
                        )
                      }
                      rows={2}
                      placeholder={t('facilitator.questionPlaceholder', { n: index + 1 })}
                    />
                    {questions.length > 1 ? (
                      <AppButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </AppButton>
                    ) : null}
                  </div>
                ))}
                {questions.length < 8 ? (
                  <AppButton
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setQuestions((prev) => [...prev, ''])}
                  >
                    {t('facilitator.addQuestion')}
                  </AppButton>
                ) : null}
              </div>
            </AppFormField>

            <AppFormField label={t('facilitator.pickSlots')}>
              <AvailabilityPicker
                slots={[...FACILITATOR_SLOTS]}
                selected={selectedSlots}
                onToggle={toggleSlot}
                label={(slot) => t(`facilitator.slots.${slot}`)}
              />
            </AppFormField>
            <AppButton
              onClick={createRound}
              loading={loading}
              disabled={
                theme.trim().length < 3 ||
                questions.filter((q) => q.trim().length >= 3).length < 1 ||
                selectedSlots.length !== 5
              }
              className="w-full sm:w-auto"
            >
              {t('facilitator.createRound')}
            </AppButton>
          </div>
        </AppCard>
      </div>

      {roundId ? (
        <div className="grid w-full gap-8 lg:grid-cols-12">
          <AppCard
            title={t('facilitator.declarations')}
            className={cn(trios.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12')}
          >
            <DeclarationTable items={declarations} emptyMessage={t('facilitator.noDeclarations')} />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <AppButton variant="outline" onClick={() => loadDeclarations(roundId)} loading={loading}>
                {t('facilitator.refresh')}
              </AppButton>
              <AppButton onClick={runMatch} loading={loading} disabled={declarations.length < 3}>
                {t('facilitator.runMatch')}
              </AppButton>
            </div>
          </AppCard>

          {trios.length > 0 ? (
            <AppCard title={t('facilitator.preview')} className="lg:col-span-5">
              <TrioPreview
                trios={trios}
                unmatched={unmatched}
                unmatchedLabel={t('facilitator.unmatched', { count: unmatched })}
              />
              <AppButton
                className="mt-4 w-full sm:w-auto"
                onClick={() => setPublishOpen(true)}
                loading={loading}
              >
                {t('facilitator.publish')}
              </AppButton>
            </AppCard>
          ) : null}
        </div>
      ) : null}

      <AppAlertDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={t('facilitator.publish')}
        description={t('facilitator.matchReady')}
        variant="destructive"
        body={t('facilitator.unmatched', { count: unmatched })}
        cancelLabel={t('facilitator.cancel')}
        confirmLabel={t('facilitator.publish')}
        onConfirm={publish}
        loading={loading}
      />

      {message ? <AppAlert variant="success">{message}</AppAlert> : null}
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}
    </AppPage>
  );
}
