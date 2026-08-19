import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  RoundSlotBuilder,
  type DraftRoundSlot,
  type MeetingTemplate,
} from './index.js';
import { isMockMode, MOCK_DEMO_ROUND_DRAFT } from '@/lib/mock-mode.js';

type FacilitatorRoundPanelProps = {
  templates: MeetingTemplate[];
  loading: boolean;
  onCreateRound: (input: {
    templateId: string;
    theme: string;
    questions: string[];
    slots: Array<{ timezone: string; localDate: string; localTime: string }>;
  }) => Promise<void>;
};

export function FacilitatorRoundPanel({ templates, loading, onCreateRound }: FacilitatorRoundPanelProps) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState('');
  const [theme, setTheme] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [draftSlots, setDraftSlots] = useState<DraftRoundSlot[]>([]);

  useEffect(() => {
    if (!isMockMode || templates.length === 0) return;

    const template =
      templates.find((item) => item.id === MOCK_DEMO_ROUND_DRAFT.templateId) ?? templates[0]!;

    setTemplateId(template.id);
    setTheme(MOCK_DEMO_ROUND_DRAFT.theme);
    setQuestions([...MOCK_DEMO_ROUND_DRAFT.questions]);
    setDraftSlots(
      MOCK_DEMO_ROUND_DRAFT.slots.map((slot) => ({
        ref: crypto.randomUUID(),
        timezone: slot.timezone,
        localDate: slot.localDate,
        localTime: slot.localTime,
        officialLabel: slot.officialLabel,
      })),
    );
  }, [templates]);

  const selectedTemplate = templates.find((item) => item.id === templateId) ?? null;

  const addSlot = (slot: {
    timezone: string;
    localDate: string;
    localTime: string;
    officialLabel: string;
  }) => {
    setDraftSlots((prev) => [
      ...prev,
      {
        ref: crypto.randomUUID(),
        timezone: slot.timezone,
        localDate: slot.localDate,
        localTime: slot.localTime,
        officialLabel: slot.officialLabel,
      },
    ]);
  };

  const removeSlot = (ref: string) => {
    setDraftSlots((prev) => prev.filter((slot) => slot.ref !== ref));
  };

  async function handleCreateRound() {
    if (!templateId) return;
    await onCreateRound({
      templateId,
      theme,
      questions: questions.map((q) => q.trim()).filter((q) => q.length >= 3),
      slots: draftSlots.map((slot) => ({
        timezone: slot.timezone,
        localDate: slot.localDate,
        localTime: slot.localTime,
      })),
    });
  }

  const canCreate =
    Boolean(templateId) &&
    theme.trim().length >= 3 &&
    questions.filter((q) => q.trim().length >= 3).length >= 1 &&
    draftSlots.length >= 1;

  return (
    <AppCard title={t('facilitator.newRound')}>
      <div className="grid gap-4">
        <AppFormField label={t('facilitator.selectTemplate')} htmlFor="round-template">
          {templates.length > 0 ? (
            <select
              id="round-template"
              className="flex h-11 w-full min-w-0 rounded-xl border border-outline-variant/60 bg-background px-3 py-2 text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">{t('facilitator.selectTemplatePlaceholder')}</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground">{t('facilitator.needTemplateFirst')}</p>
          )}
        </AppFormField>

        {selectedTemplate ? (
          <p className="rounded-xl border border-outline-variant/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {t('facilitator.templateSummary', {
              size: selectedTemplate.circleSize,
              minutes: selectedTemplate.durationMinutes,
            })}
          </p>
        ) : null}

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
                    setQuestions((prev) => prev.map((item, i) => (i === index ? e.target.value : item)))
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
          <RoundSlotBuilder slots={draftSlots} onAdd={addSlot} onRemove={removeSlot} />
        </AppFormField>

        <AppButton
          onClick={handleCreateRound}
          loading={loading}
          disabled={!canCreate}
          className="w-full sm:w-auto"
        >
          {t('facilitator.createRound')}
        </AppButton>
      </div>
    </AppCard>
  );
}
