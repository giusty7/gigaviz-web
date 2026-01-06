import type { ReactNode } from "react";

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] };

function flushParagraph(blocks: MarkdownBlock[], buffer: string[]) {
  if (buffer.length === 0) return;
  const content = buffer.join(" ").trim();
  if (content) {
    blocks.push({ type: "paragraph", content });
  }
  buffer.length = 0;
}

function flushList(blocks: MarkdownBlock[], buffer: string[]) {
  if (buffer.length === 0) return;
  blocks.push({ type: "list", items: [...buffer] });
  buffer.length = 0;
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const paragraphBuffer: string[] = [];
  const listBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(blocks, paragraphBuffer);
      flushList(blocks, listBuffer);
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph(blocks, paragraphBuffer);
      flushList(blocks, listBuffer);
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ type: "heading", level, content: headingMatch[2] });
      continue;
    }

    const listMatch = /^[-*]\s+(.*)$/.exec(trimmed);
    if (listMatch) {
      flushParagraph(blocks, paragraphBuffer);
      listBuffer.push(listMatch[1]);
      continue;
    }

    flushList(blocks, listBuffer);
    paragraphBuffer.push(trimmed);
  }

  flushParagraph(blocks, paragraphBuffer);
  flushList(blocks, listBuffer);

  return blocks;
}

function renderInline(text: string) {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      const content = token.slice(2, -2);
      nodes.push(<strong key={`bold-${nodes.length}`}>{content}</strong>);
    } else {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        nodes.push(
          <a
            key={`link-${nodes.length}`}
            href={href}
            className="text-[color:var(--gv-accent)] hover:underline"
          >
            {label}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function renderMarkdown(markdown: string) {
  const blocks = parseMarkdown(markdown);

  return blocks.map((block, index) => {
    if (block.type === "heading") {
      const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
      const className =
        block.level === 1
          ? "text-2xl font-semibold text-[color:var(--gv-text)]"
          : block.level === 2
          ? "text-xl font-semibold text-[color:var(--gv-text)]"
          : "text-lg font-semibold text-[color:var(--gv-text)]";

      return (
        <Tag key={`heading-${index}`} className={className}>
          {renderInline(block.content)}
        </Tag>
      );
    }

    if (block.type === "list") {
      return (
        <ul
          key={`list-${index}`}
          className="list-disc space-y-2 pl-5 text-sm text-[color:var(--gv-muted)]"
        >
          {block.items.map((item, itemIndex) => (
            <li key={`list-${index}-${itemIndex}`}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p
        key={`paragraph-${index}`}
        className="text-sm leading-relaxed text-[color:var(--gv-muted)]"
      >
        {renderInline(block.content)}
      </p>
    );
  });
}
