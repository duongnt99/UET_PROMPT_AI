-- Preserve the old demo play-in matches and scores for audit, but hide them from
-- the official eight-team bracket. This only targets the known legacy demo codes.
UPDATE "Match" AS m
SET "publicStatus" = 'ARCHIVED'
FROM "FinalRound" AS r, "Competition" AS c
WHERE m."roundId" = r.id
  AND m."competitionId" = c.id
  AND c.slug = 'prompt-off-vietnam-2026'
  AND r.name = 'play-in'
  AND m.code IN ('PI1', 'PI2');

-- The old seed left QF1 and QF2 waiting for play-in winners. Put seeds 8 and 7
-- directly into those slots so seeds 1-8 form the complete quarter-final.
UPDATE "Match" AS m
SET "competitorBId" = f.id,
    version = m.version + 1
FROM "Finalist" AS f, "Competition" AS c
WHERE m."competitionId" = c.id
  AND f."competitionId" = c.id
  AND c.slug = 'prompt-off-vietnam-2026'
  AND m.code = 'QF1'
  AND m."competitorBId" IS NULL
  AND f.seed = 8;

UPDATE "Match" AS m
SET "competitorBId" = f.id,
    version = m.version + 1
FROM "Finalist" AS f, "Competition" AS c
WHERE m."competitionId" = c.id
  AND f."competitionId" = c.id
  AND c.slug = 'prompt-off-vietnam-2026'
  AND m.code = 'QF2'
  AND m."competitorBId" IS NULL
  AND f.seed = 7;

-- Normalize the legacy demo finalist list itself to seeds 1-8. These codes and
-- names are generated only by the old development seed.
UPDATE "Registration" AS r
SET status = 'SELECTED'
FROM "Competition" AS c
WHERE r."competitionId" = c.id
  AND c.slug = 'prompt-off-vietnam-2026'
  AND r.code = 'PO26-IND1000';

UPDATE "Registration" AS r
SET status = 'NOT_SELECTED'
FROM "Competition" AS c
WHERE r."competitionId" = c.id
  AND c.slug = 'prompt-off-vietnam-2026'
  AND r.code IN ('PO26-FIN9', 'PO26-FIN10');

UPDATE "Finalist" AS f
SET published = false,
    "publishedAt" = NULL
FROM "Registration" AS r, "Competition" AS c
WHERE f."registrationId" = r.id
  AND f."competitionId" = c.id
  AND c.slug = 'prompt-off-vietnam-2026'
  AND r.code IN ('PO26-FIN9', 'PO26-FIN10');
