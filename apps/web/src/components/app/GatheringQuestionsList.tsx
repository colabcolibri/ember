type GatheringQuestionsListProps = {
  label: string;
  questions: string[];
};

export function GatheringQuestionsList({ label, questions }: GatheringQuestionsListProps) {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <ol className="grid gap-3">
        {questions.map((question, index) => (
          <li
            key={`${index}-${question}`}
            className="flex gap-3.5 rounded-2xl border border-outline-variant/35 bg-background p-4 sm:gap-4 sm:p-5"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-serif text-sm font-bold text-primary sm:size-9 sm:text-base"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <p className="min-w-0 flex-1 pt-0.5 text-base font-semibold leading-relaxed text-foreground sm:text-lg">
              {question}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
