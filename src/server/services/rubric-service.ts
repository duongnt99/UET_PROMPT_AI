import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import {
  assertRubricCriteria,
  parseRubricStage,
  type RubricCriterionInput,
  type RubricStage,
} from "@/server/domain/rubric";

async function rubricUsage(rubricId: string) {
  const [reviews, scores, snapshots] = await Promise.all([
    prisma.reviewAssignment.count({ where: { rubricId } }),
    prisma.judgeScore.count({ where: { rubricId } }),
    prisma.selectionSnapshot.count({ where: { rubricId } }),
  ]);
  return { reviews, scores, snapshots, total: reviews + scores + snapshots };
}

export async function isRubricMutable(rubricId: string) {
  const rubric = await prisma.rubric.findUnique({ where: { id: rubricId } });
  if (!rubric) throw new Error("Không tìm thấy rubric.");
  if (rubric.lockedAt) return false;
  const usage = await rubricUsage(rubricId);
  return usage.total === 0;
}

function criteriaCreateData(criteria: RubricCriterionInput[]) {
  return criteria.map((item, index) => ({
    code: item.code,
    titleVi: item.titleVi,
    titleEn: item.titleEn,
    description: item.description,
    guidance: item.guidance,
    weight: item.weight,
    minScore: item.minScore,
    maxScore: item.maxScore,
    scoreStep: item.scoreStep,
    displayOrder: index + 1,
    isRequired: item.isRequired,
  }));
}

export async function saveRubric(params: {
  actorUserId: string;
  id?: string;
  competitionId: string;
  stage: string;
  name: string;
  criteria: RubricCriterionInput[];
}) {
  const name = params.name.trim();
  if (name.length < 2) throw new Error("Tên rubric cần tối thiểu 2 ký tự.");
  const stage = parseRubricStage(params.stage);
  const criteria = assertRubricCriteria(params.criteria);
  const competition = await prisma.competition.findUnique({ where: { id: params.competitionId } });
  if (!competition || competition.deletedAt) throw new Error("Không tìm thấy cuộc thi.");

  if (!params.id) {
    const latest = await prisma.rubric.findFirst({
      where: { competitionId: params.competitionId, stage },
      orderBy: { versionNumber: "desc" },
    });
    const versionNumber = (latest?.versionNumber ?? 0) + 1;
    const created = await prisma.rubric.create({
      data: {
        competitionId: params.competitionId,
        stage,
        name,
        versionNumber,
        isActive: !latest,
        criteria: { create: criteriaCreateData(criteria) },
      },
    });
    await writeAuditLog({
      actorUserId: params.actorUserId,
      competitionId: params.competitionId,
      action: "rubric.create",
      entityType: "Rubric",
      entityId: created.id,
      after: { name, stage, versionNumber, criteriaCount: criteria.length },
    });
    return created;
  }

  const existing = await prisma.rubric.findUnique({ where: { id: params.id } });
  if (!existing) throw new Error("Không tìm thấy rubric.");
  if (!(await isRubricMutable(existing.id))) {
    throw new Error("Phiên bản này đã được dùng để chấm hoặc đã khóa. Hãy tạo phiên bản mới.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.rubricCriterion.deleteMany({ where: { rubricId: existing.id } });
    await tx.rubricCriterion.createMany({
      data: criteriaCreateData(criteria).map((item) => ({ ...item, rubricId: existing.id })),
    });
    await tx.rubric.update({
      where: { id: existing.id },
      data: { name },
    });
  });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: existing.competitionId,
    action: "rubric.update",
    entityType: "Rubric",
    entityId: existing.id,
    after: { name, stage, criteriaCount: criteria.length },
  });
  return existing;
}

export async function cloneRubric(params: { actorUserId: string; rubricId: string }) {
  const source = await prisma.rubric.findUnique({
    where: { id: params.rubricId },
    include: { criteria: { orderBy: { displayOrder: "asc" } } },
  });
  if (!source) throw new Error("Không tìm thấy rubric.");
  const latest = await prisma.rubric.findFirst({
    where: { competitionId: source.competitionId, stage: source.stage },
    orderBy: { versionNumber: "desc" },
  });
  const versionNumber = (latest?.versionNumber ?? source.versionNumber) + 1;
  const cloned = await prisma.rubric.create({
    data: {
      competitionId: source.competitionId,
      stage: source.stage,
      name: `${source.name.replace(/ v\d+$/i, "")} v${versionNumber}`,
      versionNumber,
      isActive: false,
      clonedFromId: source.id,
      criteria: {
        create: source.criteria.map((item, index) => ({
          code: item.code,
          titleVi: item.titleVi,
          titleEn: item.titleEn,
          description: item.description,
          guidance: item.guidance,
          weight: item.weight,
          minScore: item.minScore,
          maxScore: item.maxScore,
          scoreStep: item.scoreStep,
          displayOrder: index + 1,
          isRequired: item.isRequired,
        })),
      },
    },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: source.competitionId,
    action: "rubric.clone",
    entityType: "Rubric",
    entityId: cloned.id,
    after: { from: source.id, versionNumber },
  });
  return cloned;
}

