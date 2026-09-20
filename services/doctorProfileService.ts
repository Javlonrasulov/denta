import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import {
  apiBaseUrl,
  apiDelete,
  apiPost,
  getAccessToken,
  getRefreshToken,
  useMockApi,
} from '@/services/apiClient';
import type { DoctorAvatarUploadResult, DoctorDeviceSession } from '@/types';

export type AvatarPickSource = 'camera' | 'library';
export type AvatarPickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'permission' | 'cancel' | 'error' };

type ApiSessionRow = {
  id: string;
  deviceName?: string | null;
  platform?: string | null;
  ipAddress?: string | null;
  lastUsedAt: string;
  current: boolean;
};

type AvatarUploadResponse = {
  uri?: string;
  avatarUrl?: string;
  pendingUpload?: boolean;
  message?: string;
};

async function compressSquare(uri: string): Promise<string> {
  const result = await manipulateAsync(uri, [{ resize: { width: 720 } }], {
    compress: 0.72,
    format: SaveFormat.JPEG,
  });
  return result.uri;
}

function lastActiveFrom(iso: string): Pick<
  DoctorDeviceSession,
  'lastActiveKey' | 'lastActiveCount'
> {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return { lastActiveKey: 'now' };
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return { lastActiveKey: 'now' };
  if (hours < 48) {
    return { lastActiveKey: 'hours', lastActiveCount: Math.max(1, hours) };
  }
  return {
    lastActiveKey: 'days',
    lastActiveCount: Math.max(1, Math.floor(hours / 24)),
  };
}

function mapSession(row: ApiSessionRow): DoctorDeviceSession {
  const active = lastActiveFrom(row.lastUsedAt);
  return {
    id: row.id,
    device: row.deviceName?.trim() || 'Device',
    location: row.ipAddress?.trim() || row.platform?.trim() || '—',
    current: Boolean(row.current),
    ...active,
  };
}

export async function pickDoctorAvatar(source: AvatarPickSource): Promise<AvatarPickResult> {
  try {
    if (source === 'camera') {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return { ok: false, reason: 'permission' };
      }
    } else if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return { ok: false, reason: 'permission' };
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    };

    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (picked.canceled || !picked.assets[0]?.uri) {
      return { ok: false, reason: 'cancel' };
    }

    const uri = await compressSquare(picked.assets[0].uri);
    return { ok: true, uri };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function uploadDoctorAvatar(localUri: string): Promise<DoctorAvatarUploadResult> {
  if (useMockApi()) {
    return { uri: localUri, pendingUpload: true };
  }

  const token = await getAccessToken();
  const form = new FormData();
  const name = localUri.split('/').pop()?.split('?')[0] || 'avatar.jpg';
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : 'jpg';
  const mime =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

  form.append(
    'file',
    {
      uri: localUri,
      name: name.includes('.') ? name : 'avatar.jpg',
      type: mime,
    } as unknown as Blob,
  );

  const res = await fetch(`${apiBaseUrl()}/doctors/me/avatar`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const text = await res.text();
  let payload: AvatarUploadResponse | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as AvatarUploadResponse;
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    throw new Error(payload?.message ?? `HTTP ${res.status}`);
  }

  const avatarUrl = payload?.avatarUrl ?? payload?.uri;
  if (!avatarUrl) {
    throw new Error('Avatar upload returned no URL');
  }

  return { uri: avatarUrl, pendingUpload: false };
}

export async function getDoctorSessions(): Promise<DoctorDeviceSession[]> {
  if (useMockApi()) {
    return [
      {
        id: 'session-current',
        device: 'Pixel · DENTA Doctor',
        location: 'Toshkent',
        lastActiveKey: 'now',
        current: true,
      },
    ];
  }

  const refresh = await getRefreshToken();
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (refresh) headers['X-Refresh-Token'] = refresh;

  const res = await fetch(`${apiBaseUrl()}/auth/sessions`, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const rows = (await res.json()) as ApiSessionRow[];
  return rows.map(mapSession);
}

export async function revokeSession(id: string): Promise<void> {
  if (useMockApi()) return;
  await apiDelete(`/auth/sessions/${id}`);
}

export async function revokeOtherSessions(): Promise<void> {
  if (useMockApi()) return;
  const refresh = await getRefreshToken();
  await apiPost('/auth/sessions/revoke-all-others', {
    refreshToken: refresh ?? undefined,
  });
}
