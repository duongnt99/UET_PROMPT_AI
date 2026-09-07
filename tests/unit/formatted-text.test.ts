import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormattedText } from "@/components/public/formatted-text";

describe("formatted public text", () => {
  it("turns an absolute URL into a safe external link", () => {
    const html = renderToStaticMarkup(
      createElement(FormattedText, {
        text: "Xem tại https://example.com/path để biết thêm.",
      }),
    );

    expect(html).toContain('href="https://example.com/path"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("keeps separate paragraphs and escapes HTML", () => {
    const html = renderToStaticMarkup(
      createElement(FormattedText, {
        text: "Đoạn một\n\n<script>alert(1)</script>",
      }),
    );

    expect(html.match(/<p/g)).toHaveLength(2);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("renders simple bold emphasis without allowing raw HTML", () => {
    const html = renderToStaticMarkup(
      createElement(FormattedText, { text: "Ngày thi **03/11/2026**." }),
    );

    expect(html).toContain("<strong>03/11/2026</strong>");
  });
});
