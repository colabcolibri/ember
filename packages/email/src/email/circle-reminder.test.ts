import { describe, expect, it } from 'vitest';
import { buildCircleReminderEmailContent } from './circle-templates.js';

describe('buildCircleReminderEmailContent', () => {
  it('builds 24h reminder in pt', () => {
    const content = buildCircleReminderEmailContent({
      question: 'Como estamos?',
      whenLabel: 'Quarta, 19:00',
      jitsiUrl: 'https://meet.jit.si/abc',
      circleUrl: 'https://app/circles/1',
      kind: '24h',
      locale: 'pt',
    });
    expect(content.subject).toContain('amanhã');
    expect(content.text).toContain('Como estamos?');
  });

  it('builds 15min reminder in en', () => {
    const content = buildCircleReminderEmailContent({
      question: 'How are we?',
      whenLabel: 'Wed 7:00 PM',
      jitsiUrl: 'https://meet.jit.si/abc',
      circleUrl: 'https://app/circles/1',
      kind: '15min',
      locale: 'en',
    });
    expect(content.subject).toContain('15 minutes');
    expect(content.text).toContain('How are we?');
  });
});
