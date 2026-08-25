import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * SecureStore-backed async storage adapter for Zustand.
 * Falls back to in-memory on web.
 */
const memory = new Map<string, string>();

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memory.get(key) ?? (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memory.set(key, value);
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memory.delete(key);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const zustandStorage = {
  getItem,
  setItem,
  removeItem,
};

/** Ready for future auth tokens — never log token values. */
export const tokenStorage = {
  async getAccessToken() {
    return getItem('denta.accessToken');
  },
  async setAccessToken(token: string) {
    await setItem('denta.accessToken', token);
  },
  async clear() {
    await removeItem('denta.accessToken');
    await removeItem('denta.refreshToken');
  },
};
