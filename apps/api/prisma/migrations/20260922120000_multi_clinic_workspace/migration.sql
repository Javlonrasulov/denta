-- Multi-clinic workspace + employee permissions + doctor employment history

-- Enums
CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- RefreshToken workspace pinning
ALTER TABLE "RefreshToken"
  ADD COLUMN IF NOT EXISTS "activeClinicId" TEXT,
  ADD COLUMN IF NOT EXISTS "activeMembershipId" TEXT;

CREATE INDEX IF NOT EXISTS "RefreshToken_activeMembershipId_idx"
  ON "RefreshToken"("activeMembershipId");

-- ClinicMember employment + invite metadata
ALTER TABLE "ClinicMember"
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "invitedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ClinicMember"
  SET "startedAt" = COALESCE("joinedAt", "createdAt", CURRENT_TIMESTAMP)
  WHERE "startedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "ClinicMember_isActive_idx" ON "ClinicMember"("isActive");

ALTER TABLE "ClinicMember"
  DROP CONSTRAINT IF EXISTS "ClinicMember_invitedByUserId_fkey";

ALTER TABLE "ClinicMember"
  ADD CONSTRAINT "ClinicMember_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ClinicMemberPermission
CREATE TABLE IF NOT EXISTS "ClinicMemberPermission" (
  "id" TEXT NOT NULL,
  "clinicMemberId" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "effect" "PermissionEffect" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicMemberPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClinicMemberPermission_clinicMemberId_permission_key"
  ON "ClinicMemberPermission"("clinicMemberId", "permission");

CREATE INDEX IF NOT EXISTS "ClinicMemberPermission_clinicMemberId_idx"
  ON "ClinicMemberPermission"("clinicMemberId");

ALTER TABLE "ClinicMemberPermission"
  DROP CONSTRAINT IF EXISTS "ClinicMemberPermission_clinicMemberId_fkey";

ALTER TABLE "ClinicMemberPermission"
  ADD CONSTRAINT "ClinicMemberPermission_clinicMemberId_fkey"
  FOREIGN KEY ("clinicMemberId") REFERENCES "ClinicMember"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ClinicInvitation
CREATE TABLE IF NOT EXISTS "ClinicInvitation" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "specialty" TEXT,
  "tokenHash" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "permissions" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClinicInvitation_tokenHash_key" ON "ClinicInvitation"("tokenHash");
CREATE INDEX IF NOT EXISTS "ClinicInvitation_clinicId_status_idx" ON "ClinicInvitation"("clinicId", "status");
CREATE INDEX IF NOT EXISTS "ClinicInvitation_email_idx" ON "ClinicInvitation"("email");
CREATE INDEX IF NOT EXISTS "ClinicInvitation_phone_idx" ON "ClinicInvitation"("phone");

ALTER TABLE "ClinicInvitation"
  DROP CONSTRAINT IF EXISTS "ClinicInvitation_clinicId_fkey";
ALTER TABLE "ClinicInvitation"
  ADD CONSTRAINT "ClinicInvitation_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicInvitation"
  DROP CONSTRAINT IF EXISTS "ClinicInvitation_invitedById_fkey";
ALTER TABLE "ClinicInvitation"
  ADD CONSTRAINT "ClinicInvitation_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- DoctorClinic employment history
ALTER TABLE "DoctorClinic"
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3);

UPDATE "DoctorClinic"
  SET "startedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
  WHERE "startedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "DoctorClinic_isActive_idx" ON "DoctorClinic"("isActive");

-- DoctorSchedule clinic scope
ALTER TABLE "DoctorSchedule"
  ADD COLUMN IF NOT EXISTS "doctorClinicId" TEXT;

-- Backfill ClinicMember(DOCTOR) from active DoctorClinic links (no duplicates)
INSERT INTO "ClinicMember" (
  "id", "clinicId", "userId", "role", "isActive",
  "invitedAt", "joinedAt", "startedAt", "endedAt",
  "mustChangePassword", "createdAt", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text)::text,
  dc."clinicId",
  dp."userId",
  'DOCTOR'::"UserRole",
  dc."isActive",
  COALESCE(dc."createdAt", CURRENT_TIMESTAMP),
  CASE WHEN dc."isActive" THEN COALESCE(dc."createdAt", CURRENT_TIMESTAMP) ELSE NULL END,
  COALESCE(dc."startedAt", dc."createdAt", CURRENT_TIMESTAMP),
  dc."endedAt",
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "DoctorClinic" dc
JOIN "DoctorProfile" dp ON dp."id" = dc."doctorId"
WHERE NOT EXISTS (
  SELECT 1 FROM "ClinicMember" cm
  WHERE cm."clinicId" = dc."clinicId" AND cm."userId" = dp."userId"
);

-- Ensure UserRoleAssignment DOCTOR exists for linked doctors
INSERT INTO "UserRoleAssignment" ("id", "userId", "role", "clinicId", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text)::text,
  dp."userId",
  'DOCTOR'::"UserRole",
  dc."clinicId",
  CURRENT_TIMESTAMP
FROM "DoctorClinic" dc
JOIN "DoctorProfile" dp ON dp."id" = dc."doctorId"
WHERE NOT EXISTS (
  SELECT 1 FROM "UserRoleAssignment" ura
  WHERE ura."userId" = dp."userId"
    AND ura."role" = 'DOCTOR'::"UserRole"
    AND ura."clinicId" = dc."clinicId"
);

-- Backfill DoctorSchedule.doctorClinicId from first/active DoctorClinic per doctor
UPDATE "DoctorSchedule" ds
SET "doctorClinicId" = sub."doctorClinicId"
FROM (
  SELECT DISTINCT ON (dc."doctorId")
    dc."doctorId",
    dc."id" AS "doctorClinicId"
  FROM "DoctorClinic" dc
  ORDER BY dc."doctorId", dc."isActive" DESC, dc."createdAt" ASC
) sub
WHERE ds."doctorId" = sub."doctorId"
  AND ds."doctorClinicId" IS NULL;

ALTER TABLE "DoctorSchedule"
  DROP CONSTRAINT IF EXISTS "DoctorSchedule_doctorClinicId_fkey";

ALTER TABLE "DoctorSchedule"
  ADD CONSTRAINT "DoctorSchedule_doctorClinicId_fkey"
  FOREIGN KEY ("doctorClinicId") REFERENCES "DoctorClinic"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Replace unique constraint (doctorId, dayOfWeek) → (doctorClinicId, dayOfWeek)
ALTER TABLE "DoctorSchedule"
  DROP CONSTRAINT IF EXISTS "DoctorSchedule_doctorId_dayOfWeek_key";

DROP INDEX IF EXISTS "DoctorSchedule_doctorId_dayOfWeek_key";

CREATE UNIQUE INDEX IF NOT EXISTS "DoctorSchedule_doctorClinicId_dayOfWeek_key"
  ON "DoctorSchedule"("doctorClinicId", "dayOfWeek");

CREATE INDEX IF NOT EXISTS "DoctorSchedule_doctorClinicId_idx"
  ON "DoctorSchedule"("doctorClinicId");
