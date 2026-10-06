-- AlterTable
ALTER TABLE "ClinicMember" ADD COLUMN "lastAppSeenAt" TIMESTAMP(3),
ADD COLUMN "lastAppPlatform" TEXT;

-- Backfill from mobile sessions issued for the membership (login / token refresh).
UPDATE "ClinicMember" m
SET "lastAppSeenAt" = s."seenAt",
    "lastAppPlatform" = s."platform"
FROM (
  SELECT DISTINCT ON (rt."activeMembershipId")
    rt."activeMembershipId" AS "membershipId",
    GREATEST(rt."createdAt", rt."lastUsedAt") AS "seenAt",
    CASE
      WHEN lower(coalesce(rt."platform", '')) IN ('android', 'ios') THEN lower(rt."platform")
      WHEN rt."userAgent" ~* '(okhttp|dalvik)' THEN 'android'
      ELSE 'ios'
    END AS "platform"
  FROM "RefreshToken" rt
  WHERE rt."activeMembershipId" IS NOT NULL
    AND (
      lower(coalesce(rt."platform", '')) IN ('android', 'ios')
      OR rt."userAgent" ~* '(okhttp|dalvik|cfnetwork|expo)'
    )
  ORDER BY rt."activeMembershipId", GREATEST(rt."createdAt", rt."lastUsedAt") DESC
) s
WHERE m."id" = s."membershipId";
