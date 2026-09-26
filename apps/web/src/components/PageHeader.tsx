import Image from 'next/image';
import type { CmsMedia } from '@/lib/cms';

type Heading = { eyebrow: string; title: string; subtitle?: string };

/**
 * Dark banner at the top of inner pages; optionally over a photo.
 * `overlay` (0–90) is how dark the photo is made; 75 matches the original look.
 */
export function PageHeader({
  heading,
  image,
  overlay = 75,
}: {
  heading?: Heading;
  image?: CmsMedia;
  overlay?: number;
}) {
  if (!heading) return null;
  return (
    <section
      className={`bg-charcoal-900 py-16 text-white md:py-20 ${
        image ? 'relative overflow-hidden' : ''
      }`}
    >
      {image && (
        <>
          <Image
            src={image.path}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ opacity: (100 - overlay) / 100 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/90 to-charcoal-900/60" />
        </>
      )}
      <div className={`container ${image ? 'relative' : ''}`}>
        <span className="eyebrow text-gold-200">{heading.eyebrow}</span>
        <h1 className="text-4xl font-extrabold md:text-5xl">{heading.title}</h1>
        {heading.subtitle && (
          <p className="mt-4 max-w-2xl text-charcoal-100/75">
            {heading.subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
