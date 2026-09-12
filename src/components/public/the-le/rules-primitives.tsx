import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="display text-xl font-bold text-[#1c1b1b]">{title}</h2>
      {children}
    </section>
  );
}

export function DocSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[#1c1b1b]">{title}</h3>
      {children}
    </div>
  );
}

export function DocParagraph({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-[#424753]">{children}</p>;
}

export function DocBulletList({ items }: { items: string[] }) {
  return (
    <DocList>
      {items.map((item) => (
        <DocListItem key={item}>{item}</DocListItem>
      ))}
    </DocList>
  );
}

export function DocList({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-[#424753] marker:text-[#424753]">
      {children}
    </ul>
  );
}

export function DocListItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function DocNestedList({ items }: { items: { label: string; children: string[] }[] }) {
  return (
    <ul className="list-disc space-y-3 pl-5 text-[15px] leading-7 text-[#424753] marker:text-[#424753]">
      {items.map((item) => (
        <li key={item.label}>
          <span>{item.label}</span>
          <ul className="mt-2 list-[square] space-y-2 pl-5 marker:text-[#424753]">
            {item.children.map((child) => (
              <li key={child}>{child}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function DocTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: string[][];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full border-collapse border border-black/20 text-left text-sm")}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="bg-[#f8fafc]">
            {headers.map((header) => (
              <th key={header} scope="col" className="border border-black/20 px-3 py-2 font-semibold text-[#1c1b1b]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-black/20 px-3 py-2 text-[#424753]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocFootnote({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-6 text-[#424753]">{children}</p>;
}
