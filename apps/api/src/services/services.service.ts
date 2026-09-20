import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppError } from '../common/filters/global-exception.filter';
import { PrismaService } from '../prisma/prisma.service';
import {
  MASTER_SERVICE_CATALOG,
  resolveServiceName,
} from './service-catalog';

export type ServiceListItemDto = {
  id: string;
  clinicServiceId?: string;
  name: string;
  nameKey: string | null;
  names?: Record<string, string>;
  category: string;
  durationMinutes: number;
  price: number;
  customName?: string | null;
  active: boolean;
};

export type CatalogServiceDto = {
  id: string;
  key: string;
  name: string;
  names: Record<string, string>;
  category: string;
  defaultDurationMinutes: number;
  defaultPriceUzs: number;
};

export type SetupClinicServiceItem = {
  serviceId: string;
  priceUzs?: number;
  durationMinutes?: number;
  customName?: string;
};

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ensure master catalog rows exist (idempotent). */
  async ensureMasterCatalog(): Promise<void> {
    for (const tpl of MASTER_SERVICE_CATALOG) {
      await this.prisma.service.upsert({
        where: { nameKey: tpl.nameKey },
        update: {
          name: tpl.translations.uz,
          translations: tpl.translations as Prisma.InputJsonValue,
          category: tpl.category,
          defaultDuration: tpl.defaultDuration,
          defaultPriceUzs: tpl.defaultPriceUzs,
          isActive: true,
        },
        create: {
          name: tpl.translations.uz,
          nameKey: tpl.nameKey,
          translations: tpl.translations as Prisma.InputJsonValue,
          category: tpl.category,
          defaultDuration: tpl.defaultDuration,
          defaultPriceUzs: tpl.defaultPriceUzs,
          isActive: true,
        },
      });
    }
  }

  async catalog(locale = 'uz'): Promise<CatalogServiceDto[]> {
    await this.ensureMasterCatalog();
    const rows = await this.prisma.service.findMany({
      where: { isActive: true, nameKey: { not: null } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return rows.map((row) => {
      const names =
        row.translations && typeof row.translations === 'object'
          ? (row.translations as Record<string, string>)
          : { uz: row.name, en: row.name };
      return {
        id: row.id,
        key: row.nameKey ?? row.id,
        name: resolveServiceName(row.translations, row.name, locale),
        names,
        category: row.category,
        defaultDurationMinutes: row.defaultDuration,
        defaultPriceUzs: row.defaultPriceUzs,
      };
    });
  }

  async list(clinicId: string, locale = 'uz'): Promise<ServiceListItemDto[]> {
    await this.ensureMasterCatalog();
    const rows = await this.prisma.clinicService.findMany({
      where: { clinicId, isActive: true },
      include: { service: true },
      orderBy: [
        { service: { category: 'asc' } },
        { service: { name: 'asc' } },
      ],
    });

    return rows.map((row) => {
      const resolved = resolveServiceName(
        row.service.translations,
        row.service.name,
        locale,
      );
      const names =
        row.service.translations && typeof row.service.translations === 'object'
          ? (row.service.translations as Record<string, string>)
          : undefined;
      return {
        id: row.serviceId,
        clinicServiceId: row.id,
        name: row.customName?.trim() || resolved,
        nameKey: row.service.nameKey,
        names,
        category: row.service.category,
        durationMinutes: row.durationMinutes,
        price: row.priceUzs,
        customName: row.customName,
        active: row.isActive,
      };
    });
  }

  async setupClinicServices(
    clinicId: string,
    items: SetupClinicServiceItem[],
  ): Promise<ServiceListItemDto[]> {
    if (!items.length) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Select at least one service',
        400,
      );
    }

    await this.ensureMasterCatalog();

    const serviceIds = items.map((i) => i.serviceId);
    const catalog = await this.prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });
    if (catalog.length !== serviceIds.length) {
      throw new AppError('NOT_FOUND', 'One or more services not found', 404);
    }
    const byId = new Map(catalog.map((s) => [s.id, s]));

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const master = byId.get(item.serviceId)!;
        await tx.clinicService.upsert({
          where: {
            clinicId_serviceId: {
              clinicId,
              serviceId: item.serviceId,
            },
          },
          update: {
            priceUzs: item.priceUzs ?? master.defaultPriceUzs,
            durationMinutes: item.durationMinutes ?? master.defaultDuration,
            customName: item.customName ?? null,
            isActive: true,
          },
          create: {
            clinicId,
            serviceId: item.serviceId,
            priceUzs: item.priceUzs ?? master.defaultPriceUzs,
            durationMinutes: item.durationMinutes ?? master.defaultDuration,
            customName: item.customName ?? null,
            isActive: true,
          },
        });
      }
    });

    return this.list(clinicId);
  }

  async upsertClinicService(
    clinicId: string,
    dto: {
      serviceId: string;
      priceUzs: number;
      durationMinutes: number;
      customName?: string;
      isActive?: boolean;
    },
  ): Promise<ServiceListItemDto> {
    const master = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true },
    });
    if (!master) throw new AppError('NOT_FOUND', 'Service not found', 404);

    await this.prisma.clinicService.upsert({
      where: {
        clinicId_serviceId: { clinicId, serviceId: dto.serviceId },
      },
      update: {
        priceUzs: dto.priceUzs,
        durationMinutes: dto.durationMinutes,
        customName: dto.customName ?? null,
        isActive: dto.isActive ?? true,
      },
      create: {
        clinicId,
        serviceId: dto.serviceId,
        priceUzs: dto.priceUzs,
        durationMinutes: dto.durationMinutes,
        customName: dto.customName ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    const list = await this.list(clinicId);
    const found = list.find((s) => s.id === dto.serviceId);
    if (!found) throw new AppError('UNKNOWN', 'Failed to upsert service', 500);
    return found;
  }
}
