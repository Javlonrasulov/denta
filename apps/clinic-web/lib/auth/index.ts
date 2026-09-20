import { createApiAuthService } from './api-auth-service';
import { createMockAuthService } from './mock-auth-service';
import type { AuthService } from './types';

export * from './types';
export * from './phone';
export * from './password';
export * from './session';
export { daysRemaining } from './crypto';

/**
 * Auth service factory.
 * - If NEXT_PUBLIC_API_URL is set → real HTTP client
 * - Otherwise → isolated DEV mock (localStorage)
 */
export function getAuthService(): AuthService {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) return createApiAuthService();
  return createMockAuthService();
}

export function isAuthMockMode(): boolean {
  return !process.env.NEXT_PUBLIC_API_URL?.trim();
}
