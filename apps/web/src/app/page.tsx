import Link from 'next/link';
import Image from 'next/image';
import { SectionHeading } from '@/components/SectionHeading';
import { ServiceCard } from '@/components/ServiceCard';
import { CTASection } from '@/components/CTASection';
import { ClientLogos } from '@/components/ClientLogos';
import { CheckIcon } from '@/components/Icons';
import {
  about,
  coreValues,
  mission,
  services,
  vision,
  whyChooseUs,
} from '@/data/company';

const stats = [
  { value: '17+', label: 'Years of combined leadership experience' },
  { value: '4', label: 'Core solution areas' },
  { value: '16+', label: 'Delivered projects' },
  { value: '100%', label: 'Indigenous Nigerian company' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal-900 text-white">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/video/lagos-skyline-hero-poster.jpg"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/video/lagos-skyline-hero.webm" type="video/webm" />
          <source src="/video/lagos-skyline-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900/85 via-charcoal-900/55 to-charcoal-900/15" />
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top_right,theme(colors.gold.500),transparent_55%)]" />
        <div className="absolute -right-24 top-1/2 hidden h-80 w-80 -translate-y-1/2 rounded-full border-[40px] border-gold/10 lg:block" />
        <div className="container relative grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-200">
              IT · Power · Energy · Consulting
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] md:text-5xl lg:text-6xl">
              Smart, sustainable{' '}
              <span className="text-gold">technology &amp; energy</span>{' '}
              solutions
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal-100/75">
              We deliver tailored, technology-driven, and energy-efficient
              solutions for homes, offices, institutions, and rural communities
              across Nigeria and beyond.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/contact" className="btn-primary">
                Request a Quote
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-md border-2 border-white/30 px-6 py-3 font-semibold text-white transition hover:border-gold hover:text-gold"
              >
                Our Services
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="text-3xl font-extrabold text-gold">
                  {s.value}
                </div>
                <p className="mt-1 text-sm text-charcoal-100/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Who We Are"
              title="A fully indigenous, technology-driven company"
            />
            <div className="mt-5 space-y-4 text-charcoal-700">
              <p>{about.paragraphs[1]}</p>
              <p>{about.paragraphs[2]}</p>
            </div>
            <Link
              href="/about"
              className="mt-6 inline-block font-semibold text-gold-700 hover:text-gold-600"
            >
              More about us →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {coreValues.slice(0, 4).map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-charcoal-100 bg-charcoal-50/50 p-5"
              >
                <h3 className="font-bold text-charcoal-900">{v.title}</h3>
                <p className="mt-1 text-sm text-charcoal-700">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section bg-charcoal-50/60">
        <div className="container">
          <SectionHeading
            center
            eyebrow="What We Do"
            title="Our Services"
            subtitle="From smart automation to renewable energy and professional training, we cover the full lifecycle of modern infrastructure."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section">
        <div className="container grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-gold p-8 text-charcoal-900 md:p-10">
            <h3 className="text-2xl font-extrabold">Our Mission</h3>
            <p className="mt-4 leading-relaxed">{mission}</p>
          </div>
          <div className="rounded-2xl bg-charcoal-900 p-8 text-white md:p-10">
            <h3 className="text-2xl font-extrabold text-gold">Our Vision</h3>
            <p className="mt-4 leading-relaxed text-charcoal-100/80">
              {vision}
            </p>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="section bg-charcoal-50/60">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg lg:aspect-auto lg:h-full lg:min-h-[26rem]">
              <Image
                src="/images/team/installation-team.jpg"
                alt="Suburban installation team in front of a completed inverter bank"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-900/80 to-transparent p-5">
                <p className="text-sm font-semibold text-white">
                  Our installation team on a completed power project
                </p>
              </div>
            </div>
            <div>
              <SectionHeading
                eyebrow="Why Choose Us"
                title="A partner you can rely on"
              />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {whyChooseUs.map((point) => (
                  <div
                    key={point.title}
                    className="flex gap-3 rounded-xl border border-charcoal-100 bg-white p-5"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-charcoal-900">
                        {point.title}
                      </h3>
                      <p className="mt-1 text-sm text-charcoal-700">
                        {point.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="section">
        <div className="container text-center">
          <SectionHeading
            center
            eyebrow="Our Clients"
            title="Trusted by leading organizations"
          />
          <ClientLogos />
        </div>
      </section>

      <CTASection />
    </>
  );
}
