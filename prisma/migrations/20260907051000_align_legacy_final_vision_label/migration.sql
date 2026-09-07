-- Older databases used VISION for the third final-round criterion.
-- Rename it only while the rubric has no submitted judge scores.
UPDATE "RubricCriterion" AS criterion
SET
  "titleVi" = 'Tiềm năng tác động',
  "titleEn" = 'Potential Impact',
  "description" = 'Mức độ giải quyết đúng bài toán và khả năng mở rộng.'
FROM "Rubric" AS rubric, "Competition" AS competition
WHERE criterion."rubricId" = rubric."id"
  AND criterion."code" = 'VISION'
  AND rubric."competitionId" = competition."id"
  AND rubric."stage" = 'FINAL'
  AND rubric."isActive" = true
  AND competition."isRehearsal" = false
  AND competition."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "JudgeScore" AS score
    WHERE score."rubricId" = rubric."id"
  );
