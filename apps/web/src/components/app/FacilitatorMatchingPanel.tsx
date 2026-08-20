import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppAlertDialog,
  AppButton,
  AppCard,
  GroupPreview,
  UnmatchedPanel,
  buildUnmatchedRows,
  type DeclarationRow,
  type MatchGroupRow,
  type UnmatchedMemberRow,
  type UnmatchedReason,
} from './index.js';
import { apiFetch } from '@/lib/api.js';
import { formatApiError } from '@/lib/api-errors.js';
import { showError, showSuccess } from '@/lib/app-toast.js';
import { cn } from '@/lib/utils';

type EmailFailure = {
  circleId: string;
  userId: string;
  email: string;
  error: string;
};

type FacilitatorMatchingPanelProps = {
  roundId: string;
  roundStatus: string;
  slotLabels: Record<string, string>;
  declarations: DeclarationRow[];
  onReloadDeclarations?: () => Promise<DeclarationRow[] | void>;
  onPublished?: () => Promise<void> | void;
  onMatchStateChange?: (progress: { hasDraft: boolean; groupCount: number }) => void;
  className?: string;
};

export function FacilitatorMatchingPanel({
  roundId,
  roundStatus,
  slotLabels,
  declarations,
  onReloadDeclarations,
  onPublished,
  onMatchStateChange,
  className,
}: FacilitatorMatchingPanelProps) {
  const { t, i18n } = useTranslation();
  const [groups, setGroups] = useState<MatchGroupRow[]>([]);
  const [unmatched, setUnmatched] = useState(0);
  const [unmatchedMembers, setUnmatchedMembers] = useState<UnmatchedMemberRow[]>([]);
  const [emailFailures, setEmailFailures] = useState<EmailFailure[]>([]);
  const [hasAutoDraft, setHasAutoDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const canMatch = roundStatus === 'closed';
  const canPublish = canMatch && groups.length > 0;

  useEffect(() => {
    onMatchStateChange?.({ hasDraft: hasAutoDraft, groupCount: groups.length });
  }, [hasAutoDraft, groups.length, onMatchStateChange]);

  useEffect(() => {
    if (!roundId || roundStatus !== 'closed') return;
    void loadAutoDraft(declarations).catch(() => undefined);
  }, [roundId, roundStatus]);

  const applyMatchResult = (
    result: {
      groups?: MatchGroupRow[];
      trios?: MatchGroupRow[];
      unmatched: number;
      unmatchedMembers?: Array<{ userId: string; reasons: UnmatchedReason[] }>;
    },
    declarationItems: DeclarationRow[],
  ) => {
    const nextGroups = result.groups ?? result.trios ?? [];
    setGroups(nextGroups);
    setUnmatched(result.unmatched);
    setUnmatchedMembers(buildUnmatchedRows(result.unmatchedMembers ?? [], declarationItems));
  };

  const loadAutoDraft = async (declarationItems: DeclarationRow[]) => {
    const res = await apiFetch<{
      draft: {
        groups?: MatchGroupRow[];
        trios?: MatchGroupRow[];
        unmatched: number;
        unmatchedMembers: Array<{ userId: string; reasons: UnmatchedReason[] }>;
      } | null;
    }>(`/admin/matching-rounds/${roundId}/auto-match`);
    if (!res.draft) {
      setHasAutoDraft(false);
      return;
    }
    setHasAutoDraft(true);
    applyMatchResult(res.draft, declarationItems);
  };

  const ensureDraftLoaded = async () => {
    if (groups.length > 0 || hasAutoDraft) return;
    await loadAutoDraft(declarations);
  };

  const runAutoMatch = async () => {
    setLoading(true);
    try {
      const items = declarations.length
        ? declarations
        : ((await onReloadDeclarations?.()) as DeclarationRow[] | undefined) ?? declarations;
      const res = await apiFetch<{
        groups?: MatchGroupRow[];
        trios?: MatchGroupRow[];
        unmatched: number;
        unmatchedMembers: Array<{ userId: string; reasons: UnmatchedReason[] }>;
      }>(`/admin/matching-rounds/${roundId}/auto-match`, { method: 'POST', body: '{}' });
      setHasAutoDraft(true);
      applyMatchResult(res, items);
      showSuccess(t('facilitator.autoMatchReady'));
    } catch (error) {
      showError(formatApiError(error, t));
    } finally {
      setLoading(false);
    }
  };

  const undoAutoMatch = async () => {
    setLoading(true);
    try {
      await apiFetch(`/admin/matching-rounds/${roundId}/auto-match`, { method: 'DELETE' });
      setGroups([]);
      setUnmatched(0);
      setUnmatchedMembers([]);
      setHasAutoDraft(false);
      showSuccess(t('facilitator.autoMatchUndone'));
    } catch (error) {
      showError(formatApiError(error, t));
    } finally {
      setLoading(false);
    }
  };

  const runMatch = async () => {
    setLoading(true);
    try {
      const items = declarations.length
        ? declarations
        : ((await onReloadDeclarations?.()) as DeclarationRow[] | undefined) ?? declarations;
      const res = await apiFetch<{
        groups?: MatchGroupRow[];
        trios?: MatchGroupRow[];
        unmatched: number;
        unmatchedMembers: Array<{ userId: string; reasons: UnmatchedReason[] }>;
      }>(`/admin/matching-rounds/${roundId}/match`, { method: 'POST', body: '{}' });
      applyMatchResult(res, items);
      showSuccess(t('facilitator.matchReady'));
    } catch (error) {
      showError(formatApiError(error, t));
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    if (groups.length === 0) return;
    setLoading(true);
    try {
      const res = await apiFetch<{
        emails?: { sent: number; failed: EmailFailure[] };
      }>(`/admin/matching-rounds/${roundId}/publish`, {
        method: 'POST',
        body: JSON.stringify({ groups }),
      });
      setPublishOpen(false);
      setHasAutoDraft(false);
      setEmailFailures(res.emails?.failed ?? []);
      setGroups([]);
      setUnmatched(0);
      setUnmatchedMembers([]);
      onMatchStateChange?.({ hasDraft: false, groupCount: 0 });
      showSuccess(t('facilitator.published'));
      await onPublished?.();
    } catch (error) {
      showError(formatApiError(error, t));
    } finally {
      setLoading(false);
    }
  };

  const retryFailedEmails = async () => {
    if (emailFailures.length === 0) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ sent: number; failed: EmailFailure[] }>(
        `/admin/matching-rounds/${roundId}/publish/retry-emails`,
        {
          method: 'POST',
          body: JSON.stringify({
            targets: emailFailures.map((item) => ({
              circleId: item.circleId,
              userId: item.userId,
            })),
          }),
        },
      );
      setEmailFailures(res.failed);
      showSuccess(t('facilitator.emailsRetried'));
    } catch (error) {
      showError(formatApiError(error, t));
    } finally {
      setLoading(false);
    }
  };

  const exportUnmatchedCsv = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/admin/matching-rounds/${roundId}/unmatched/export.csv?locale=${i18n.language.startsWith('en') ? 'en' : 'pt'}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('export_failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `unmatched-${roundId}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showError(formatApiError(error, t));
    } finally {
      setLoading(false);
    }
  };

  if (!canMatch) {
    return null;
  }

  return (
    <div className={cn('grid w-full gap-8', className)}>
      {emailFailures.length > 0 ? (
        <AppCard title={t('facilitator.emailFailuresTitle')}>
          <p className="text-sm text-muted-foreground">{t('facilitator.emailFailuresHint')}</p>
          <ul className="mt-2 list-inside list-disc text-sm">
            {emailFailures.map((item) => (
              <li key={`${item.circleId}-${item.userId}`}>
                {item.email}: {item.error}
              </li>
            ))}
          </ul>
          <AppButton className="mt-3 w-full sm:w-auto" variant="outline" loading={loading} onClick={retryFailedEmails}>
            {t('facilitator.retryFailedEmails')}
          </AppButton>
        </AppCard>
      ) : null}

      <div className="grid w-full gap-8 lg:grid-cols-12">
        <AppCard
          title={t('facilitator.matchingTitle')}
          className={cn(groups.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12')}
        >
          <p className="mb-4 text-sm text-muted-foreground">{t('facilitator.matchingHint')}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <AppButton onClick={runAutoMatch} loading={loading} disabled={declarations.length < 2}>
              {t('facilitator.autoMatch')}
            </AppButton>
            <AppButton variant="outline" onClick={runMatch} loading={loading} disabled={declarations.length < 2}>
              {t('facilitator.runMatch')}
            </AppButton>
            {hasAutoDraft ? (
              <AppButton variant="ghost" onClick={undoAutoMatch} loading={loading}>
                {t('facilitator.undoAutoMatch')}
              </AppButton>
            ) : null}
            <AppButton
              variant="outline"
              onClick={() => void ensureDraftLoaded()}
              loading={loading}
              className="sm:ml-auto"
            >
              {t('facilitator.refreshMatch')}
            </AppButton>
          </div>
        </AppCard>

        {groups.length > 0 ? (
          <AppCard title={t('facilitator.preview')} className="lg:col-span-5">
            <GroupPreview
              groups={groups}
              unmatched={unmatched}
              unmatchedLabel={t('facilitator.unmatched', { count: unmatched })}
              slotLabels={slotLabels}
            />
            {canPublish ? (
              <AppButton
                className="mt-4 w-full sm:w-auto"
                onClick={() => setPublishOpen(true)}
                loading={loading}
              >
                {t('facilitator.publish')}
              </AppButton>
            ) : null}
          </AppCard>
        ) : null}

        {unmatchedMembers.length > 0 ? (
          <UnmatchedPanel
            items={unmatchedMembers}
            roundId={roundId}
            loading={loading}
            onExport={exportUnmatchedCsv}
          />
        ) : null}
      </div>

      <AppAlertDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={t('facilitator.publish')}
        description={t('facilitator.publishConfirm')}
        variant="destructive"
        body={t('facilitator.unmatched', { count: unmatched })}
        cancelLabel={t('facilitator.cancel')}
        confirmLabel={t('facilitator.publish')}
        onConfirm={publish}
        loading={loading}
      />
    </div>
  );
}
