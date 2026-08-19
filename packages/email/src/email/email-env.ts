const DEFAULT_EMAIL_FROM = 'Ember <dev@localhost>';

export function resolveAppUrl(): string {
  return (process.env.EMBER_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '');
}

/** Resend exige `email@x` ou `Nome <email@x>` — dotenv trunca valores com `<` sem aspas. */
export function resolveEmailFrom(): string {
  const raw = process.env.EMBER_EMAIL_FROM?.trim();
  if (!raw) {
    return DEFAULT_EMAIL_FROM;
  }
  if (raw.includes('@')) {
    return raw;
  }
  return `${raw} <dev@localhost>`;
}
