const MAGIC_LINK_TOKEN_PATTERN = /token=[A-Za-z0-9._-]+/g;

export function redactSentEmailBody(input: { html: string; text: string }): { html: string; text: string } {
  const redact = (content: string) => content.replace(MAGIC_LINK_TOKEN_PATTERN, 'token=[redacted]');
  return {
    html: redact(input.html),
    text: redact(input.text),
  };
}
