import { Injectable } from '@nestjs/common';
import { AppError } from '../common/filters/global-exception.filter';
import {
  mapRoomStatus,
  mapRoomStatusToPrisma,
} from '../common/utils/enum-map.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, PatchRoomDto } from './dto/rooms.dto';

export type RoomDto = {
  id: string;
  name: string;
  number: string;
  doctorId?: string;
  doctorName?: string;
  status: ReturnType<typeof mapRoomStatus>;
};

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clinicId: string): Promise<RoomDto[]> {
    const rooms = await this.prisma.room.findMany({
      where: { clinicId },
      include: {
        doctorLinks: {
          where: { isActive: true },
          include: {
            doctor: { include: { user: true } },
          },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    });
    return rooms.map((r) => this.toDto(r));
  }

  async create(clinicId: string, dto: CreateRoomDto) {
    try {
      const room = await this.prisma.room.create({
        data: {
          clinicId,
          branchId: dto.branchId,
          name: dto.name,
          number: dto.number,
        },
        include: {
          doctorLinks: {
            include: { doctor: { include: { user: true } } },
          },
        },
      });
      return this.toDto(room);
    } catch {
      throw new AppError('CONFLICT', 'Room number already exists', 409);
    }
  }

  async patch(clinicId: string, id: string, dto: PatchRoomDto) {
    const existing = await this.prisma.room.findFirst({
      where: { id, clinicId },
    });
    if (!existing) throw new AppError('NOT_FOUND', 'Room not found', 404);

    const room = await this.prisma.room.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.number !== undefined ? { number: dto.number } : {}),
        ...(dto.status !== undefined
          ? { status: mapRoomStatusToPrisma(dto.status) }
          : {}),
      },
      include: {
        doctorLinks: {
          where: { isActive: true },
          include: { doctor: { include: { user: true } } },
          take: 1,
        },
      },
    });
    return this.toDto(room);
  }

  private toDto(room: {
    id: string;
    name: string;
    number: string;
    status: import('@prisma/client').RoomStatus;
    doctorLinks: {
      doctor: { id: string; user: { firstName: string; lastName: string } };
    }[];
  }): RoomDto {
    const link = room.doctorLinks[0];
    return {
      id: room.id,
      name: room.name,
      number: room.number,
      status: mapRoomStatus(room.status),
      doctorId: link?.doctor.id,
      doctorName: link
        ? `${link.doctor.user.firstName} ${link.doctor.user.lastName}`.trim()
        : undefined,
    };
  }
}
