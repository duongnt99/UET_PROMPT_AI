-- Keep the public final-round criteria aligned with the approved Figma copy.
-- Existing scored rubrics are deliberately left untouched so historical totals remain valid.
UPDATE "RubricCriterion" AS criterion
SET
  "titleVi" = rubric_values."titleVi",
  "description" = rubric_values."description",
  "weight" = rubric_values."weight"
FROM (
  VALUES
    ('FEASIBILITY', 'Tính khả thi', 'Mức độ hoạt động của sản phẩm, tính hoàn thiện và trải nghiệm sử dụng.', 40.0000::decimal),
    ('CREATIVITY', 'Tính sáng tạo', 'Tính mới của ý tưởng và cách khai thác AI.', 30.0000::decimal),
    ('POTENTIAL_IMPACT', 'Tiềm năng tác động', 'Mức độ giải quyết đúng bài toán và khả năng mở rộng.', 30.0000::decimal)
) AS rubric_values("code", "titleVi", "description", "weight"),
"Rubric" AS rubric,
"Competition" AS competition
WHERE criterion."rubricId" = rubric."id"
  AND criterion."code" = rubric_values."code"
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
