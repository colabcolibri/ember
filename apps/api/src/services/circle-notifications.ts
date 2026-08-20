import type { ensureDatabaseReady } from '@ember/db';
import { formatSlotLocal, type StoredRoundSlot } from '@ember/domain';
import {
  buildCircleIcs,
  formatRoundSlotOfficialLabels,
  getCircleForMember,
  getUserEmailById,
  listCircleMemberDetails,
  listCommunityMemberEmails,
  listDueCircleReminderJobs,
  markCircleReminderJob,
  shouldSkipCircleReminder,
  type PublishCircleRow,
} from '@ember/db';
import {
  buildCircleFormedEmailContent,
  buildCircleReminderEmailContent,
  buildRoundOpenEmailContent,
  createEmailDeliveryContext,
  requireEmailPepper,
  resolveAppUrl,
  sendTransactionalEmail,
} from '@ember/email';

type Db = ReturnType<typeof ensureDatabaseReady>;

export type EmailDeliveryFailure = {
  circleId: string;
  userId: string;
  email: string;
  error: string;
};

export type CircleNotificationResult = {
  sent: number;
  failed: EmailDeliveryFailure[];
};

export async function sendRoundOpenNotifications(
  db: Db,
  input: {
    communityId: string;
    roundId: string;
    theme: string;
    questions: string[];
    slots: Array<string | StoredRoundSlot>;
  },
): Promise<void> {
  const pepper = requireEmailPepper();
  const appUrl = resolveAppUrl();
  const presenceUrl = `${appUrl}/presence`;
  const members = listCommunityMemberEmails(db, input.communityId, pepper);
  const slotLabels = formatRoundSlotOfficialLabels(db, input.communityId, input.slots, 'pt');
  const content = buildRoundOpenEmailContent({
    theme: input.theme,
    questions: input.questions,
    slotLabels,
    presenceUrl,
  });
  const delivery = createEmailDeliveryContext({
    db,
    kind: 'round_open',
    meta: { round_id: input.roundId, community_id: input.communityId },
  });

  await Promise.all(
    members.map((member) =>
      sendTransactionalEmail({
        to: member.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
        delivery,
        meta: { user_id: member.userId },
      }),
    ),
  );
}

export async function sendCircleFormedNotifications(
  db: Db,
  input: {
    communityId: string;
    roundId: string;
    question: string;
    circles: PublishCircleRow[];
  },
): Promise<CircleNotificationResult> {
  const pepper = requireEmailPepper();
  const appUrl = resolveAppUrl();
  const failed: EmailDeliveryFailure[] = [];
  let sent = 0;

  for (const circle of input.circles) {
    const members = listCircleMemberDetails(db, circle.id, pepper);
    for (const member of members) {
      const detail = getCircleForMember(db, circle.id, member.userId);
      const email = getUserEmailById(db, member.userId, pepper);
      if (!detail || !email) continue;

      const whenLabel = formatSlotLocal(
        detail.scheduled_slot ?? 'mon-19h',
        new Date(detail.scheduled_at ?? Date.now()),
        'pt',
      );
      const circleUrl = `${appUrl}/circles/${circle.id}`;
      const content = buildCircleFormedEmailContent({
        question: input.question,
        whenLabel,
        jitsiUrl: detail.jitsi_url ?? appUrl,
        circleUrl,
      });
      const ics = buildCircleIcs(detail, detail.duration_minutes || 30);
      const delivery = createEmailDeliveryContext({
        db,
        kind: 'circle_formed',
        meta: {
          round_id: input.roundId,
          circle_id: circle.id,
          community_id: input.communityId,
        },
      });
      const result = await sendTransactionalEmail({
        to: email,
        subject: content.subject,
        text: content.text,
        html: content.html,
        files: ics
          ? [{ filename: 'ember-encontro.ics', content: ics, contentType: 'text/calendar' }]
          : undefined,
        delivery,
        meta: { user_id: member.userId },
      });

      if (result.ok) {
        sent += 1;
      } else {
        failed.push({
          circleId: circle.id,
          userId: member.userId,
          email,
          error: result.error ?? 'send_failed',
        });
      }
    }
  }

  return { sent, failed };
}

