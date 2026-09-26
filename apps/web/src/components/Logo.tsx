import Link from 'next/link';
export function Logo({
  light = false,
  tagline,
}: {
  light?: boolean;
  tagline: string;
}) {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-lg font-black text-charcoal-900 shadow-sm transition group-hover:scale-105">
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
