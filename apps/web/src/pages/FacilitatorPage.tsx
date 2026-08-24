import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppLoading,
  AppPage,
  DeclarationTable,
  FacilitatorMatchingPanel,
  FacilitatorRoundPanel,
  FacilitatorTemplatesPanel,
  type MeetingTemplate,
} from '../components/app/index.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch, ApiError } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import { showError, showSuccess } from '../lib/app-toast.js';
import { fetchAllRoundDeclarations } from '../lib/round-declarations.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';

type Declaration = {
  userId: string;
  memberLabel: string;
  emailMasked: string;
  slots: string[];
  intention: string;
  languages: string[];
  timezone: string | null;
};

export function FacilitatorPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [roundStatus, setRoundStatus] = useState<string>('open');
  const [slotLabels, setSlotLabels] = useState<Record<string, string>>({});
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  const loadTemplates = async () => {
    const res = await apiFetch<{ templates: MeetingTemplate[] }>('/admin/templates');
    setTemplates(res.templates);
    return res.templates;
  };

  const loadCurrentRound = async () => {
    const current = await apiFetch<{
      round: { id: string; status?: string; slotLabels?: Record<string, string> } | null;
    }>('/admin/matching-rounds/current');
    if (!current.round) return;
    setRoundId(current.round.id);
    setRoundStatus(current.round.status ?? 'open');
    setSlotLabels(current.round.slotLabels ?? {});
    await loadDeclarations(current.round.id);
  };

  const { initialLoading } = useInitialLoad(async () => {
    try {
      await loadTemplates();
      await loadCurrentRound();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setAccessDenied(true);
        setAccessDeniedMessage(formatApiError(err, t));
        return;
      }
      showError(formatApiError(err, t));
    }
  }, [t]);

  const createRound = async (input: {
    templateId: string;
    theme: string;
    questions: string[];
    slots: Array<{ timezone: string; localDate: string; localTime: string }>;
  }) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ round: { id: string; status: string } }>('/admin/matching-rounds', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setRoundId(res.round.id);
      setRoundStatus(res.round.status);
      setActiveTab('round');
      showSuccess(t('facilitator.roundCreated'));
      setSlotLabels({});
      await loadDeclarations(res.round.id);
    } catch (e) {
      showError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (input: Omit<MeetingTemplate, 'id'>) => {
    setLoading(true);
    try {
      await apiFetch('/admin/templates', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await loadTemplates();
      showSuccess(t('facilitator.templateCreated'));
    } catch (e) {
      showError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (id: string, input: Omit<MeetingTemplate, 'id'>) => {
    setLoading(true);
    try {
      await apiFetch(`/admin/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      await loadTemplates();
      showSuccess(t('facilitator.templateSaved'));
    } catch (e) {
      showError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const loadDeclarations = async (id: string) => {
    const items = await fetchAllRoundDeclarations<Declaration>(id);
    setDeclarations(items);
    return items;
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
      {accessDeniedMessage ? (
        <AppAlert variant="error" title={t('facilitator.accessDeniedTitle')}>
          {accessDeniedMessage}
          <span className="mt-1 block text-sm opacity-90">{t('facilitator.accessDeniedHint')}</span>
        </AppAlert>
      ) : null}

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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{t('facilitator.viewGatheringsHint')}</p>
                  <AppButton asChild variant="outline" className="w-full sm:w-auto">
                    <Link to={`/facilitator/gatherings/${roundId}`}>{t('facilitator.openGatheringDetail')}</Link>
                  </AppButton>
                </div>
              ) : null}

              {roundId ? (
                <>
                  <AppCard title={t('facilitator.declarations')}>
                    <DeclarationTable
                      items={declarations}
                      emptyMessage={t('facilitator.noDeclarations')}
                      slotLabels={slotLabels}
                    />
                    <div className="mt-4">
                      <AppButton
                        variant="outline"
                        onClick={() => loadDeclarations(roundId)}
                        loading={loading}
                      >
                        {t('facilitator.refresh')}
                      </AppButton>
                    </div>
                  </AppCard>

              {roundId && roundStatus === 'open' ? (
                <AppCard title={t('facilitator.cycle.nextStepTitle')}>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t('facilitator.cycle.waitCloseHint')}
                  </p>
                  <AppButton asChild variant="outline" className="mt-4 w-full sm:w-auto">
                    <Link to={`/facilitator/gatherings/${roundId}`}>{t('facilitator.openGatheringDetail')}</Link>
                  </AppButton>
                </AppCard>
              ) : null}

              {roundId && roundStatus === 'closed' ? (
                <FacilitatorMatchingPanel
                  roundId={roundId}
                  roundStatus={roundStatus}
                  slotLabels={slotLabels}
                  declarations={declarations}
                  onReloadDeclarations={() => loadDeclarations(roundId)}
                />
              ) : null}
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        </>
      )}
    </AppPage>
  );
}
