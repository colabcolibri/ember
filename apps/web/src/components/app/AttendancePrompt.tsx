import { AppCard } from './AppCard.js';
import { AppButton } from './AppButton.js';

type AttendancePromptProps = {
  title: string;
  subtitle: string;
  yesLabel: string;
  noLabel: string;
  onYes: () => void;
  onNo: () => void;
  loading?: boolean;
};

export function AttendancePrompt({
  title,
  subtitle,
  yesLabel,
  noLabel,
  onYes,
  onNo,
  loading,
}: AttendancePromptProps) {
  return (
    <AppCard title={title} description={subtitle}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <AppButton onClick={onYes} loading={loading} className="w-full sm:w-auto">
          {yesLabel}
        </AppButton>
        <AppButton variant="outline" onClick={onNo} disabled={loading} className="w-full sm:w-auto">
          {noLabel}
        </AppButton>
      </div>
    </AppCard>
  );
}
