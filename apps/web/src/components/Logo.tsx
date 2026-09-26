import Link from 'next/link';

/**
 * Site logo. Shows the uploaded logo image when one is set in the CMS
 * (Appearance → Logo & icon), otherwise the original lettermark + wordmark.
 */
export function Logo({
  light = false,
  tagline,
  image,
  name,
}: {
  light?: boolean;
  tagline: string;
  /** URL of the uploaded logo for this background, if any. */
  image?: string;
  name?: string;
}) {
  if (image) {
    return (
      <Link href="/" className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name ?? 'Home'} className="h-10 w-auto max-w-[14rem] object-contain" />
      </Link>
    );
  }
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-lg font-black text-on-gold shadow-sm transition group-hover:scale-105">
        S
      </span>
      <span className="leading-tight">
        <span
          className={`block text-base font-extrabold tracking-tight ${
            light ? 'text-white' : 'text-charcoal-900'
          }`}
        >
          SUBURBAN
        </span>
        <span
          className={`block text-[10px] font-medium uppercase tracking-[0.18em] ${
            light ? 'text-gold-200' : 'text-gold-600'
          }`}
        >
          {tagline}
        </span>
      </span>
    </Link>
  );
}
