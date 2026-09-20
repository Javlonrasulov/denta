/**
 * Password rules matching clinic-web lib/auth/password.ts:
 * ≥8 chars, at least one letter (Latin/Cyrillic), one digit.
 */
export function isValidPassword(password: string): boolean {
  if (!password || password.length < 8) return false;
  const hasLetter = /[A-Za-zА-Яа-яЁё]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasLetter && hasDigit;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
