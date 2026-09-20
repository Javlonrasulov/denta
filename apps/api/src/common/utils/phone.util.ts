/**
 * Normalize Uzbek phone numbers to E.164: +998XXXXXXXXX
 */
export function normalizePhone(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  let normalized = digits;
  if (digits.startsWith('998') && digits.length === 12) {
    normalized = digits;
  } else if (digits.startsWith('0') && digits.length === 10) {
    normalized = `998${digits.slice(1)}`;
  } else if (digits.length === 9) {
    normalized = `998${digits}`;
  } else {
    return null;
  }
  if (!/^998\d{9}$/.test(normalized)) return null;
  return `+${normalized}`;
}

export function isValidUzPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim().toLowerCase());
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}
