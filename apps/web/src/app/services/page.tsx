import type { Metadata } from 'next';
import Image from 'next/image';
import { CTASection } from '@/components/CTASection';
import { CheckIcon, serviceIcons } from '@/components/Icons';
import { services } from '@/data/company';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Smart home & building automation, power solutions & renewable energy, professional training, and IT & general consulting from Suburban Integrated Services.',
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-charcoal-900 py-16 text-white md:py-20">
        <Image
          src="/images/energy-platform.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/90 to-charcoal-900/60" />
        <div className="container relative">
          <span className="eyebrow text-gold-200">Our Services</span>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Solutions tailored to your needs
          </h1>
          <p className="mt-4 max-w-2xl text-charcoal-100/75">
            We deliver world-class services with a deep understanding of local
            challenges and global standards.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container space-y-20">
          {services.map((service, idx) => {
            const Icon = serviceIcons[service.slug];
            const reversed = idx % 2 === 1;
            return (
              <div
                key={service.slug}
                id={service.slug}
                className="scroll-mt-24 grid gap-8 lg:grid-cols-2 lg:items-center"
              >
                <div className={reversed ? 'lg:order-2' : ''}>
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold text-charcoal-900">
                    {Icon ? <Icon className="h-7 w-7" /> : null}
                  </span>
                  <h2 className="mt-5 text-2xl font-extrabold text-charcoal-900 md:text-3xl">
                    {service.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-charcoal-700">
                    {service.summary}
                  </p>
                </div>
                <div
                  className={`rounded-2xl border border-charcoal-100 bg-charcoal-50/50 p-8 ${
                    reversed ? 'lg:order-1' : ''
                  }`}
                >
                  <ul className="space-y-3">
                    {service.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-charcoal-800">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <CTASection />
    </>
  );
}
