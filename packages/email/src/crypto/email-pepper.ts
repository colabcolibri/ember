export function requireEmailPepper(): string {
  const pepper = process.env.EMBER_EMAIL_PEPPER?.trim();
  if (!pepper) {
    throw new Error('EMBER_EMAIL_PEPPER é obrigatório para persistência de email');
  }
  return pepper;
}
