import type { ensureDatabaseReady } from '@ember/db';
import { formatSlotLocal } from '@ember/domain';
import {
  buildCircleIcs,
  getCircleForMember,
  getUserEmailById,
  listCircleMemberDetails,
  listCommunityMemberEmails,
  type PublishCircleRow,
} from '@ember/db';
import {
  buildCircleFormedEmailContent,
  buildRoundOpenEmailContent,
  createEmailDeliveryContext,
  requireEmailPepper,
  resolveAppUrl,
  sendTransactionalEmail,
} from '@ember/email';

type Db = ReturnType<typeof ensureDatabaseReady>;

export async function sendRoundOpenNotifications(
  db: Db,
  input: {
    communityId: string;
    roundId: string;
    theme: string;
    questions: string[];
    slots: string[];
  },
): Promise<void> {
  const pepper = requireEmailPepper();
  const appUrl = resolveAppUrl();
  const presenceUrl = `${appUrl}/presence`;
  const members = listCommunityMemberEmails(db, input.communityId, pepper);
  const content = buildRoundOpenEmailContent({
    theme: input.theme,
    questions: input.questions,
    slots: input.slots,
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
): Promise<void> {
  const pepper = requireEmailPepper();
  const appUrl = resolveAppUrl();

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
      await sendTransactionalEmail({
        to: email,
        subject: content.subject,
        text: content.text,
        html: content.html,
        files: ics
          ? [{ filename: 'ember-roda.ics', content: ics, contentType: 'text/calendar' }]
          : undefined,
        delivery,
        meta: { user_id: member.userId },
      });
    }
  }
}
