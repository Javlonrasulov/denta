export abstract class StorageService {
  abstract upload(input: {
    key: string;
    buffer: Buffer;
    mimeType: string;
    sizeBytes: number;
  }): Promise<{ key: string; url: string; bucket: string }>;

  abstract delete(key: string): Promise<void>;

  abstract getPublicUrl(key: string): string;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
