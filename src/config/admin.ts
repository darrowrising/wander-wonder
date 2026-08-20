const ADMIN_EMAILS = new Set(['benellisdev@gmail.com', '2ben.ellis@gmail.com'])

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && ADMIN_EMAILS.has(email.trim().toLowerCase()))
}
