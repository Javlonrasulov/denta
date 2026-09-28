-- CreateTable
CREATE TABLE "LegalConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT,
    "context" TEXT NOT NULL DEFAULT 'CLINIC_REGISTRATION',
    "termsVersion" TEXT NOT NULL,
    "privacyVersion" TEXT NOT NULL,
    "locale" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalConsent_userId_idx" ON "LegalConsent"("userId");

-- CreateIndex
CREATE INDEX "LegalConsent_clinicId_idx" ON "LegalConsent"("clinicId");

-- CreateIndex
CREATE INDEX "LegalConsent_termsVersion_privacyVersion_idx" ON "LegalConsent"("termsVersion", "privacyVersion");

-- AddForeignKey
ALTER TABLE "LegalConsent" ADD CONSTRAINT "LegalConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalConsent" ADD CONSTRAINT "LegalConsent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
