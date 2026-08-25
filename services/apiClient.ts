/**
 * Thin mock-ready API client.
 * Later: replace with NestJS HTTP client (fetch/axios) using baseURL + auth headers.
 */

/** Simulate network latency. Pass ms or use a random 300–600ms delay. */
export async function apiDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random delay in the typical mock network range. */
export async function mockNetworkDelay(): Promise<void> {
  const ms = 300 + Math.floor(Math.random() * 301); // 300–600
  return apiDelay(ms);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// NestJS swap stubs (no real HTTP yet)
// ---------------------------------------------------------------------------
// const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.denta.uz';
// // Auth: read token from expo-secure-store and attach as Authorization: Bearer <token>
// // async function getAuthHeaders(): Promise<HeadersInit> {
// //   const token = await SecureStore.getItemAsync('auth_token');
// //   return token ? { Authorization: `Bearer ${token}` } : {};
// // }
// // export async function apiGet<T>(path: string): Promise<T> { ... }
// // export async function apiPost<T>(path: string, body: unknown): Promise<T> { ... }
