import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { apiDelay } from '@/services/apiClient';
import type { DoctorAvatarUploadResult, DoctorDeviceSession } from '@/types';

export type AvatarPickSource = 'camera' | 'library';
export type AvatarPickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'permission' | 'cancel' | 'error' };

async function compressSquare(uri: string): Promise<string> {
  const result = await manipulateAsync(uri, [{ resize: { width: 720 } }], {
    compress: 0.72,
    format: SaveFormat.JPEG,
  });
  return result.uri;
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

/** Local/mock now; swap the body for multipart upload to `/doctors/me/avatar`. */
export async function uploadDoctorAvatar(localUri: string): Promise<DoctorAvatarUploadResult> {
  await apiDelay(180);
  return { uri: localUri, pendingUpload: true };
}

export async function getDoctorSessions(): Promise<DoctorDeviceSession[]> {
  await apiDelay(80);
  return [
    {
      id: 'session-current',
      device: 'Pixel · DENTA Doctor',
      location: 'Toshkent',
      lastActiveKey: 'now',
      current: true,
    },
    {
      id: 'session-web',
      device: 'Chrome · Windows',
      location: 'Toshkent',
      lastActiveKey: 'hours',
      lastActiveCount: 2,
      current: false,
    },
  ];
}
