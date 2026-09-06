# Data model

See `prisma/schema.prisma`.

## Status transitions

Registration: DRAFT → SUBMITTED → NEEDS_UPDATE | UNDER_REVIEW | ELIGIBLE | INELIGIBLE | SELECTED | NOT_SELECTED | WITHDRAWN | LOCKED

Submission: DRAFT → SUBMITTED → UNDER_REVIEW → SCORED → LOCKED; NEEDS_UPDATE returns to editable versioning when admin reopens.

Review/Judge: ASSIGNED → DRAFT → SUBMITTED → LOCKED; reopen only SUPER_ADMIN with reason.

Match: DRAFT → SCHEDULED → CHECK_IN → READY → SPRINT → PITCH → SCORING → VERDICT → LOCKED → PUBLISHED → COMPLETED; TIE_REVIEW / NEEDS_VERDICT when scores equal.

## Important uniqueness

- `RegistrationSeat (userId, competitionId)` — one active registration per person
- `Registration.code` unique
- `ReviewAssignment (submissionVersionId, reviewerId)`
- `JudgeScore (assignmentId, competitorId)`
- Notification nội bộ gắn với `userId`; lời mời đội gắn trực tiếp với `inviteeId`
