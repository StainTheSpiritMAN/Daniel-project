import Link from 'next/link';
import type { Settings } from '@/lib/cms';
import { RichText } from './RichText';

export function CTASection({ cta }: { cta?: Settings['cta'] }) {
  if (!cta) return null;
  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-charcoal-900 px-8 py-14 text-center md:px-16">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gold/5" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              {cta.title}
            </h2>
            <RichText text={cta.body} className="mx-auto mt-4 max-w-xl text-charcoal-100/70" />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href={cta.primaryCta.href} className="btn-primary">
                {cta.primaryCta.label}
              </Link>
              <Link
                href={cta.secondaryCta.href}
                className="inline-flex items-center justify-center rounded-md border-2 border-white/30 px-6 py-3 font-semibold text-white transition hover:border-gold hover:text-gold"
              >
                {cta.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
