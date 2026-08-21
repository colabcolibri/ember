import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GatheringDetail } from '@/lib/gathering.js';
import {
  AppButton,
  AppDialog,
  AppFormField,
  AppInput,
  RoundSlotBuilder,
  type DraftRoundSlot,
} from './index.js';
import { ScrollArea } from '@/components/ui/scroll-area.js';

type GatheringEditDialogProps = {
  gathering: GatheringDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSave: (input: {
    theme: string;
    questions: string[];
    slots: Array<{ timezone: string; localDate: string; localTime: string }>;
  }) => Promise<void>;
};

export function GatheringEditDialog({
  gathering,
  open,
  onOpenChange,
  loading,
  onSave,
}: GatheringEditDialogProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(gathering.theme ?? '');
  const [questions, setQuestions] = useState<string[]>(gathering.questions.length ? gathering.questions : ['']);
  const [draftSlots, setDraftSlots] = useState<DraftRoundSlot[]>([]);

  useEffect(() => {
    if (!open) return;
    setTheme(gathering.theme ?? '');
    setQuestions(gathering.questions.length ? [...gathering.questions] : ['']);
    setDraftSlots(
      Object.entries(gathering.slotLabels).map(([ref, officialLabel], index) => ({
        ref,
        timezone: 'America/Sao_Paulo',
        localDate: '',
        localTime: '',
        officialLabel: officialLabel || gathering.slotPreview[index] || ref,
      })),
    );
  }, [open, gathering]);

  const addQuestion = () => setQuestions((prev) => [...prev, '']);
  const updateQuestion = (index: number, value: string) => {
    setQuestions((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };
  const removeQuestion = (index: number) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

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

  async function handleSave() {
    const trimmedQuestions = questions.map((item) => item.trim()).filter(Boolean);
    if (!theme.trim() || trimmedQuestions.length === 0 || draftSlots.length === 0) return;

    await onSave({
      theme: theme.trim(),
      questions: trimmedQuestions,
      slots: draftSlots.map((slot) => ({
        timezone: slot.timezone,
        localDate: slot.localDate,
        localTime: slot.localTime,
      })),
    });
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('facilitator.editGathering')}
      description={t('facilitator.editGatheringHint')}
      size="lg"
      body={
        <ScrollArea className="max-h-[70vh]">
          <div className="grid gap-4 pr-3">
          <AppFormField label={t('facilitator.theme')}>
            <AppInput value={theme} onChange={(event) => setTheme(event.target.value)} />
          </AppFormField>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t('presence.questionsLabel')}</p>
            {questions.map((question, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row">
                <AppInput
                  value={question}
                  onChange={(event) => updateQuestion(index, event.target.value)}
                  className="flex-1"
                />
                <AppButton type="button" variant="ghost" onClick={() => removeQuestion(index)}>
                  {t('facilitator.removeQuestion')}
                </AppButton>
              </div>
            ))}
            <AppButton type="button" variant="outline" onClick={addQuestion}>
              {t('facilitator.addQuestion')}
            </AppButton>
          </div>

          <RoundSlotBuilder slots={draftSlots} onAdd={addSlot} onRemove={removeSlot} />
          </div>
        </ScrollArea>
      }
      footer={
        <>
          <AppButton type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('facilitator.cancel')}
          </AppButton>
          <AppButton type="button" loading={loading} onClick={() => void handleSave()}>
            {t('facilitator.saveGathering')}
          </AppButton>
        </>
      }
    />
  );
}
