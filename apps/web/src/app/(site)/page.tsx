import Link from 'next/link';
import { InlineText, RichText } from '@/components/RichText';
import Image from 'next/image';
import { SectionHeading } from '@/components/SectionHeading';
import { ServiceCard } from '@/components/ServiceCard';
import { CTASection } from '@/components/CTASection';
import { ClientLogos } from '@/components/ClientLogos';
import { CheckIcon } from '@/components/Icons';
import { Section, Sections } from '@/components/Section';
import {
  getClients,
  getCoreValues,
  getServices,
  getSettings,
  getWhyUs,
  type Settings,
} from '@/lib/cms';
import { COLUMNS_CLASS, resolveLayout } from '@/lib/layout';
import { mediaUrl } from '@/lib/media';

/** Renders the headline with the `highlight` phrase in gold, if present. */
function Headline({ hero }: { hero: Settings['hero'] }) {
  const at = hero.highlight ? hero.headline.indexOf(hero.highlight) : -1;
  if (!hero.highlight || at === -1) return <>{hero.headline}</>;
  return (
    <>
      {hero.headline.slice(0, at)}
      <span className="text-gold">{hero.highlight}</span>
      {hero.headline.slice(at + hero.highlight.length)}
    </>
  );
}

export default async function HomePage() {
  const [settings, services, coreValues, whyChooseUs, clients] =
    await Promise.all([
      getSettings(),
      getServices(),
      getCoreValues(),
      getWhyUs(),
      getClients(),
    ]);
  const { hero, home, missionVision, cta, media, layout } = settings;
  const video = media(hero?.videoId);
  const videoWebm = media(hero?.videoWebmId);
  const poster = media(hero?.posterId)?.path ?? video?.variants.poster;
  const whyImage = media(home?.whyImageId);
  // Overlay darkness (0–90); 60 reproduces the original 85% → 55% → 15% gradient.
  const shade = hero?.overlay ?? 60;
  const alpha = (n: number) =>
    `rgb(var(--charcoal-900) / ${Math.min(Math.max(n, 0), 100) / 100})`;

  return (
    <Sections
      layout={resolveLayout(layout, 'home')}
      render={{
        hero: () =>
          hero && (
            <section className="relative overflow-hidden bg-charcoal-900 text-white">
              {(video || videoWebm) && (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={mediaUrl(poster)}
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                >
                  {videoWebm && (
                    <source src={mediaUrl(videoWebm.path)} type="video/webm" />
                  )}
                  {video && (
                    <source src={mediaUrl(video.path)} type={video.mimeType} />
                  )}
                </video>
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, ${alpha(shade + 25)}, ${alpha(shade - 5)}, ${alpha(shade - 45)})`,
                }}
              />
              <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top_right,rgb(var(--gold-500)),transparent_55%)]" />
              <div className="absolute -right-24 top-1/2 hidden h-80 w-80 -translate-y-1/2 rounded-full border-[40px] border-gold/10 lg:block" />
              <div className="container relative grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
                <div>
                  <span className="inline-block rounded-full bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-200">
                    {hero.badge}
                  </span>
                  <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] md:text-5xl lg:text-6xl">
                    <Headline hero={hero} />
                  </h1>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal-100/75">
                    <InlineText text={hero.subtext} />
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link href={hero.primaryCta.href} className="btn-primary">
                      {hero.primaryCta.label}
                    </Link>
                    <Link
                      href={hero.secondaryCta.href}
                      className="inline-flex items-center justify-center rounded-md border-2 border-white/30 px-6 py-3 font-semibold text-white transition hover:border-gold hover:text-gold"
                    >
                      {hero.secondaryCta.label}
                    </Link>
                  </div>
                </div>

                {hero.stats.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {hero.stats.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                      >
                        <div className="text-3xl font-extrabold text-gold">
                          {s.value}
                        </div>
                        <p className="mt-1 text-sm text-charcoal-100/70">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ),

        about: (config) =>
          home && (
            <Section config={config}>
              <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
                <div>
                  <SectionHeading
                    eyebrow={home.aboutHeading.eyebrow}
                    title={home.aboutHeading.title}
                    subtitle={home.aboutHeading.subtitle}
                  />
                  <div className="mt-5 space-y-4 text-t-body">
                    {home.aboutParagraphs.map((p, i) => (
                      <RichText key={i} text={p} />
                    ))}
                  </div>
                  <Link
                    href="/about"
                    className="mt-6 inline-block font-semibold text-t-link hover:opacity-80"
                  >
                    More about us →
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {coreValues.slice(0, 4).map((v) => (
                    <div
                      key={v.id}
                      className="tone-card rounded-xl border border-charcoal-100 bg-charcoal-50/50 p-5"
                    >
                      <h3 className="font-bold text-charcoal-900">{v.title}</h3>
                      <p className="mt-1 text-sm text-charcoal-700">
                        <InlineText text={v.description} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          ),

        services: (config) =>
          services.length > 0 && (
            <Section config={config}>
              <div className="container">
                <SectionHeading
                  center
                  eyebrow={home?.servicesHeading.eyebrow}
                  title={home?.servicesHeading.title ?? ''}
                  subtitle={home?.servicesHeading.subtitle}
                />
                <div
                  className={`mt-12 grid gap-6 sm:grid-cols-2 ${COLUMNS_CLASS[config.columns ?? 4]}`}
                >
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            </Section>
          ),

        missionVision: (config) =>
          missionVision && (
            <Section config={config}>
              <div className="container grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-gold p-8 text-on-gold md:p-10">
                  <h3 className="text-2xl font-extrabold">Our Mission</h3>
                  <RichText
                    text={missionVision.mission}
                    className="mt-4 leading-relaxed"
                  />
                </div>
                <div className="rounded-2xl bg-charcoal-900 p-8 text-white ring-1 ring-white/10 md:p-10">
                  <h3 className="text-2xl font-extrabold text-gold">
                    Our Vision
                  </h3>
                  <RichText
                    text={missionVision.vision}
                    className="mt-4 leading-relaxed text-charcoal-100/80"
                  />
                </div>
              </div>
            </Section>
          ),

        whyUs: (config) =>
          whyChooseUs.length > 0 && (
            <Section config={config}>
              <div className="container">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                  {whyImage && (
                    <div
                      className={`relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg lg:aspect-auto lg:h-full lg:min-h-[26rem] ${
                        config.imagePosition === 'right' ? 'lg:order-2' : ''
                      }`}
                    >
                      <Image
                        src={whyImage.path}
                        alt={whyImage.alt}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                      {home?.whyImageCaption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-900/80 to-transparent p-5">
                          <p className="text-sm font-semibold text-white">
                            {home.whyImageCaption}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className={whyImage ? '' : 'lg:col-span-2'}>
                    <SectionHeading
                      eyebrow={home?.whyHeading.eyebrow}
                      title={home?.whyHeading.title ?? ''}
                      subtitle={home?.whyHeading.subtitle}
                    />
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {whyChooseUs.map((point) => (
                        <div
                          key={point.id}
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
                              <InlineText text={point.description} />
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          ),

        clients: (config) =>
          clients.length > 0 && (
            <Section config={config}>
              <div className="container text-center">
                <SectionHeading
                  center
                  eyebrow={home?.clientsHeading.eyebrow}
                  title={home?.clientsHeading.title ?? ''}
                  subtitle={home?.clientsHeading.subtitle}
                />
                <ClientLogos clients={clients} />
              </div>
            </Section>
          ),

        cta: (config) => <CTASection cta={cta} config={config} />,
      }}
    />
  );
}