export async function retryCircleFormedEmails(
  db: Db,
  input: {
    communityId: string;
    roundId: string;
    question: string;
    targets: Array<{ circleId: string; userId: string }>;
  },
): Promise<CircleNotificationResult> {
  const pepper = requireEmailPepper();
  const appUrl = resolveAppUrl();
  const failed: EmailDeliveryFailure[] = [];
  let sent = 0;

  for (const target of input.targets) {
    const detail = getCircleForMember(db, target.circleId, target.userId);
    const email = getUserEmailById(db, target.userId, pepper);
    if (!detail || !email) {
      failed.push({
        circleId: target.circleId,
        userId: target.userId,
        email: email ?? 'unknown',
        error: 'not_found',
      });
      continue;
    }

    const whenLabel = formatSlotLocal(
      detail.scheduled_slot ?? 'mon-19h',
      new Date(detail.scheduled_at ?? Date.now()),
      'pt',
    );
    const circleUrl = `${appUrl}/circles/${target.circleId}`;
    const content = buildCircleFormedEmailContent({
      question: input.question,
      whenLabel,
      jitsiUrl: detail.jitsi_url ?? appUrl,
      circleUrl,
    });
    const ics = buildCircleIcs(detail, detail.duration_minutes || 30);
    const delivery = createEmailDeliveryContext({
      db,
      kind: 'circle_formed',
      meta: {
        round_id: input.roundId,
        circle_id: target.circleId,
        community_id: input.communityId,
      },
    });
    const result = await sendTransactionalEmail({
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      files: ics
        ? [{ filename: 'ember-encontro.ics', content: ics, contentType: 'text/calendar' }]
        : undefined,
      delivery,
      meta: { user_id: target.userId },
    });

    if (result.ok) {
      sent += 1;
    } else {
      failed.push({
        circleId: target.circleId,
        userId: target.userId,
        email,
        error: result.error ?? 'send_failed',
      });
    }
  }

  return { sent, failed };
}

export async function processDueCircleReminders(db: Db): Promise<number> {
  const pepper = requireEmailPepper();
  const appUrl = resolveAppUrl();
  const jobs = listDueCircleReminderJobs(db);
  let processed = 0;

  for (const job of jobs) {
    if (shouldSkipCircleReminder(db, job.circleId, job.userId)) {
      markCircleReminderJob(db, job.id, 'skipped');
      processed += 1;
      continue;
    }

    const detail = getCircleForMember(db, job.circleId, job.userId);
    const email = getUserEmailById(db, job.userId, pepper);
    if (!detail || !email) {
      markCircleReminderJob(db, job.id, 'skipped');
      processed += 1;
      continue;
    }

    const whenLabel = formatSlotLocal(
      detail.scheduled_slot ?? 'mon-19h',
      new Date(detail.scheduled_at ?? Date.now()),
      'pt',
    );
    const circleUrl = `${appUrl}/circles/${job.circleId}`;
    const content = buildCircleReminderEmailContent({
      question: detail.question ?? '',
      whenLabel,
      jitsiUrl: detail.jitsi_url ?? appUrl,
      circleUrl,
      kind: job.kind,
    });
    const delivery = createEmailDeliveryContext({
      db,
      kind: 'circle_reminder',
      meta: {
        circle_id: job.circleId,
        round_id: detail.round_id,
        community_id: detail.community_id,
        reminder_kind: job.kind,
        user_id: job.userId,
      },
    });

    const result = await sendTransactionalEmail({
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      delivery,
      meta: { user_id: job.userId },
    });

    markCircleReminderJob(db, job.id, result.ok ? 'sent' : 'failed');
    processed += 1;
  }

  return processed;
}
