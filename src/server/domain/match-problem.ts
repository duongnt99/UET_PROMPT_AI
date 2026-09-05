export function normalizeMatchProblem(input: { title: string; prompt: string }) {
  const title = input.title.trim();
  const prompt = input.prompt.trim();
  if (!title) throw new Error("Cần tiêu đề đề thi.");
  if (!prompt) throw new Error("Cần nội dung đề thi hiển thị cho cả hai đội.");
  if (title.length > 200) throw new Error("Tiêu đề đề thi tối đa 200 ký tự.");
  if (prompt.length > 8000) throw new Error("Nội dung đề thi tối đa 8000 ký tự.");
  return { title, prompt };
}

export function matchProblemForDisplay(input: { title?: string | null; prompt?: string | null }) {
  const title = input.title?.trim() ?? "";
  const prompt = input.prompt?.trim() ?? "";
  if (!title && !prompt) return null;
  return { title, prompt };
}
