import { cn } from "@/lib/utils";

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

function textWithLinks(text: string) {
  const content = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0];
    const start = match.index;
    if (start > cursor) content.push(text.slice(cursor, start));
    content.push(
      <a
        key={`${start}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[#2565c7] underline decoration-[#4285F4]/40 underline-offset-2 hover:text-[#174b9c]"
      >
        {url}
      </a>,
    );
    cursor = start + url.length;
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
