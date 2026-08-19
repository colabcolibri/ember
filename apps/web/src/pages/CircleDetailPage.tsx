import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  AppButton,
  AppCard,
  AppEmptyState,
  AppLoading,
  AppPage,
  AttendancePrompt,
  CircleInviteCard,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import { showError, showSuccess } from '../lib/app-toast.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';

type CircleDetail = {
  id: string;
  status: string;
  question: string | null;
  communityName: string;
  scheduledSlot: string | null;
  scheduledAt: string | null;
  jitsiUrl: string | null;
  durationMinutes: number;
  canRecordAttendance: boolean;
  myStatus: string;
  myAttendance: string | null;
};

type Member = {
  userId: string;
  label: string;
  status: string;
  attendance: string | null;
};

export function CircleDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    const res = await apiFetch<{ circle: CircleDetail; members: Member[] }>(`/circles/${id}`);
    setCircle(res.circle);
    setMembers(res.members);
  };

  const { initialLoading } = useInitialLoad(async () => {
    try {
      await load();
    } catch (e) {
      showError(formatApiError(e, t));
    }
  }, [id, t]);

  const confirm = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/circles/${id}/confirm`, { method: 'POST', body: '{}' });
      showSuccess(t('circles.confirmed'));
      await load();
    } catch (e) {
      showError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const recordAttendance = async (happened: boolean) => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/circles/${id}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ happened }),
      });
      showSuccess(happened ? t('circles.attendanceYes') : t('circles.attendanceNo'));
      await load();
    } catch (e) {
      showError(formatApiError(e, t));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <AppPage>
        <AppLoading />
      </AppPage>
    );
  }

  if (!circle) {
    return (
      <AppPage title={t('circles.title')}>
        <AppEmptyState title={t('circles.empty')} />
      </AppPage>
    );
  }

  const when = `${t('circles.when')}: ${circle.scheduledAt ?? circle.scheduledSlot ?? '—'}`;

  return (
    <AppPage title={t('circles.inviteTitle')}>
      <CircleInviteCard
        communityName={circle.communityName}
        question={circle.question}
        when={when}
        status={circle.myStatus}
      />
      <AppCard title={t('circles.participants')}>
        <ul className="grid gap-1 text-sm">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/30 bg-background/50 px-4 py-3"
            >
              <span className="font-medium">{m.label}</span>
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {m.status}
              </span>
            </li>
          ))}
        </ul>
      </AppCard>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {circle.jitsiUrl ? (
          <AppButton asChild className="w-full sm:w-auto">
            <a href={circle.jitsiUrl} target="_blank" rel="noreferrer">
              {t('circles.joinJitsi')}
            </a>
          </AppButton>
        ) : null}
        <AppButton asChild variant="outline" className="w-full sm:w-auto">
          <a href={`/api/v1/circles/${circle.id}/calendar.ics`}>{t('circles.downloadIcs')}</a>
        </AppButton>
        {circle.myStatus === 'invited' ? (
          <AppButton onClick={confirm} loading={loading} className="w-full sm:w-auto">
            {t('circles.confirm')}
          </AppButton>
        ) : null}
      </div>
      {circle.canRecordAttendance && !circle.myAttendance ? (
        <AttendancePrompt
          title={t('circles.attendanceTitle')}
          subtitle={t('circles.attendanceSubtitle')}
          yesLabel={t('circles.attendanceYesBtn')}
          noLabel={t('circles.attendanceNoBtn')}
          onYes={() => recordAttendance(true)}
          onNo={() => recordAttendance(false)}
          loading={loading}
        />
      ) : null}
    </AppPage>
  );
}
