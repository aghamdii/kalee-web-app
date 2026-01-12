// Admin email allowlist - must match the frontend config
export const ADMIN_EMAILS: string[] = [
  'alghamdii.ahmad@gmail.com',
  'ahmadgh187@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
