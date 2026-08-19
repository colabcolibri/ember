import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppPage,
  AttendancePrompt,
  CircleInviteCard,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';

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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    const res = await apiFetch<{ circle: CircleDetail; members: Member[] }>(`/circles/${id}`);
    setCircle(res.circle);
    setMembers(res.members);
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : t('common.apiOffline')));
  }, [id, t]);

  const confirm = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/circles/${id}/confirm`, { method: 'POST', body: '{}' });
      setMessage(t('circles.confirmed'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.apiOffline'));
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
      setMessage(happened ? t('circles.attendanceYes') : t('circles.attendanceNo'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.apiOffline'));
    } finally {
      setLoading(false);
    }
  };

  if (!circle) {
    return (
      <AppPage>
        <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
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
      {message ? <AppAlert variant="success">{message}</AppAlert> : null}
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}
    </AppPage>
  );
}
