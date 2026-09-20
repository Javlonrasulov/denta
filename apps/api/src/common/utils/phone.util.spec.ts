import { normalizePhone, isValidUzPhone } from './phone.util';

describe('normalizePhone', () => {
  it('normalizes +998 format', () => {
    expect(normalizePhone('+998 90 123 45 67')).toBe('+998901234567');
  });

  it('normalizes 9-digit local', () => {
    expect(normalizePhone('901234567')).toBe('+998901234567');
  });

  it('rejects invalid', () => {
    expect(normalizePhone('123')).toBeNull();
    expect(isValidUzPhone('123')).toBe(false);
  });
});
