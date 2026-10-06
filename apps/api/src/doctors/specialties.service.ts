import { Injectable } from '@nestjs/common';
import { AppError } from '../common/filters/global-exception.filter';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_SPECIALTIES: Record<string, string[]> = {
  uz: ['Terapevt', 'Ortoped', 'Ortodont', 'Jarroh', 'Implantolog', 'Parodontolog', 'Bolalar stomatologi', 'Gigiyenist'],
  'uz-Cyrl': ['Терапевт', 'Ортопед', 'Ортодонт', 'Жарроҳ', 'Имплантолог', 'Пародонтолог', 'Болалар стоматологи', 'Гигиенист'],
  ru: ['Терапевт', 'Ортопед', 'Ортодонт', 'Хирург', 'Имплантолог', 'Пародонтолог', 'Детский стоматолог', 'Гигиенист'],
  en: ['Therapist', 'Orthopedist', 'Orthodontist', 'Surgeon', 'Implantologist', 'Periodontist', 'Pediatric dentist', 'Hygienist'],
};

const MAX_NAME_LENGTH = 60;

export type DoctorSpecialtyDto = { id: string; name: string; doctorCount: number };

/** DoctorProfile.specialty holds several specialty names joined with ", ". */
export function splitSpecialties(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinSpecialties(names: string[]): string {
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))].join(', ');
}

function dedupe(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((n) => {
    const key = n.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeSpecialtyName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim();
  if (!name || name.length > MAX_NAME_LENGTH || name.includes(',')) {
    throw new AppError('INVALID_SPECIALTY_NAME', 'Invalid specialty name', 400);
  }
  return name;
}

@Injectable()
export class DoctorSpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clinicId: string, locale?: string): Promise<DoctorSpecialtyDto[]> {
    const doctors = await this.clinicDoctors(clinicId);
    let rows = await this.prisma.doctorSpecialty.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'asc' },
    });

    if (rows.length === 0) {
      const defaults = DEFAULT_SPECIALTIES[locale ?? ''] ?? DEFAULT_SPECIALTIES.uz;
      const inUse = doctors.flatMap((d) => splitSpecialties(d.specialty));
      await this.ensure(clinicId, [...defaults, ...inUse]);
      rows = await this.prisma.doctorSpecialty.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'asc' },
      });
    }

    const counts = new Map<string, number>();
    for (const d of doctors) {
      for (const name of splitSpecialties(d.specialty)) {
        const key = name.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      doctorCount: counts.get(r.name.toLowerCase()) ?? 0,
    }));
  }

  async create(clinicId: string, rawName: string): Promise<DoctorSpecialtyDto> {
    const name = normalizeSpecialtyName(rawName);
    await this.assertNameFree(clinicId, name);
    const row = await this.prisma.doctorSpecialty.create({ data: { clinicId, name } });
    return { id: row.id, name: row.name, doctorCount: 0 };
  }

  async rename(clinicId: string, id: string, rawName: string): Promise<DoctorSpecialtyDto> {
    const row = await this.requireRow(clinicId, id);
    const name = normalizeSpecialtyName(rawName);
    if (name !== row.name) await this.assertNameFree(clinicId, name, id);

    const oldKey = row.name.toLowerCase();
    const affected = (await this.clinicDoctors(clinicId)).filter((d) =>
      splitSpecialties(d.specialty).some((s) => s.toLowerCase() === oldKey),
    );
    const clinicSpecs = await this.clinicSpecializations(clinicId);

    await this.prisma.$transaction([
      this.prisma.doctorSpecialty.update({ where: { id }, data: { name } }),
      ...(clinicSpecs.some((s) => s.toLowerCase() === oldKey)
        ? [
            this.prisma.clinic.update({
              where: { id: clinicId },
              data: {
                specializations: dedupe(
                  clinicSpecs.map((s) => (s.toLowerCase() === oldKey ? name : s)),
                ),
              },
            }),
          ]
        : []),
      ...affected.map((d) =>
        this.prisma.doctorProfile.update({
          where: { id: d.id },
          data: {
            specialty: joinSpecialties(
              splitSpecialties(d.specialty).map((s) => (s.toLowerCase() === oldKey ? name : s)),
            ),
          },
        }),
      ),
    ]);

    return { id, name, doctorCount: affected.length };
  }

  /** Also removes the specialty from this clinic's doctors and its public profile. */
  async remove(clinicId: string, id: string): Promise<{ ok: true; affectedDoctors: number }> {
    const row = await this.requireRow(clinicId, id);
    const key = row.name.toLowerCase();
    const affected = (await this.clinicDoctors(clinicId)).filter((d) =>
      splitSpecialties(d.specialty).some((s) => s.toLowerCase() === key),
    );
    const clinicSpecs = await this.clinicSpecializations(clinicId);

    await this.prisma.$transaction([
      this.prisma.doctorSpecialty.delete({ where: { id } }),
      ...(clinicSpecs.some((s) => s.toLowerCase() === key)
        ? [
            this.prisma.clinic.update({
              where: { id: clinicId },
              data: { specializations: clinicSpecs.filter((s) => s.toLowerCase() !== key) },
            }),
          ]
        : []),
      ...affected.map((d) =>
        this.prisma.doctorProfile.update({
          where: { id: d.id },
          data: {
            specialty: joinSpecialties(
              splitSpecialties(d.specialty).filter((s) => s.toLowerCase() !== key),
            ),
          },
        }),
      ),
    ]);
    return { ok: true, affectedDoctors: affected.length };
  }

  /** Adds any missing names to the clinic catalog (case-insensitive). */
  async ensure(clinicId: string, names: string[]): Promise<void> {
    const existing = await this.prisma.doctorSpecialty.findMany({
      where: { clinicId },
      select: { name: true },
    });
    const known = new Set(existing.map((e) => e.name.toLowerCase()));
    const toCreate: string[] = [];
    for (const raw of names) {
      const name = raw.replace(/\s+/g, ' ').trim();
      if (!name || name.includes(',') || name.length > MAX_NAME_LENGTH) continue;
      if (known.has(name.toLowerCase())) continue;
      known.add(name.toLowerCase());
      toCreate.push(name);
    }
    if (toCreate.length) {
      await this.prisma.doctorSpecialty.createMany({
        data: toCreate.map((name) => ({ clinicId, name })),
        skipDuplicates: true,
      });
    }
  }

  private async clinicSpecializations(clinicId: string): Promise<string[]> {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { specializations: true },
    });
    return clinic?.specializations ?? [];
  }

  private clinicDoctors(clinicId: string) {
    return this.prisma.doctorProfile.findMany({
      where: { clinics: { some: { clinicId, isActive: true } } },
      select: { id: true, specialty: true },
    });
  }

  private async requireRow(clinicId: string, id: string) {
    const row = await this.prisma.doctorSpecialty.findFirst({ where: { id, clinicId } });
    if (!row) throw new AppError('NOT_FOUND', 'Specialty not found', 404);
    return row;
  }

  private async assertNameFree(clinicId: string, name: string, exceptId?: string) {
    const taken = await this.prisma.doctorSpecialty.findFirst({
      where: {
        clinicId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
    });
    if (taken) throw new AppError('SPECIALTY_EXISTS', 'Specialty already exists', 409);
  }
}
