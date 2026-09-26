import { Fragment, type ReactNode } from 'react';

/*
 * Renders the light formatting editors can use in long text fields:
 *
 *   **bold**   *italic*   [link text](https://example.com)
 *   - bullet list item        1. numbered list item
 *   (blank line = new paragraph, single line break = <br>)
 *
 * Text is turned into React elements — never injected as HTML — so nothing an
 * editor types can run as code. Links are limited to safe schemes.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s](?:[^*]*[^*\s])?\*|\[[^\]]+\]\([^)\s]+\))/g;

function safeHref(href: string) {
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  if (href.startsWith('#')) return href;
  return null;
}

function renderInline(text: string, key = '', links = true): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const k = `${key}${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={k}>{renderInline(part.slice(2, -2), `${k}-`, links)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={k}>{renderInline(part.slice(1, -1), `${k}-`, links)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      if (!href || !links) return <Fragment key={k}>{renderInline(link[1], `${k}-`, false)}</Fragment>;
      const external = /^https?:/i.test(href);
      return (
        <a
          key={k}
          href={href}
          className="font-semibold underline decoration-gold/60 underline-offset-2 hover:decoration-gold"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {renderInline(link[1], `${k}-`, false)}
        </a>
      );
    }
    return <Fragment key={k}>{part}</Fragment>;
  });
}

/**
 * Inline formatting only (for text inside a heading, label or list item).
 * Pass `links={false}` inside elements that are already links.
 */
export function InlineText({ text, links = true }: { text: string | undefined | null; links?: boolean }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderInline(line, `${i}-`, links)}
        </Fragment>
      ))}
    </>
  );
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

/**
 * Block formatting: paragraphs and lists. Each paragraph gets `className`
 * (so it can replace an existing `<p className=…>`).
 */
export function RichText({
  text,
  className,
}: {
  text: string | undefined | null;
  className?: string;
}) {
  if (!text) return null;
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim());
        if (lines.length && lines.every((l) => BULLET.test(l))) {
          return (
            <ul key={i} className={`list-disc space-y-1 pl-5 ${className ?? ''}`}>
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(BULLET, ''), `${i}-${j}-`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.length && lines.every((l) => NUMBER.test(l))) {
          return (
            <ol key={i} className={`list-decimal space-y-1 pl-5 ${className ?? ''}`}>
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(NUMBER, ''), `${i}-${j}-`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className={className}>
            <InlineText text={block} />
          </p>
        );
      })}
    </>
  );
}
