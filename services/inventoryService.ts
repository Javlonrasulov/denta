import { MOCK_INVENTORY } from '@/mocks/data';
import type { InventoryItem } from '@/types';
import { mockNetworkDelay } from './apiClient';

export async function getInventory(): Promise<InventoryItem[]> {
  await mockNetworkDelay();
  return [...MOCK_INVENTORY];
}

export async function getLowStock(): Promise<InventoryItem[]> {
  await mockNetworkDelay();
  return MOCK_INVENTORY.filter((item) => item.quantity <= item.minStock);
}
