import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppButton, AppCard, AppFormField, AppInput } from './index.js';
import { cn } from '@/lib/utils';

export type MeetingTemplate = {
  id: string;
  name: string;
  circleSize: number;
  durationMinutes: number;
};

type FacilitatorTemplatesPanelProps = {
  templates: MeetingTemplate[];
  loading: boolean;
  onCreate: (input: Omit<MeetingTemplate, 'id'>) => Promise<void>;
  onUpdate: (id: string, input: Omit<MeetingTemplate, 'id'>) => Promise<void>;
};

const emptyDraft = {
  name: '',
  circleSize: 3,
  durationMinutes: 30,
};

export function FacilitatorTemplatesPanel({
  templates,
  loading,
  onCreate,
  onUpdate,
}: FacilitatorTemplatesPanelProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'create'>('edit');
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    if (mode === 'create') return;
    const current = templates.find((item) => item.id === selectedId) ?? templates[0] ?? null;
    if (!current) {
      setSelectedId(null);
      setDraft(emptyDraft);
      return;
    }
    setSelectedId(current.id);
    setDraft({
      name: current.name,
      circleSize: current.circleSize,
      durationMinutes: current.durationMinutes,
    });
  }, [templates, selectedId, mode]);

  function startCreate() {
    setMode('create');
    setSelectedId(null);
    setDraft(emptyDraft);
  }

  function selectTemplate(id: string) {
    setMode('edit');
    setSelectedId(id);
    const current = templates.find((item) => item.id === id);
    if (!current) return;
    setDraft({
      name: current.name,
      circleSize: current.circleSize,
      durationMinutes: current.durationMinutes,
    });
  }

  async function handleSubmit() {
    if (mode === 'create') {
      await onCreate(draft);
      setMode('edit');
      return;
    }
    if (!selectedId) return;
    await onUpdate(selectedId, draft);
  }

  const canSave = draft.name.trim().length >= 1;

  return (
    <div className="grid w-full gap-6 lg:grid-cols-12">
      <AppCard title={t('facilitator.templatesListTitle')} className="lg:col-span-5">
        <div className="grid gap-3">
          {templates.length > 0 ? (
            <ul className="grid gap-2">
              {templates.map((template) => (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => selectTemplate(template.id)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                      selectedId === template.id && mode === 'edit'
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/60 bg-background hover:bg-muted/30',
                    )}
                  >
                    <p className="font-medium text-foreground">{template.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('facilitator.templateSummary', {
                        size: template.circleSize,
                        minutes: template.durationMinutes,
                      })}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t('facilitator.noTemplates')}</p>
          )}
          <AppButton type="button" variant="outline" className="w-full" onClick={startCreate}>
            {t('facilitator.createTemplate')}
          </AppButton>
        </div>
      </AppCard>

      <AppCard
        title={mode === 'create' ? t('facilitator.createTemplate') : t('facilitator.editTemplate')}
        className="lg:col-span-7"
      >
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">{t('facilitator.templatesHint')}</p>
          <AppFormField label={t('facilitator.templateName')} htmlFor="template-name">
            <AppInput
              id="template-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t('facilitator.templateNamePlaceholder')}
            />
          </AppFormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AppFormField label={t('facilitator.circleSize')} htmlFor="circle-size">
              <AppInput
                id="circle-size"
                type="number"
                min={3}
                max={5}
                value={draft.circleSize}
                onChange={(e) => setDraft({ ...draft, circleSize: Number(e.target.value) })}
              />
            </AppFormField>
            <AppFormField label={t('facilitator.duration')} htmlFor="duration">
              <AppInput
                id="duration"
                type="number"
                min={15}
                max={90}
                value={draft.durationMinutes}
                onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) })}
              />
            </AppFormField>
          </div>
          <AppButton onClick={handleSubmit} loading={loading} disabled={!canSave} className="w-full sm:w-auto">
            {mode === 'create' ? t('facilitator.createTemplate') : t('facilitator.saveTemplate')}
          </AppButton>
        </div>
      </AppCard>
    </div>
  );
}
