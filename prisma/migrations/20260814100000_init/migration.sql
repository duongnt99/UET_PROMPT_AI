-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TECH_OPERATOR', 'REVIEWER', 'JUDGE', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TentativeStatus" AS ENUM ('TENTATIVE', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "LivestreamStatus" AS ENUM ('HIDDEN', 'TENTATIVE', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "RegistrationMode" AS ENUM ('INDIVIDUAL', 'TEAM', 'BOTH', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('INDIVIDUAL', 'TEAM');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_UPDATE', 'ELIGIBLE', 'INELIGIBLE', 'UNDER_REVIEW', 'SELECTED', 'NOT_SELECTED', 'WITHDRAWN', 'LOCKED');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'DISBANDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REMOVED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED', 'UNDER_REVIEW', 'SCORED', 'NEEDS_UPDATE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "RubricStage" AS ENUM ('AUDITION', 'FINAL');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('ASSIGNED', 'DRAFT', 'SUBMITTED', 'DECLINED', 'REOPENED', 'LOCKED');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('STRONG_YES', 'YES', 'MAYBE', 'NO');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'CHECK_IN', 'READY', 'SPRINT', 'PITCH', 'SCORING', 'VERDICT', 'LOCKED', 'PUBLISHED', 'COMPLETED', 'CANCELLED', 'NEEDS_VERDICT', 'TIE_REVIEW');

-- CreateEnum
CREATE TYPE "MatchSlot" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('SPRINT', 'PITCH', 'VERDICT', 'MIXED', 'OTHER');

