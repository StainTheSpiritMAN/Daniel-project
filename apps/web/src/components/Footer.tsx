import Link from 'next/link';
import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';
import { navLinks } from '@/lib/navigation';
import type { Service, Settings } from '@/lib/cms';

export function Footer({
  company,
  services,
  logo,
}: {
  company?: Settings['company'];
  services: Service[];
  /** Uploaded logo for dark backgrounds, if any. */
  logo?: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-charcoal-900 text-charcoal-100">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light tagline={company?.tagline ?? ''} image={logo} name={company?.name} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal-100/70">
            {company?.intro}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-charcoal-100/70 transition hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
            Our Services
          </h4>
          <ul className="space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services#${s.slug}`}
                  className="text-charcoal-100/70 transition hover:text-gold"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
            Stay Updated
          </h4>
          <NewsletterForm />
          <div className="mt-5 space-y-1 text-sm text-charcoal-100/70">
            <p>{company?.phones.join(' · ')}</p>
            <p>{company?.emails[0]}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-charcoal-100/60 md:flex-row">
          <p>
            © {year} {company?.name}. All rights reserved.
          </p>
          <p>{company?.address}</p>
        </div>
      </div>
    </footer>
  );
}
