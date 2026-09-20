import { Injectable } from '@nestjs/common';
import { InventoryMovementType } from '@prisma/client';
import { AppError } from '../common/filters/global-exception.filter';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInventoryItemDto,
  InventoryMoveDto,
} from './dto/inventory.dto';

export type InventoryItemDto = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  minStock: number;
  supplier: string;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clinicId: string): Promise<InventoryItemDto[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { clinicId },
      include: { supplier: true },
      orderBy: { name: 'asc' },
    });
    return items.map((i) => this.toDto(i));
  }

  async create(clinicId: string, dto: CreateInventoryItemDto) {
    let supplierId: string | undefined;
    if (dto.supplier) {
      const existing = await this.prisma.supplier.findFirst({
        where: { clinicId, name: dto.supplier },
      });
      const supplier =
        existing ??
        (await this.prisma.supplier.create({
          data: { clinicId, name: dto.supplier },
        }));
      supplierId = supplier.id;
    }

    const item = await this.prisma.inventoryItem.create({
      data: {
        clinicId,
        name: dto.name,
        unit: dto.unit,
        quantity: dto.quantity,
        minimumStock: dto.minimumStock,
        purchasePriceUzs: dto.purchasePrice,
        supplierId,
      },
      include: { supplier: true },
    });
    return this.toDto(item);
  }

  async move(
    clinicId: string,
    itemId: string,
    dto: InventoryMoveDto,
    userId: string,
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, clinicId },
      include: { supplier: true },
    });
    if (!item) throw new AppError('NOT_FOUND', 'Inventory item not found', 404);

    let nextQty = item.quantity;
    if (dto.type === 'IN') nextQty += dto.quantity;
    else if (dto.type === 'OUT') nextQty -= dto.quantity;
    else nextQty = dto.quantity;

    if (nextQty < 0) {
      throw new AppError('INVALID_QUANTITY', 'Insufficient stock', 400);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.inventoryMovement.create({
        data: {
          itemId,
          type: dto.type as InventoryMovementType,
          quantity: dto.quantity,
          note: dto.note,
          createdBy: userId,
        },
      });
      return tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: nextQty },
        include: { supplier: true },
      });
    });

    return this.toDto(updated);
  }

  async lowStock(clinicId: string): Promise<InventoryItemDto[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { clinicId },
      include: { supplier: true },
    });
    return items
      .filter((i) => i.quantity <= i.minimumStock)
      .map((i) => this.toDto(i));
  }

  private toDto(item: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    purchasePriceUzs: number;
    minimumStock: number;
    supplier: { name: string } | null;
  }): InventoryItemDto {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      purchasePrice: item.purchasePriceUzs,
      minStock: item.minimumStock,
      supplier: item.supplier?.name ?? '',
    };
  }
}