export async function activateRubric(params: { actorUserId: string; rubricId: string }) {
  const rubric = await prisma.rubric.findUnique({
    where: { id: params.rubricId },
    include: { criteria: true },
  });
  if (!rubric) throw new Error("Không tìm thấy rubric.");
  assertRubricCriteria(
    rubric.criteria.map((item) => ({
      id: item.id,
      code: item.code,
      titleVi: item.titleVi,
      titleEn: item.titleEn,
      description: item.description,
      guidance: item.guidance,
      weight: item.weight.toString(),
      minScore: item.minScore.toString(),
      maxScore: item.maxScore.toString(),
      scoreStep: item.scoreStep.toString(),
      isRequired: item.isRequired,
    })),
  );
  await prisma.$transaction([
    prisma.rubric.updateMany({
      where: {
        competitionId: rubric.competitionId,
        stage: rubric.stage,
        isActive: true,
        id: { not: rubric.id },
      },
      data: { isActive: false },
    }),
    prisma.rubric.update({
      where: { id: rubric.id },
      data: { isActive: true },
    }),
  ]);
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: rubric.competitionId,
    action: "rubric.activate",
    entityType: "Rubric",
    entityId: rubric.id,
    after: { stage: rubric.stage, versionNumber: rubric.versionNumber },
  });
  return rubric;
}

export async function deleteRubric(params: { actorUserId: string; rubricId: string; reason: string }) {
  const rubric = await prisma.rubric.findUnique({ where: { id: params.rubricId } });
  if (!rubric) throw new Error("Không tìm thấy rubric.");
  if (rubric.isActive) throw new Error("Không xóa được rubric đang kích hoạt. Hãy kích hoạt phiên bản khác trước.");
  const usage = await rubricUsage(rubric.id);
  if (usage.total > 0) {
    throw new Error("Không xóa được rubric đã dùng để chấm hoặc khóa danh sách.");
  }
  await prisma.$transaction([
    prisma.rubricCriterion.deleteMany({ where: { rubricId: rubric.id } }),
    prisma.rubric.delete({ where: { id: rubric.id } }),
  ]);
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: rubric.competitionId,
    action: "rubric.delete",
    entityType: "Rubric",
    entityId: rubric.id,
    reason: params.reason,
    before: { name: rubric.name, stage: rubric.stage, versionNumber: rubric.versionNumber },
  });
}

export function defaultCriteriaTemplate(): RubricCriterionInput[] {
  return [
    {
      code: "FEASIBILITY",
      titleVi: "Tính khả thi",
      titleEn: "Feasibility",
      description: "Mức độ hoạt động của sản phẩm; tính hoàn thiện; khả năng sử dụng và trải nghiệm.",
      guidance: "Ưu tiên sản phẩm chạy được, có luồng người dùng rõ.",
      weight: "40",
      minScore: "0",
      maxScore: "10",
      scoreStep: "0.5",
      isRequired: true,
    },
    {
      code: "CREATIVITY",
      titleVi: "Tính sáng tạo",
      titleEn: "Creativity",
      description: "Tính mới của ý tưởng và cách khai thác AI.",
      guidance: "Đánh giá mức độ vượt khỏi mẫu giải pháp đơn giản.",
      weight: "30",
      minScore: "0",
      maxScore: "10",
      scoreStep: "0.5",
      isRequired: true,
    },
    {
      code: "POTENTIAL_IMPACT",
      titleVi: "Tiềm năng tác động",
      titleEn: "Potential Impact",
      description: "Mức độ giải quyết đúng bài toán và khả năng mở rộng.",
      guidance: "Cân nhắc giá trị xã hội/thị trường và hướng phát triển tiếp.",
      weight: "30",
      minScore: "0",
      maxScore: "10",
      scoreStep: "0.5",
      isRequired: true,
    },
  ];
}

export type { RubricStage };
