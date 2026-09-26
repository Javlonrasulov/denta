export type StorageVisibility = 'public' | 'private';

export abstract class StorageService {
  abstract upload(input: {
    key: string;
    buffer: Buffer;
    mimeType: string;
    sizeBytes: number;
    visibility?: StorageVisibility;
  }): Promise<{ key: string; url: string; bucket: string }>;

  abstract delete(key: string): Promise<void>;

  abstract exists(key: string): Promise<boolean>;

  /** Public or CDN URL for public objects; private objects should use getSignedUrl. */
  abstract getPublicUrl(key: string): string;

  /**
   * Time-limited URL for private medical/patient files.
   * Local driver returns authenticated proxy path hint; S3 returns pre-signed URL.
   */
  abstract getSignedUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

/** Safe object key: no path traversal, no absolute paths. */
export function sanitizeStorageKey(raw: string): string {
  const cleaned = raw
    .replace(/\\/g, '/')
    .split('/')
    .filter((p) => p && p !== '.' && p !== '..')
    .join('/');
  if (!cleaned || cleaned.startsWith('/') || cleaned.includes('\0')) {
    throw new Error('Invalid storage key');
  }
  return cleaned;
}

export function isPrivateStorageKey(key: string): boolean {
  return (
    key.startsWith('private/') ||
    key.startsWith('patients/') ||
    key.startsWith('medical/')
  );
}
