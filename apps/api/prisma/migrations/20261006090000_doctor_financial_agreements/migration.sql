-- CreateEnum
CREATE TYPE "DoctorFinanceModel" AS ENUM ('CLINIC_REVENUE', 'DOCTOR_REVENUE_PLUS_RENT', 'REVENUE_SHARE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DoctorAgreementStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'ENDED');

-- CreateEnum
CREATE TYPE "RentRecurrence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'INTERVAL', 'CUSTOM_SCHEDULE', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "RentIntervalUnit" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "RentDailyBasis" AS ENUM ('CALENDAR_DAYS', 'WORKING_DAYS');

-- CreateEnum
CREATE TYPE "RentObligationKind" AS ENUM ('RENT', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "RentObligationStatus" AS ENUM ('UPCOMING', 'DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DoctorRentPaymentKind" AS ENUM ('PAYMENT', 'PRIOR');

-- CreateEnum
CREATE TYPE "DoctorRentPaymentStatus" AS ENUM ('SUBMITTED', 'CONFIRMED', 'REJECTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "RevenueCollector" AS ENUM ('CLINIC', 'DOCTOR');

-- CreateEnum
CREATE TYPE "RevenueShareEntryKind" AS ENUM ('ACCRUAL', 'REVERSAL');

-- CreateEnum
CREATE TYPE "OverdueReminderFrequency" AS ENUM ('DAILY', 'EVERY_3_DAYS', 'WEEKLY', 'CUSTOM');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "collectedBy" "RevenueCollector" NOT NULL DEFAULT 'CLINIC',
ADD COLUMN     "refundOfId" TEXT;

-- CreateTable
CREATE TABLE "DoctorFinancialAgreement" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "doctorClinicId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "model" "DoctorFinanceModel" NOT NULL,
    "status" "DoctorAgreementStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "clinicShareBp" INTEGER NOT NULL,
    "rentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rentAmountUzs" INTEGER,
    "recurrence" "RentRecurrence",
    "intervalValue" INTEGER,
    "intervalUnit" "RentIntervalUnit",
    "dueDayOfWeek" INTEGER,
    "dueDayOfMonth" INTEGER,
    "dailyBasis" "RentDailyBasis",
    "oneTimeDueDate" DATE,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "prorateFirstPeriod" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorFinancialAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorAgreementScheduleItem" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "amountUzs" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "DoctorAgreementScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorServiceShareRule" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "clinicShareBp" INTEGER NOT NULL,

    CONSTRAINT "DoctorServiceShareRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorRentObligation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "doctorClinicId" TEXT NOT NULL,
    "agreementId" TEXT,
    "kind" "RentObligationKind" NOT NULL DEFAULT 'RENT',
    "periodKey" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "amountUzs" INTEGER NOT NULL,
    "paidUzs" INTEGER NOT NULL DEFAULT 0,
    "status" "RentObligationStatus" NOT NULL DEFAULT 'UPCOMING',
    "note" TEXT,
    "createdByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorRentObligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorRentPayment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "doctorClinicId" TEXT NOT NULL,
    "kind" "DoctorRentPaymentKind" NOT NULL DEFAULT 'PAYMENT',
    "status" "DoctorRentPaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "amountUzs" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "note" TEXT,
    "attachmentUrl" TEXT,
    "coveredFrom" DATE,
    "coveredTo" DATE,
    "createdByUserId" TEXT,
    "confirmedByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidedByUserId" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorRentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorRentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "amountUzs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),

    CONSTRAINT "DoctorRentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorRevenueShareEntry" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "doctorClinicId" TEXT NOT NULL,
    "agreementId" TEXT,
    "paymentId" TEXT NOT NULL,
    "kind" "RevenueShareEntryKind" NOT NULL,
    "amountUzs" INTEGER NOT NULL,
    "clinicShareUzs" INTEGER NOT NULL,
    "doctorShareUzs" INTEGER NOT NULL,
    "clinicShareBp" INTEGER NOT NULL,
    "collectedBy" "RevenueCollector" NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorRevenueShareEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorRentReminderSettings" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "remind3Days" BOOLEAN NOT NULL DEFAULT true,
    "remind1Day" BOOLEAN NOT NULL DEFAULT true,
    "remindDueDay" BOOLEAN NOT NULL DEFAULT true,
    "remindOverdue" BOOLEAN NOT NULL DEFAULT true,
    "overdueFrequency" "OverdueReminderFrequency" NOT NULL DEFAULT 'EVERY_3_DAYS',
    "overdueCustomDays" INTEGER,
    "notifyDoctor" BOOLEAN NOT NULL DEFAULT true,
    "notifyStaff" BOOLEAN NOT NULL DEFAULT true,
    "sendHour" INTEGER NOT NULL DEFAULT 9,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorRentReminderSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorRentReminderLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorRentReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorFinancialAgreement_clinicId_status_idx" ON "DoctorFinancialAgreement"("clinicId", "status");

-- CreateIndex
CREATE INDEX "DoctorFinancialAgreement_doctorClinicId_effectiveFrom_idx" ON "DoctorFinancialAgreement"("doctorClinicId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorFinancialAgreement_doctorClinicId_version_key" ON "DoctorFinancialAgreement"("doctorClinicId", "version");

-- CreateIndex
CREATE INDEX "DoctorAgreementScheduleItem_agreementId_idx" ON "DoctorAgreementScheduleItem"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorServiceShareRule_agreementId_serviceId_key" ON "DoctorServiceShareRule"("agreementId", "serviceId");

-- CreateIndex
CREATE INDEX "DoctorRentObligation_clinicId_status_dueDate_idx" ON "DoctorRentObligation"("clinicId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "DoctorRentObligation_doctorClinicId_dueDate_idx" ON "DoctorRentObligation"("doctorClinicId", "dueDate");

-- CreateIndex
CREATE INDEX "DoctorRentObligation_agreementId_idx" ON "DoctorRentObligation"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorRentObligation_doctorClinicId_periodKey_key" ON "DoctorRentObligation"("doctorClinicId", "periodKey");

-- CreateIndex
CREATE INDEX "DoctorRentPayment_clinicId_paidAt_idx" ON "DoctorRentPayment"("clinicId", "paidAt");

-- CreateIndex
CREATE INDEX "DoctorRentPayment_doctorClinicId_status_idx" ON "DoctorRentPayment"("doctorClinicId", "status");

-- CreateIndex
CREATE INDEX "DoctorRentAllocation_paymentId_idx" ON "DoctorRentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "DoctorRentAllocation_obligationId_idx" ON "DoctorRentAllocation"("obligationId");

-- CreateIndex
CREATE INDEX "DoctorRevenueShareEntry_clinicId_occurredAt_idx" ON "DoctorRevenueShareEntry"("clinicId", "occurredAt");

-- CreateIndex
CREATE INDEX "DoctorRevenueShareEntry_doctorClinicId_occurredAt_idx" ON "DoctorRevenueShareEntry"("doctorClinicId", "occurredAt");

-- CreateIndex
CREATE INDEX "DoctorRevenueShareEntry_paymentId_idx" ON "DoctorRevenueShareEntry"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorRentReminderSettings_clinicId_key" ON "DoctorRentReminderSettings"("clinicId");

-- CreateIndex
CREATE INDEX "DoctorRentReminderLog_clinicId_sentAt_idx" ON "DoctorRentReminderLog"("clinicId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorRentReminderLog_obligationId_userId_reminderKey_key" ON "DoctorRentReminderLog"("obligationId", "userId", "reminderKey");

-- CreateIndex
CREATE INDEX "Payment_refundOfId_idx" ON "Payment"("refundOfId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_refundOfId_fkey" FOREIGN KEY ("refundOfId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorFinancialAgreement" ADD CONSTRAINT "DoctorFinancialAgreement_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorFinancialAgreement" ADD CONSTRAINT "DoctorFinancialAgreement_doctorClinicId_fkey" FOREIGN KEY ("doctorClinicId") REFERENCES "DoctorClinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorAgreementScheduleItem" ADD CONSTRAINT "DoctorAgreementScheduleItem_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "DoctorFinancialAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorServiceShareRule" ADD CONSTRAINT "DoctorServiceShareRule_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "DoctorFinancialAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentObligation" ADD CONSTRAINT "DoctorRentObligation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentObligation" ADD CONSTRAINT "DoctorRentObligation_doctorClinicId_fkey" FOREIGN KEY ("doctorClinicId") REFERENCES "DoctorClinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentObligation" ADD CONSTRAINT "DoctorRentObligation_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "DoctorFinancialAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentPayment" ADD CONSTRAINT "DoctorRentPayment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentPayment" ADD CONSTRAINT "DoctorRentPayment_doctorClinicId_fkey" FOREIGN KEY ("doctorClinicId") REFERENCES "DoctorClinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentAllocation" ADD CONSTRAINT "DoctorRentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "DoctorRentPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentAllocation" ADD CONSTRAINT "DoctorRentAllocation_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "DoctorRentObligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRevenueShareEntry" ADD CONSTRAINT "DoctorRevenueShareEntry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRevenueShareEntry" ADD CONSTRAINT "DoctorRevenueShareEntry_doctorClinicId_fkey" FOREIGN KEY ("doctorClinicId") REFERENCES "DoctorClinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRevenueShareEntry" ADD CONSTRAINT "DoctorRevenueShareEntry_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "DoctorFinancialAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRevenueShareEntry" ADD CONSTRAINT "DoctorRevenueShareEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentReminderSettings" ADD CONSTRAINT "DoctorRentReminderSettings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorRentReminderLog" ADD CONSTRAINT "DoctorRentReminderLog_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "DoctorRentObligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Integrity guards (integer UZS, no negative balances, valid shares)
ALTER TABLE "DoctorFinancialAgreement" ADD CONSTRAINT "DoctorFinancialAgreement_share_chk" CHECK ("clinicShareBp" BETWEEN 0 AND 10000);
ALTER TABLE "DoctorFinancialAgreement" ADD CONSTRAINT "DoctorFinancialAgreement_rent_chk" CHECK ("rentAmountUzs" IS NULL OR "rentAmountUzs" > 0);
ALTER TABLE "DoctorFinancialAgreement" ADD CONSTRAINT "DoctorFinancialAgreement_range_chk" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom" - 1);
ALTER TABLE "DoctorServiceShareRule" ADD CONSTRAINT "DoctorServiceShareRule_share_chk" CHECK ("clinicShareBp" BETWEEN 0 AND 10000);
ALTER TABLE "DoctorAgreementScheduleItem" ADD CONSTRAINT "DoctorAgreementScheduleItem_amount_chk" CHECK ("amountUzs" > 0);
ALTER TABLE "DoctorRentObligation" ADD CONSTRAINT "DoctorRentObligation_amount_chk" CHECK ("amountUzs" > 0 AND "paidUzs" >= 0 AND "paidUzs" <= "amountUzs");
ALTER TABLE "DoctorRentPayment" ADD CONSTRAINT "DoctorRentPayment_amount_chk" CHECK ("amountUzs" > 0);
ALTER TABLE "DoctorRentAllocation" ADD CONSTRAINT "DoctorRentAllocation_amount_chk" CHECK ("amountUzs" > 0);
ALTER TABLE "DoctorRevenueShareEntry" ADD CONSTRAINT "DoctorRevenueShareEntry_sum_chk" CHECK ("clinicShareUzs" + "doctorShareUzs" = "amountUzs");