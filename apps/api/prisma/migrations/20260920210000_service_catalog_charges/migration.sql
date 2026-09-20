-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'OTHER';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ChargeStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable Service
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "translations" JSONB;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "defaultPriceUzs" INTEGER NOT NULL DEFAULT 150000;

CREATE UNIQUE INDEX IF NOT EXISTS "Service_nameKey_key" ON "Service"("nameKey");

-- AlterTable ClinicService
ALTER TABLE "ClinicService" ADD COLUMN IF NOT EXISTS "customName" TEXT;

-- CreateTable AppointmentCharge
CREATE TABLE IF NOT EXISTS "AppointmentCharge" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT,
    "doctorId" TEXT,
    "amountUzs" INTEGER NOT NULL,
    "paidAmountUzs" INTEGER NOT NULL DEFAULT 0,
    "remainingUzs" INTEGER NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'UNPAID',
    "patientName" TEXT,
    "doctorName" TEXT,
    "serviceName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentCharge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppointmentCharge_appointmentId_key" ON "AppointmentCharge"("appointmentId");
CREATE INDEX IF NOT EXISTS "AppointmentCharge_clinicId_status_idx" ON "AppointmentCharge"("clinicId", "status");
CREATE INDEX IF NOT EXISTS "AppointmentCharge_patientId_idx" ON "AppointmentCharge"("patientId");
CREATE INDEX IF NOT EXISTS "AppointmentCharge_doctorId_idx" ON "AppointmentCharge"("doctorId");

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "chargeId" TEXT;
CREATE INDEX IF NOT EXISTS "Payment_chargeId_idx" ON "Payment"("chargeId");

-- FKs (safe if already present)
DO $$ BEGIN
  ALTER TABLE "AppointmentCharge" ADD CONSTRAINT "AppointmentCharge_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AppointmentCharge" ADD CONSTRAINT "AppointmentCharge_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AppointmentCharge" ADD CONSTRAINT "AppointmentCharge_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AppointmentCharge" ADD CONSTRAINT "AppointmentCharge_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_chargeId_fkey"
    FOREIGN KEY ("chargeId") REFERENCES "AppointmentCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
