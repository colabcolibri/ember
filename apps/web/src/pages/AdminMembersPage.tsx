import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  AppLoading,
  AppPage,
} from '@/components/app/index.js';
import { ScrollArea } from '@/components/ui/scroll-area.js';
import { apiFetch } from '@/lib/api.js';
import { formatApiError } from '@/lib/api-errors.js';
import { showError, showSuccess } from '@/lib/app-toast.js';
import { useInitialLoad } from '@/lib/useInitialLoad.js';

type MemberItem = {
  userId: string;
  email: string;
  role: string;
  invitedAt: string | null;
  profileComplete: boolean;
  displayName: string | null;
};

export function AdminMembersPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [csv, setCsv] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadMembers() {
    const res = await apiFetch<{ items: MemberItem[] }>('/admin/members');
    setMembers(res.items);
  }

  const { initialLoading } = useInitialLoad(loadMembers, []);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/admin/invites', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), displayName: displayName.trim() || undefined }),
      });
      showSuccess(t('adminMembers.inviteSent'));
      setEmail('');
      setDisplayName('');
      await loadMembers();
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  async function onImportCsv(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await apiFetch<{ created: number; errors: Array<{ line: number; email: string; message: string }> }>(
        '/admin/invites/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/csv' },
          body: csv,
        },
      );
      showSuccess(t('adminMembers.importResult', { created: result.created, errors: result.errors.length }));
      setCsv('');
      await loadMembers();
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  if (initialLoading) {
    return (
      <AppPage title={t('adminMembers.title')} lead={t('adminMembers.lead')}>
        <AppLoading />
      </AppPage>
    );
  }

  return (
    <AppPage title={t('adminMembers.title')} lead={t('adminMembers.lead')}>
      <div className="space-y-6">
        <AppCard>
          <form className="space-y-4" onSubmit={onInvite}>
            <AppFormField label={t('adminMembers.email')} htmlFor="inviteEmail">
              <AppInput id="inviteEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </AppFormField>
            <AppFormField label={t('adminMembers.displayName')} htmlFor="inviteName">
              <AppInput id="inviteName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </AppFormField>
            <AppButton type="submit" disabled={submitting}>
              {t('adminMembers.sendInvite')}
            </AppButton>
          </form>
        </AppCard>

        <AppCard>
          <form className="space-y-4" onSubmit={onImportCsv}>
            <AppFormField label={t('adminMembers.csvLabel')} htmlFor="csvImport">
              <textarea
                id="csvImport"
                className="min-h-32 w-full rounded-xl border border-outline-variant/30 bg-paper px-3 py-2 text-sm"
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder={t('adminMembers.csvPlaceholder')}
              />
            </AppFormField>
            <AppButton type="submit" variant="secondary" disabled={submitting || !csv.trim()}>
              {t('adminMembers.importCsv')}
            </AppButton>
          </form>
        </AppCard>

        <AppCard>
          <ScrollArea horizontal>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 text-muted-foreground">
                  <th className="px-2 py-2">{t('adminMembers.tableEmail')}</th>
                  <th className="px-2 py-2">{t('adminMembers.tableRole')}</th>
                  <th className="px-2 py-2">{t('adminMembers.tableProfile')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} className="border-b border-outline-variant/10">
                    <td className="px-2 py-3">
                      <div className="font-medium text-foreground">{member.displayName || member.email}</div>
                      {member.displayName ? <div className="text-xs text-muted-foreground">{member.email}</div> : null}
                    </td>
                    <td className="px-2 py-3">{member.role}</td>
                    <td className="px-2 py-3">
                      {member.profileComplete ? t('adminMembers.profileComplete') : t('adminMembers.profileIncomplete')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </AppCard>
      </div>
    </AppPage>
  );
}
