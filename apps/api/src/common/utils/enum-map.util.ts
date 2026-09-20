import {
  Gender,
  PatientClinicalStatus,
  PaymentMethod,
  PaymentStatus,
  RoomStatus,
  ToothCondition,
} from '@prisma/client';

export function mapGender(g: Gender | null | undefined): 'male' | 'female' {
  return g === Gender.FEMALE ? 'female' : 'male';
}

export function mapGenderToPrisma(
  g: 'male' | 'female' | undefined,
): Gender | undefined {
  if (!g) return undefined;
  return g === 'female' ? Gender.FEMALE : Gender.MALE;
}

export function mapClinicalStatus(
  s: PatientClinicalStatus,
): 'new' | 'treatment' | 'follow_up' | 'completed' | 'debt' {
  switch (s) {
    case PatientClinicalStatus.TREATMENT:
      return 'treatment';
    case PatientClinicalStatus.FOLLOW_UP:
      return 'follow_up';
    case PatientClinicalStatus.COMPLETED:
      return 'completed';
    case PatientClinicalStatus.DEBT:
      return 'debt';
    default:
      return 'new';
  }
}

export function mapToothCondition(
  c: ToothCondition,
):
  | 'healthy'
  | 'caries'
  | 'filled'
  | 'crown'
  | 'missing'
  | 'root_canal'
  | 'implant'
  | 'needs_treatment' {
  switch (c) {
    case ToothCondition.CARIES:
      return 'caries';
    case ToothCondition.FILLED:
      return 'filled';
    case ToothCondition.CROWN:
      return 'crown';
    case ToothCondition.MISSING:
      return 'missing';
    case ToothCondition.ROOT_CANAL:
      return 'root_canal';
    case ToothCondition.IMPLANT:
      return 'implant';
    case ToothCondition.NEEDS_TREATMENT:
      return 'needs_treatment';
    default:
      return 'healthy';
  }
}

export function mapToothConditionToPrisma(
  c: string,
): ToothCondition {
  switch (c) {
    case 'caries':
      return ToothCondition.CARIES;
    case 'filled':
      return ToothCondition.FILLED;
    case 'crown':
      return ToothCondition.CROWN;
    case 'missing':
      return ToothCondition.MISSING;
    case 'root_canal':
      return ToothCondition.ROOT_CANAL;
    case 'implant':
      return ToothCondition.IMPLANT;
    case 'needs_treatment':
      return ToothCondition.NEEDS_TREATMENT;
    default:
      return ToothCondition.HEALTHY;
  }
}

export function mapPaymentStatus(
  s: PaymentStatus,
): 'paid' | 'pending' | 'overdue' | 'partial' | 'cancelled' {
  switch (s) {
    case PaymentStatus.PAID:
      return 'paid';
    case PaymentStatus.OVERDUE:
      return 'overdue';
    case PaymentStatus.PARTIAL:
      return 'partial';
    case PaymentStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function mapPaymentMethod(
  m: PaymentMethod | null | undefined,
): 'card' | 'cash' | 'transfer' | 'other' | undefined {
  if (!m) return undefined;
  switch (m) {
    case PaymentMethod.CARD:
      return 'card';
    case PaymentMethod.TRANSFER:
      return 'transfer';
    case PaymentMethod.OTHER:
      return 'other';
    default:
      return 'cash';
  }
}

export function mapRoomStatus(
  s: RoomStatus,
): 'available' | 'occupied' | 'maintenance' {
  switch (s) {
    case RoomStatus.OCCUPIED:
      return 'occupied';
    case RoomStatus.MAINTENANCE:
      return 'maintenance';
    default:
      return 'available';
  }
}

export function mapRoomStatusToPrisma(
  s: 'available' | 'occupied' | 'maintenance',
): RoomStatus {
  switch (s) {
    case 'occupied':
      return RoomStatus.OCCUPIED;
    case 'maintenance':
      return RoomStatus.MAINTENANCE;
    default:
      return RoomStatus.AVAILABLE;
  }
}
