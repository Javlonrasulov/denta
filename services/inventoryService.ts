import type { InventoryItem } from '@/types';
import {
  apiGet,
  apiPost,
  mockNetworkDelay,
  useMockApi,
} from './apiClient';
import { MOCK_INVENTORY } from '@/mocks/data';

let items: InventoryItem[] = MOCK_INVENTORY.map((i) => ({ ...i }));

export async function getInventory(): Promise<InventoryItem[]> {
  if (!useMockApi()) {
    return apiGet<InventoryItem[]>('/inventory');
  }
  await mockNetworkDelay();
  return items.map((i) => ({ ...i }));
}

export async function getLowStock(): Promise<InventoryItem[]> {
  if (!useMockApi()) {
    return apiGet<InventoryItem[]>('/inventory/low-stock');
  }
  await mockNetworkDelay();
  return items.filter((i) => i.quantity <= i.minStock);
}

export async function createInventoryItem(
  input: Omit<InventoryItem, 'id'>,
): Promise<InventoryItem> {
  if (!useMockApi()) {
    return apiPost<InventoryItem>('/inventory', input);
  }
  await mockNetworkDelay();
  const created = { ...input, id: `inv-${Date.now()}` };
  items = [created, ...items];
  return created;
}

export async function moveInventory(
  id: string,
  type: 'IN' | 'OUT' | 'ADJUSTMENT',
  quantity: number,
  note?: string,
): Promise<InventoryItem> {
  if (!useMockApi()) {
    return apiPost<InventoryItem>(`/inventory/${id}/move`, {
      type,
      quantity,
      note,
    });
  }
  await mockNetworkDelay();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) throw new Error('Not found');
  const current = items[index];
  let nextQty = current.quantity;
  if (type === 'IN') nextQty += quantity;
  else if (type === 'OUT') nextQty = Math.max(0, nextQty - quantity);
  else nextQty = quantity;
  const updated = { ...current, quantity: nextQty };
  items = [...items.slice(0, index), updated, ...items.slice(index + 1)];
  return updated;
}
