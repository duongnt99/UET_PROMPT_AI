-- Rename display copy only. Stable slugs, demo email domains and technical identifiers remain unchanged.
UPDATE "Competition"
SET
  "name" = CASE WHEN "isRehearsal" THEN 'AI Arena Vietnam (Diễn tập)' ELSE 'AI Arena Vietnam' END,
  "settings" = jsonb_set(
    jsonb_set(
      jsonb_set(
        replace(
          replace(
            replace(
              replace("settings"::text, 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'),
              'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'
            ),
            'AI Arena Vietnam 2026', 'AI Arena Vietnam'
          ),
          'Prompt-Off Vietnam', 'AI Arena Vietnam'
        )::jsonb,
        '{competitionName}',
        to_jsonb(CASE WHEN "isRehearsal" THEN 'AI Arena Vietnam (Diễn tập)' ELSE 'AI Arena Vietnam' END::text)
      ),
      '{landingHeroTitle}',
      '"AI Arena"'::jsonb
    ),
    '{landingHeroHighlight}',
    '"Vietnam"'::jsonb
  );

UPDATE "Announcement" SET
  "title" = replace(replace(replace("title", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam'),
  "excerpt" = replace(replace(replace("excerpt", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam'),
  "bodyMarkdown" = replace(replace(replace("bodyMarkdown", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam');

UPDATE "StaticPage" SET
  "title" = replace(replace(replace("title", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam'),
  "bodyMarkdown" = replace(replace(replace("bodyMarkdown", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam');

UPDATE "FAQ" SET
  "question" = replace(replace(replace("question", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam'),
  "answerMarkdown" = replace(replace(replace("answerMarkdown", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam');

UPDATE "Notification" SET
  "title" = replace(replace(replace("title", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam'),
  "body" = replace(replace(replace("body", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam');

UPDATE "EmailBatch" SET
  "subject" = replace(replace(replace("subject", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam'),
  "textContent" = replace(replace(replace("textContent", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam'),
  "htmlContent" = replace(replace(replace(replace("htmlContent", 'Prompt-Off: Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam 2026', 'AI Arena Vietnam'), 'AI Arena Vietnam 2026', 'AI Arena Vietnam'), 'Prompt-Off Vietnam', 'AI Arena Vietnam');
