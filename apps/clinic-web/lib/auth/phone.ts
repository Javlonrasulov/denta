/** Uzbekistan phone: UI +998 XX XXX XX XX → backend +998XXXXXXXXX */

const UZ_DIGITS = /^998\d{9}$/;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Normalize to E.164-like +998901234567 or null if invalid. */
export function normalizeUzPhone(input: string): string | null {
  let digits = digitsOnly(input);
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `998${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    digits = `998${digits}`;
  }
  if (!digits.startsWith('998') && digits.length === 12 && digits.startsWith('8')) {
    // unlikely
  }
  if (!UZ_DIGITS.test(digits)) return null;
  return `+${digits}`;
}

/** Format for display: +998 90 123 45 67 */
export function formatUzPhoneDisplay(input: string): string {
  const normalized = normalizeUzPhone(input);
  const digits = normalized ? digitsOnly(normalized) : digitsOnly(input);

  let local = digits;
  if (local.startsWith('998')) local = local.slice(3);
  local = local.slice(0, 9);

  const p1 = local.slice(0, 2);
  const p2 = local.slice(2, 5);
  const p3 = local.slice(5, 7);
  const p4 = local.slice(7, 9);

  let out = '+998';
  if (p1) out += ` ${p1}`;
  if (p2) out += ` ${p2}`;
  if (p3) out += ` ${p3}`;
  if (p4) out += ` ${p4}`;
  return out;
}

/** Mask while typing: keep +998 prefix and format groups. */
export function maskUzPhoneInput(raw: string): string {
  let digits = digitsOnly(raw);
  if (digits.startsWith('998')) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  return formatUzPhoneDisplay(`998${digits}`);
}

export function isValidUzPhone(input: string): boolean {
  return normalizeUzPhone(input) !== null;
}

export function looksLikeEmail(identifier: string): boolean {
  return identifier.trim().includes('@');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const v = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Login identifier: email or phone → normalized string + kind */
export function normalizeLoginIdentifier(
  identifier: string,
): { kind: 'email'; value: string } | { kind: 'phone'; value: string } | null {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (looksLikeEmail(trimmed)) {
    if (!isValidEmail(trimmed)) return null;
    return { kind: 'email', value: normalizeEmail(trimmed) };
  }
  const phone = normalizeUzPhone(trimmed);
  if (!phone) return null;
  return { kind: 'phone', value: phone };
}
