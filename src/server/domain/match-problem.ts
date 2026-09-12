import { FIELD_LIMITS } from "@/config/field-limits";

export function normalizeMatchProblem(input: { title: string; prompt: string }) {
  const title = input.title.trim();
  const prompt = input.prompt.trim();
  if (!title) throw new Error("Cần tiêu đề đề thi.");
  if (!prompt) throw new Error("Cần nội dung đề thi hiển thị cho cả hai đội.");
  if (title.length > FIELD_LIMITS.PROBLEM_TITLE) {
    throw new Error(`Tiêu đề đề thi tối đa ${FIELD_LIMITS.PROBLEM_TITLE} ký tự.`);
  }
  if (prompt.length > FIELD_LIMITS.PROBLEM_PROMPT) {
    throw new Error(`Nội dung đề thi tối đa ${FIELD_LIMITS.PROBLEM_PROMPT} ký tự.`);
  }
  return { title, prompt };
}

export function matchProblemForDisplay(input: { title?: string | null; prompt?: string | null }) {
  const title = input.title?.trim() ?? "";
  const prompt = input.prompt?.trim() ?? "";
  if (!title && !prompt) return null;
  return { title, prompt };
}
