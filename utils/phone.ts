/** Uzbekistan phone: UI +998 93 559 96 99 → API +998935599699 */

const UZ_DIGITS = /^998\d{9}$/;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Extract the 9-digit national number.
 * Strips a leading 998 country code when the user pastes a full number.
 * Never treats operator codes like 99/90 as country code.
 */
export function extractUzLocalDigits(raw: string): string {
  let digits = digitsOnly(raw);

  // Full or partial paste with country code: 998… (more than 9 digits total)
  if (digits.startsWith('998') && digits.length > 9) {
    digits = digits.slice(3);
  }

  // Leading 0XXXXXXXXX
  if (digits.startsWith('0') && digits.length >= 10) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 9);
}

/** Normalize to E.164 +998901234567 or null if invalid. */
export function normalizeUzPhone(input: string): string | null {
  const local = extractUzLocalDigits(input);
  if (local.length !== 9) return null;
  const full = `998${local}`;
  if (!UZ_DIGITS.test(full)) return null;
  return `+${full}`;
}

/** Format local digits only: 93 559 96 99 */
export function formatUzLocalDisplay(localDigits: string): string {
  const local = extractUzLocalDigits(localDigits);
  const p1 = local.slice(0, 2);
  const p2 = local.slice(2, 5);
  const p3 = local.slice(5, 7);
  const p4 = local.slice(7, 9);

  let out = '';
  if (p1) out += p1;
  if (p2) out += ` ${p2}`;
  if (p3) out += ` ${p3}`;
  if (p4) out += ` ${p4}`;
  return out;
}

/** Format full display: +998 93 559 96 99 */
export function formatUzPhoneDisplay(input: string): string {
  const local = formatUzLocalDisplay(input);
  return local ? `+998 ${local}` : '+998';
}

/** Mask while typing local part only (no country code in the field). */
export function maskUzLocalInput(raw: string): string {
  return formatUzLocalDisplay(raw);
}

/** @deprecated Prefer maskUzLocalInput + fixed +998 prefix */
export function maskUzPhoneInput(raw: string): string {
  return formatUzPhoneDisplay(raw);
}

export function isValidUzPhone(input: string): boolean {
  return normalizeUzPhone(input) !== null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export function isValidPatientPassword(password: string): boolean {
  return Boolean(password && password.length >= 6);
}
