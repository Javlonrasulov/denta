export interface PasswordChecks {
  minLength: boolean;
  hasLetter: boolean;
  hasDigit: boolean;
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasLetter: /[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]/.test(password),
    hasDigit: /\d/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  const c = getPasswordChecks(password);
  return c.minLength && c.hasLetter && c.hasDigit;
}

export function passwordStrengthScore(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  const c = getPasswordChecks(password);
  let score = 0;
  if (c.minLength) score += 1;
  if (c.hasLetter) score += 1;
  if (c.hasDigit) score += 1;
  return score as 0 | 1 | 2 | 3;
}
