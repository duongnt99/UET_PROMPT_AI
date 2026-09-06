# Requirements traceability

| Requirement | Module | Route | Entities | Tests | Status |
| --- | --- | --- | --- | --- | --- |
| Public site | content | `/` and public pages | Competition, FAQ, Timeline, Announcement, StaticPage | unit content via settings | implemented |
| Auth | auth-service | `/dang-ky` `/dang-nhap` | User | unit credentials + integration (if DB) | implemented; no email verification |
| Registration | registration-service | `/dashboard/dang-ky` | Registration, Team, Seat | unit registration-rules | implemented |
| Submission | submission-service | `/dashboard/audition` | Submission, SubmissionVersion | unit submission-rules | implemented |
| Admin PII export | admin-actions | `/admin/exports` `/api/admin/export-registrations` | Registration, AuditLog | audit write | implemented |
| Rubric/scoring | scoring.ts review-service | `/reviewer` `/admin/rubrics` | Rubric, Review | unit scoring | implemented |
| Finalists | finalist-service | `/admin/finalists` `/finalists` | Finalist, SelectionSnapshot | — | implemented |
| Bracket/judge | match-service | `/admin/bracket` `/judge` | Match, JudgeScore | unit bracket | implemented |
| Stage/overlay | match-service | `/stage/*` `/overlay/*` | TimerSession, Twist | unit timer | implemented |
| Health | api | `/api/health` | — | — | implemented |
