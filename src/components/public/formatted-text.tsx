import { cn } from "@/lib/utils";

const INLINE_PATTERN = /(\*\*([^*\n]+)\*\*|https?:\/\/[^\s<>"']+)/g;

function textWithLinks(text: string) {
  const content = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const token = match[0];
    const start = match.index;
    if (start > cursor) content.push(text.slice(cursor, start));
    if (match[2]) {
      content.push(<strong key={`${start}-${token}`}>{match[2]}</strong>);
    } else {
      content.push(
        <a
          key={`${start}-${token}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#2565c7] underline decoration-[#4285F4]/40 underline-offset-2 hover:text-[#174b9c]"
        >
          {token}
        </a>,
      );
    }
    cursor = start + token.length;
  }

  if (cursor < text.length) content.push(text.slice(cursor));
  return content;
}

export function FormattedText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .replaceAll("\r\n", "\n")
    .split(/\n[\t ]*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className={cn("space-y-3 break-words", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-line">
          {textWithLinks(paragraph)}
        </p>
      ))}
    </div>
  );
}
