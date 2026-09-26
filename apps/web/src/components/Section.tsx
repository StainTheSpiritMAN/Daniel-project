import Image from 'next/image';
import { Fragment } from 'react';
import { getSettings } from '@/lib/cms';
import {
  BACKGROUND_CLASS,
  DEFAULT_PHOTO_OPACITY,
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
 * A page section with the background chosen in the CMS layout: a colour, and
 * optionally a photo shown at the chosen visibility on top of that colour.
 * Sets `data-tone` so headings and loose text inside stay readable on it.
 */
export async function Section({
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
  const { media } = await getSettings();
  const photo = media(config.backgroundImageId);

  return (
    <section
      id={id}
      data-tone={TONE[background]}
      className={`${className} ${BACKGROUND_CLASS[background]} ${photo ? 'relative overflow-hidden' : ''}`}
    >
      {photo ? (
        <>
          <Image
            src={photo.path}
            alt=""
            fill
            sizes="100vw"
            className="pointer-events-none object-cover"
            style={{ opacity: (config.backgroundOpacity ?? DEFAULT_PHOTO_OPACITY) / 100 }}
          />
          <div className="relative">{children}</div>
        </>
      ) : (
        children
      )}
    </section>
  );
}

/** Renders a page's visible sections in the configured order. */
export function Sections({
  layout,
  render,
}: {
  layout: SectionConfig[];
  render: Record<string, ((config: SectionConfig) => React.ReactNode) | undefined>;
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
