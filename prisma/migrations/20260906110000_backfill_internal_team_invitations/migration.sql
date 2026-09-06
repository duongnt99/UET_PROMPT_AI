UPDATE "TeamInvitation" AS invitation
SET "inviteeId" = account."id"
FROM "User" AS account
WHERE invitation."inviteeId" IS NULL
  AND invitation."status" = 'PENDING'
  AND lower(btrim(invitation."email")) = account."emailNormalized";

INSERT INTO "Notification" ("id", "userId", "title", "body", "href", "createdAt")
SELECT
  concat('team-invitation:', invitation."id"),
  invitation."inviteeId",
  'Lời mời tham gia đội',
  concat('Bạn được mời tham gia đội ', team."teamName", '.'),
  '/dashboard/doi-thi',
  invitation."createdAt"
FROM "TeamInvitation" AS invitation
JOIN "Team" AS team ON team."id" = invitation."teamId"
WHERE invitation."inviteeId" IS NOT NULL
  AND invitation."status" = 'PENDING'
  AND invitation."expiresAt" > CURRENT_TIMESTAMP
  AND NOT EXISTS (
    SELECT 1
    FROM "Notification" AS notification
    WHERE notification."id" = concat('team-invitation:', invitation."id")
  );