-- CreateEnum
CREATE TYPE "BracketMode" AS ENUM ('CUSTOM', 'SINGLE_ELIMINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TimerKind" AS ENUM ('SPRINT', 'PITCH', 'VERDICT');

-- CreateEnum
CREATE TYPE "TimerStatus" AS ENUM ('IDLE', 'RUNNING', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TwistStatus" AS ENUM ('DRAFT', 'READY', 'REVEALED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('STUDENT_PROOF', 'AVATAR', 'INTRO_VIDEO', 'SUPPORTING_DOCUMENT', 'SOURCE_ARCHIVE', 'PROMPT_LOG', 'BRANDING', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "userId" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "isRehearsal" BOOLEAN NOT NULL DEFAULT false,
    "clonedFromId" TEXT,
    "publicStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerAsset" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetId" TEXT,
    "imageUrl" TEXT,
    "href" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT '',
    "phoneNumber" TEXT,
    "institution" TEXT,
    "facultyOrDepartment" TEXT,
    "major" TEXT,
    "studentId" TEXT,
    "academicYear" TEXT,
    "provinceOrCity" TEXT,
    "shortBio" TEXT,
    "avatarAssetId" TEXT,
    "studentProofAssetId" TEXT,
    "consentToRules" BOOLEAN NOT NULL DEFAULT false,
    "consentToDataProcessing" BOOLEAN NOT NULL DEFAULT false,
    "consentToPublicFinalistProfile" BOOLEAN NOT NULL DEFAULT false,
    "consentToRulesAt" TIMESTAMP(3),
    "consentToDataProcessingAt" TIMESTAMP(3),
    "consentToPublicFinalistAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamCode" TEXT NOT NULL,
    "leaderUserId" TEXT NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'DRAFT',
    "shortIntroduction" TEXT,
    "institutionSummary" TEXT,
    "invitationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleLabel" TEXT,
    "status" "TeamMemberStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "inviteeId" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "teamId" TEXT,
    "type" "RegistrationType" NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "confirmationEmailKey" TEXT,
    "lastAutosavedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationSeat" (
    "userId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,

    CONSTRAINT "RegistrationSeat_pkey" PRIMARY KEY ("userId","competitionId")
);

-- CreateTable
CREATE TABLE "RegistrationStatusHistory" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "fromStatus" "RegistrationStatus",
    "toStatus" "RegistrationStatus" NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeadlineOverride" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT,
    "submissionId" TEXT,
    "kind" TEXT NOT NULL,
    "newDeadline" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeadlineOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityTag" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "confirmationEmailKey" TEXT,
    "lastAutosavedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionVersion" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "submissionTitle" TEXT NOT NULL DEFAULT '',
    "problemStatement" TEXT NOT NULL DEFAULT '',
    "targetUsers" TEXT NOT NULL DEFAULT '',
    "solutionSummary" TEXT NOT NULL DEFAULT '',
    "expectedImpact" TEXT NOT NULL DEFAULT '',
    "geminiUsageSummary" TEXT NOT NULL DEFAULT '',
    "promptingProcessSummary" TEXT NOT NULL DEFAULT '',
    "technicalApproach" TEXT NOT NULL DEFAULT '',
    "introVideoUrl" TEXT,
    "introVideoAssetId" TEXT,
    "deployedDemoUrl" TEXT,
    "repositoryUrl" TEXT,
    "designOrSlideUrl" TEXT,
    "supportingDocumentAssetId" TEXT,
    "sourceArchiveAssetId" TEXT,
    "promptLogAssetId" TEXT,
    "additionalNotes" TEXT,
    "originalityDeclaration" BOOLEAN NOT NULL DEFAULT false,
    "permissionToReviewPrivateLinks" BOOLEAN NOT NULL DEFAULT false,
    "isImmutable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT,
    "kind" "FileKind" NOT NULL DEFAULT 'OTHER',
    "visibility" "AssetVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubric" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "stage" "RubricStage" NOT NULL,
    "name" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "clonedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterion" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titleVi" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "weight" DECIMAL(7,4) NOT NULL,
    "minScore" DECIMAL(12,6) NOT NULL,
    "maxScore" DECIMAL(12,6) NOT NULL,
    "scoreStep" DECIMAL(12,6) NOT NULL,
    "guidance" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAssignment" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "submissionVersionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'ASSIGNED',
    "deadline" TIMESTAMP(3),
    "conflictDeclared" BOOLEAN NOT NULL DEFAULT false,
    "conflictNote" TEXT,
    "declineReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "reopenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReviewAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "overallComment" TEXT NOT NULL DEFAULT '',
    "recommendation" "Recommendation",
    "totalNormalized" DECIMAL(14,8) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewScoreItem" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "rawScore" DECIMAL(12,6) NOT NULL,
    "normalizedScore" DECIMAL(14,8) NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ReviewScoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectionSnapshot" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "lockedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelectionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finalist" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "seed" INTEGER,
    "displayName" TEXT NOT NULL,
    "institutionPublic" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finalist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalRound" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stageType" "StageType" NOT NULL DEFAULT 'MIXED',
    "scheduledAt" TIMESTAMP(3),
    "status" "RoundStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "competitorAId" TEXT,
    "competitorBId" TEXT,
    "winnerId" TEXT,
    "nextMatchId" TEXT,
    "nextSlot" "MatchSlot",
    "scheduledAt" TIMESTAMP(3),
    "actualStartedAt" TIMESTAMP(3),
    "actualEndedAt" TIMESTAMP(3),
    "status" "MatchStatus" NOT NULL DEFAULT 'DRAFT',
    "publicStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "isBye" BOOLEAN NOT NULL DEFAULT false,
    "bracketLocked" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgeAssignment" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JudgeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgeScore" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "overallComment" TEXT NOT NULL DEFAULT '',
    "totalNormalized" DECIMAL(14,8) NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "reopenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "JudgeScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgeScoreItem" (
    "id" TEXT NOT NULL,
    "judgeScoreId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "rawScore" DECIMAL(12,6) NOT NULL,
    "normalizedScore" DECIMAL(14,8) NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "JudgeScoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnStageTwist" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "matchId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "revealAt" TIMESTAMP(3),
    "revealedAt" TIMESTAMP(3),
    "status" "TwistStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnStageTwist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimerSession" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "kind" "TimerKind" NOT NULL,
    "status" "TimerStatus" NOT NULL DEFAULT 'IDLE',
    "durationSeconds" INTEGER NOT NULL,
    "remainingSnapshot" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "accumulatedPausedMs" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "bodyMarkdown" TEXT NOT NULL DEFAULT '',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answerMarkdown" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineItem" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "statusLabel" TEXT NOT NULL DEFAULT 'Dự kiến',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaticPage" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL DEFAULT '',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaticPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedModule" TEXT NOT NULL,
    "matchId" TEXT,
    "reporterId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupStatus" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT,
    "kind" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "responseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailNormalized_key" ON "User"("emailNormalized");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_idx" ON "RoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "RoleAssignment_role_idx" ON "RoleAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_idx" ON "VerificationToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_tokenHash_key" ON "StaffInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffInvitation_email_idx" ON "StaffInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthRateLimit_key_key" ON "AuthRateLimit"("key");

-- CreateIndex
CREATE INDEX "LoginEvent_email_createdAt_idx" ON "LoginEvent"("email", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE INDEX "Competition_isRehearsal_idx" ON "Competition"("isRehearsal");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantProfile_userId_key" ON "ParticipantProfile"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_type_idx" ON "ConsentRecord"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Team_invitationCode_key" ON "Team"("invitationCode");

-- CreateIndex
CREATE INDEX "Team_competitionId_status_idx" ON "Team"("competitionId", "status");

-- CreateIndex
CREATE INDEX "Team_leaderUserId_idx" ON "Team"("leaderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_competitionId_teamCode_key" ON "Team"("competitionId", "teamCode");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_tokenHash_key" ON "TeamInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "TeamInvitation_teamId_status_idx" ON "TeamInvitation"("teamId", "status");

-- CreateIndex
CREATE INDEX "TeamInvitation_email_idx" ON "TeamInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_teamId_key" ON "Registration"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_code_key" ON "Registration"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_confirmationEmailKey_key" ON "Registration"("confirmationEmailKey");

-- CreateIndex
CREATE INDEX "Registration_competitionId_status_idx" ON "Registration"("competitionId", "status");

-- CreateIndex
CREATE INDEX "Registration_ownerUserId_idx" ON "Registration"("ownerUserId");

-- CreateIndex
CREATE INDEX "Registration_submittedAt_idx" ON "Registration"("submittedAt");

-- CreateIndex
CREATE INDEX "Registration_code_idx" ON "Registration"("code");

-- CreateIndex
CREATE INDEX "RegistrationSeat_registrationId_idx" ON "RegistrationSeat"("registrationId");

-- CreateIndex
CREATE INDEX "RegistrationStatusHistory_registrationId_createdAt_idx" ON "RegistrationStatusHistory"("registrationId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalNote_registrationId_idx" ON "InternalNote"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityTag_registrationId_tag_key" ON "EntityTag"("registrationId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_currentVersionId_key" ON "Submission"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_confirmationEmailKey_key" ON "Submission"("confirmationEmailKey");

-- CreateIndex
CREATE INDEX "Submission_competitionId_status_idx" ON "Submission"("competitionId", "status");

-- CreateIndex
CREATE INDEX "Submission_registrationId_idx" ON "Submission"("registrationId");

-- CreateIndex
CREATE INDEX "Submission_submittedAt_idx" ON "Submission"("submittedAt");

-- CreateIndex
CREATE INDEX "SubmissionVersion_submissionId_idx" ON "SubmissionVersion"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVersion_submissionId_versionNumber_key" ON "SubmissionVersion"("submissionId", "versionNumber");

-- CreateIndex
CREATE INDEX "FileAsset_competitionId_idx" ON "FileAsset"("competitionId");

-- CreateIndex
CREATE INDEX "FileAsset_ownerUserId_idx" ON "FileAsset"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_bucket_objectKey_key" ON "FileAsset"("bucket", "objectKey");

-- CreateIndex
CREATE INDEX "Rubric_competitionId_stage_isActive_idx" ON "Rubric"("competitionId", "stage", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Rubric_competitionId_stage_versionNumber_key" ON "Rubric"("competitionId", "stage", "versionNumber");

-- CreateIndex
CREATE INDEX "RubricCriterion_rubricId_displayOrder_idx" ON "RubricCriterion"("rubricId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RubricCriterion_rubricId_code_key" ON "RubricCriterion"("rubricId", "code");

-- CreateIndex
CREATE INDEX "ReviewAssignment_reviewerId_status_idx" ON "ReviewAssignment"("reviewerId", "status");

-- CreateIndex
CREATE INDEX "ReviewAssignment_submissionId_idx" ON "ReviewAssignment"("submissionId");

-- CreateIndex
CREATE INDEX "ReviewAssignment_competitionId_idx" ON "ReviewAssignment"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewAssignment_submissionVersionId_reviewerId_key" ON "ReviewAssignment"("submissionVersionId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_assignmentId_key" ON "Review"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewScoreItem_reviewId_criterionId_key" ON "ReviewScoreItem"("reviewId", "criterionId");

-- CreateIndex
CREATE INDEX "SelectionSnapshot_competitionId_idx" ON "SelectionSnapshot"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Finalist_registrationId_key" ON "Finalist"("registrationId");

-- CreateIndex
CREATE INDEX "Finalist_competitionId_published_idx" ON "Finalist"("competitionId", "published");

-- CreateIndex
CREATE INDEX "Finalist_competitionId_seed_idx" ON "Finalist"("competitionId", "seed");

-- CreateIndex
CREATE INDEX "FinalRound_competitionId_idx" ON "FinalRound"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalRound_competitionId_order_key" ON "FinalRound"("competitionId", "order");

-- CreateIndex
CREATE INDEX "Match_competitionId_status_idx" ON "Match"("competitionId", "status");

-- CreateIndex
CREATE INDEX "Match_roundId_idx" ON "Match"("roundId");

-- CreateIndex
CREATE INDEX "Match_competitorAId_idx" ON "Match"("competitorAId");

-- CreateIndex
CREATE INDEX "Match_competitorBId_idx" ON "Match"("competitorBId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_competitionId_code_key" ON "Match"("competitionId", "code");

-- CreateIndex
CREATE INDEX "JudgeAssignment_judgeId_idx" ON "JudgeAssignment"("judgeId");

-- CreateIndex
CREATE INDEX "JudgeAssignment_competitionId_idx" ON "JudgeAssignment"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "JudgeAssignment_matchId_judgeId_key" ON "JudgeAssignment"("matchId", "judgeId");

-- CreateIndex
CREATE INDEX "JudgeScore_matchId_status_idx" ON "JudgeScore"("matchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "JudgeScore_assignmentId_competitorId_key" ON "JudgeScore"("assignmentId", "competitorId");

-- CreateIndex
CREATE UNIQUE INDEX "JudgeScoreItem_judgeScoreId_criterionId_key" ON "JudgeScoreItem"("judgeScoreId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "TimerSession_matchId_kind_key" ON "TimerSession"("matchId", "kind");

-- CreateIndex
CREATE INDEX "Announcement_status_publishAt_idx" ON "Announcement"("status", "publishAt");

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_competitionId_slug_key" ON "Announcement"("competitionId", "slug");

-- CreateIndex
CREATE INDEX "FAQ_competitionId_displayOrder_idx" ON "FAQ"("competitionId", "displayOrder");

-- CreateIndex
CREATE INDEX "TimelineItem_competitionId_displayOrder_idx" ON "TimelineItem"("competitionId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "StaticPage_competitionId_slug_key" ON "StaticPage"("competitionId", "slug");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_idempotencyKey_key" ON "EmailOutbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_scheduledAt_idx" ON "EmailOutbox"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Incident_competitionId_status_idx" ON "Incident"("competitionId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_competitionId_createdAt_idx" ON "AuditLog"("competitionId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_userId_action_key_key" ON "IdempotencyKey"("userId", "action", "key");

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvitation" ADD CONSTRAINT "StaffInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvitation" ADD CONSTRAINT "StaffInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginEvent" ADD CONSTRAINT "LoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerAsset" ADD CONSTRAINT "PartnerAsset_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProfile" ADD CONSTRAINT "ParticipantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderUserId_fkey" FOREIGN KEY ("leaderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationSeat" ADD CONSTRAINT "RegistrationSeat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationSeat" ADD CONSTRAINT "RegistrationSeat_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationStatusHistory" ADD CONSTRAINT "RegistrationStatusHistory_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineOverride" ADD CONSTRAINT "DeadlineOverride_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineOverride" ADD CONSTRAINT "DeadlineOverride_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineOverride" ADD CONSTRAINT "DeadlineOverride_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTag" ADD CONSTRAINT "EntityTag_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionVersion" ADD CONSTRAINT "SubmissionVersion_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "Rubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_submissionVersionId_fkey" FOREIGN KEY ("submissionVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ReviewAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewScoreItem" ADD CONSTRAINT "ReviewScoreItem_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewScoreItem" ADD CONSTRAINT "ReviewScoreItem_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "RubricCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectionSnapshot" ADD CONSTRAINT "SelectionSnapshot_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finalist" ADD CONSTRAINT "Finalist_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finalist" ADD CONSTRAINT "Finalist_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalRound" ADD CONSTRAINT "FinalRound_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "FinalRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitorAId_fkey" FOREIGN KEY ("competitorAId") REFERENCES "Finalist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitorBId_fkey" FOREIGN KEY ("competitorBId") REFERENCES "Finalist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Finalist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeAssignment" ADD CONSTRAINT "JudgeAssignment_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeAssignment" ADD CONSTRAINT "JudgeAssignment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeAssignment" ADD CONSTRAINT "JudgeAssignment_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeScore" ADD CONSTRAINT "JudgeScore_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "JudgeAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeScore" ADD CONSTRAINT "JudgeScore_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeScore" ADD CONSTRAINT "JudgeScore_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Finalist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeScore" ADD CONSTRAINT "JudgeScore_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeScoreItem" ADD CONSTRAINT "JudgeScoreItem_judgeScoreId_fkey" FOREIGN KEY ("judgeScoreId") REFERENCES "JudgeScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeScoreItem" ADD CONSTRAINT "JudgeScoreItem_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "RubricCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnStageTwist" ADD CONSTRAINT "OnStageTwist_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnStageTwist" ADD CONSTRAINT "OnStageTwist_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimerSession" ADD CONSTRAINT "TimerSession_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineItem" ADD CONSTRAINT "TimelineItem_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaticPage" ADD CONSTRAINT "StaticPage_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupStatus" ADD CONSTRAINT "BackupStatus_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

