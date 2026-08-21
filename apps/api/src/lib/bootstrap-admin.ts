/** Email do primeiro admin da org (magic link). Aceita nome legado por compatibilidade. */
export function resolveBootstrapAdminEmail(): string | undefined {
  const raw =
    process.env.EMBER_BOOTSTRAP_ADMIN_EMAIL?.trim() ||
    process.env.EMBER_BOOTSTRAP_FACILITATOR_EMAIL?.trim();
  return raw ? raw.toLowerCase() : undefined;
}
