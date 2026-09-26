import { createApiAuthService } from './api-auth-service';
import { createMockAuthService } from './mock-auth-service';
import type { AuthService } from './types';

export * from './types';
export * from './phone';
export * from './password';
export * from './session';
export { daysRemaining } from './crypto';

function isProdRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Auth service factory.
 * Production: NEXT_PUBLIC_API_URL required (no silent mock).
 * Dev: mock only when NEXT_PUBLIC_USE_MOCK_AUTH=true OR API URL unset.
 */
export function getAuthService(): AuthService {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const forceMock = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

  if (isProdRuntime()) {
    if (!apiUrl) {
      throw new Error(
        'NEXT_PUBLIC_API_URL is required in production. Mock auth is disabled.',
      );
    }
    if (forceMock) {
      throw new Error('NEXT_PUBLIC_USE_MOCK_AUTH is not allowed in production.');
    }
    return createApiAuthService();
  }

  if (forceMock || !apiUrl) {
    return createMockAuthService();
  }
  return createApiAuthService();
}

export function isAuthMockMode(): boolean {
  if (isProdRuntime()) return false;
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' ||
    !process.env.NEXT_PUBLIC_API_URL?.trim()
  );
}
