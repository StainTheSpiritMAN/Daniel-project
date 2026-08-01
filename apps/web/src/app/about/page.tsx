import type { Metadata } from 'next';
import Image from 'next/image';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import {
  about,
  ceo,
  coreValues,
  management,
  mission,
  vision,
} from '@/data/company';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Suburban Integrated Services Limited — a fully indigenous, technology-driven company delivering IT, power, and renewable energy solutions.',
};

function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="bg-charcoal-900 py-16 text-white md:py-20">
      <div className="container">
        <span className="eyebrow text-gold-200">{eyebrow}</span>
        <h1 className="text-4xl font-extrabold md:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-charcoal-100/75">{subtitle}</p>
        )}
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Company"
        title="About Suburban Integrated Services"
        subtitle="Empowering individuals, businesses, and communities through technology, innovation, and sustainable infrastructure."
      />

      {/* Company overview */}
      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5 leading-relaxed text-charcoal-700">
            {about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/projects/inverter-bank-installation.jpg"
              alt="Inverter and battery bank installation delivered by our engineers"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Consultancy + Expertise */}
      <section className="section bg-charcoal-50/60">
        <div className="container grid gap-8 md:grid-cols-2">
          {[about.consultancy, about.expertise].map((block) => (
            <div
              key={block.title}
              className="rounded-2xl border border-charcoal-100 bg-white p-8"
            >
              <h3 className="text-xl font-bold text-charcoal-900">
                {block.title}
              </h3>
              <p className="mt-3 leading-relaxed text-charcoal-700">
                {block.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CEO statement */}
      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-gold p-8 text-charcoal-900">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-charcoal-900 text-2xl font-black text-gold">
                {ceo.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <p className="mt-5 text-lg font-bold italic">
                “{ceo.thankYou}”
              </p>
              <p className="mt-6 font-extrabold">{ceo.name}</p>
              <p className="text-sm font-medium">{ceo.title}</p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <SectionHeading eyebrow="CEO Statement" title="A message from our CEO" />
            <div className="mt-5 space-y-4 leading-relaxed text-charcoal-700">
              {ceo.statement.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section bg-charcoal-50/60">
        <div className="container grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-8 ring-1 ring-charcoal-100">
            <h3 className="text-2xl font-extrabold text-gold-700">Mission</h3>
            <p className="mt-4 leading-relaxed text-charcoal-700">{mission}</p>
          </div>
          <div className="rounded-2xl bg-white p-8 ring-1 ring-charcoal-100">
            <h3 className="text-2xl font-extrabold text-gold-700">Vision</h3>
            <p className="mt-4 leading-relaxed text-charcoal-700">{vision}</p>
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="section">
        <div className="container">
          <SectionHeading center eyebrow="Core Values" title="What drives us" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((v, i) => (
              <div
                key={v.title}
                className="rounded-xl border border-charcoal-100 p-6"
              >
                <div className="text-3xl font-black text-gold-200">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-2 text-lg font-bold text-charcoal-900">
                  {v.title}
                </h3>
                <p className="mt-1 text-sm text-charcoal-700">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Management */}
      <section className="section bg-charcoal-50/60">
        <div className="container">
          <SectionHeading
            center
            eyebrow="Management"
            title="Meet our leadership"
          />
          <div className="mt-12 space-y-8">
            {management.map((m) => (
              <div
                key={m.name}
                className="grid gap-6 rounded-2xl border border-charcoal-100 bg-white p-8 md:grid-cols-4"
              >
                <div className="md:col-span-1">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold text-2xl font-black text-charcoal-900">
                    {m.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-charcoal-900">
                    {m.name}
                  </h3>
                  <p className="text-sm font-medium text-gold-700">{m.role}</p>
                </div>
                <div className="space-y-3 text-sm leading-relaxed text-charcoal-700 md:col-span-3">
                  {m.bio.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
