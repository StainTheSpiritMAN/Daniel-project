import { Fragment } from 'react';
import {
  BACKGROUND_CLASS,
  type Background,
  type SectionConfig,
} from '@/lib/layout';

const TONE: Record<Background, 'light' | 'dark' | 'brand'> = {
  white: 'light',
  tint: 'light',
  dark: 'dark',
  brand: 'brand',
};

/**
 * A page section with the background chosen in the CMS layout. Sets
 * `data-tone` so headings and loose text inside stay readable on it.
 */
export function Section({
  config,
  className = 'section',
  children,
  id,
}: {
  config: SectionConfig;
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  const background = config.background ?? 'white';
  return (
    <section
      id={id}
      data-tone={TONE[background]}
      className={`${className} ${BACKGROUND_CLASS[background]}`}
    >
      {children}
    </section>
  );
}

/** Renders a page's visible sections in the configured order. */
export function Sections({
  layout,
  render,
}: {
  layout: SectionConfig[];
  render: Record<
    string,
    ((config: SectionConfig) => React.ReactNode) | undefined
  >;
}) {
  return (
    <>
      {layout
        .filter((s) => s.visible)
        .map((s) => (
          <Fragment key={s.key}>{render[s.key]?.(s)}</Fragment>
        ))}
    </>
  );
}
