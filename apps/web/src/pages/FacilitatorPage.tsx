import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppAlert,
  AppAlertDialog,
  AppButton,
  AppCard,
  AppLoading,
  AppPage,
  DeclarationTable,
  FacilitatorRoundPanel,
  FacilitatorTemplatesPanel,
  TrioPreview,
  type MeetingTemplate,
} from '../components/app/index.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch, ApiError } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';
import { cn } from '@/lib/utils';

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
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [trios, setTrios] = useState<Trio[]>([]);
  const [unmatched, setUnmatched] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  const loadTemplates = async () => {
    const res = await apiFetch<{ templates: MeetingTemplate[] }>('/admin/templates');
    setTemplates(res.templates);
    return res.templates;
  };

  const { initialLoading } = useInitialLoad(async () => {
    try {
      await loadTemplates();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setAccessDenied(true);
      }
      setError(formatApiError(err, t));
    }
  }, [t]);

  const createRound = async (input: {
    templateId: string;
    theme: string;
    questions: string[];
    slots: Array<{ timezone: string; localDate: string; localTime: string }>;
  }) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch<{ round: { id: string } }>('/admin/matching-rounds', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setRoundId(res.round.id);
      setActiveTab('round');
      setMessage(t('facilitator.roundCreated'));
      await loadDeclarations(res.round.id);
    } catch (e) {
      setError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (input: Omit<MeetingTemplate, 'id'>) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiFetch('/admin/templates', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await loadTemplates();
      setMessage(t('facilitator.templateCreated'));
    } catch (e) {
      setError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (id: string, input: Omit<MeetingTemplate, 'id'>) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/admin/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      await loadTemplates();
      setMessage(t('facilitator.templateSaved'));
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

  if (initialLoading) {
    return (
      <AppPage title={t('facilitator.title')} lead={t('facilitator.subtitle')}>
        <AppLoading />
      </AppPage>
    );
  }

  return (
    <AppPage title={t('facilitator.title')} lead={t('facilitator.subtitle')}>
      {error ? (
        <AppAlert variant="error" title={accessDenied ? t('facilitator.accessDeniedTitle') : undefined}>
          {error}
          {accessDenied ? (
            <span className="mt-1 block text-sm opacity-90">{t('facilitator.accessDeniedHint')}</span>
          ) : null}
        </AppAlert>
      ) : null}
      {message ? <AppAlert variant="success">{message}</AppAlert> : null}

      {accessDenied ? null : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="templates">{t('facilitator.tabTemplates')}</TabsTrigger>
              <TabsTrigger value="round">{t('facilitator.tabRound')}</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-0">
              <FacilitatorTemplatesPanel
                templates={templates}
                loading={loading}
                onCreate={createTemplate}
                onUpdate={updateTemplate}
              />
            </TabsContent>

            <TabsContent value="round" className="mt-0 grid gap-8">
              <FacilitatorRoundPanel templates={templates} loading={loading} onCreateRound={createRound} />

              {roundId ? (
                <div className="grid w-full gap-8 lg:grid-cols-12">
                  <AppCard
                    title={t('facilitator.declarations')}
                    className={cn(trios.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12')}
                  >
                    <DeclarationTable
                      items={declarations}
                      emptyMessage={t('facilitator.noDeclarations')}
                    />
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <AppButton
                        variant="outline"
                        onClick={() => loadDeclarations(roundId)}
                        loading={loading}
                      >
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
            </TabsContent>
          </Tabs>

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
        </>
      )}
    </AppPage>
  );
}
