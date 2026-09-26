import type { Metadata } from 'next';
import { InlineText, RichText } from '@/components/RichText';
import Image from 'next/image';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
import { PageHeader } from '@/components/PageHeader';
import { getCoreValues, getSettings, getTeam, type CmsMedia } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getSettings();
  return { title: 'About', description: about?.metaDescription };
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

/** Round portrait, or initials on a coloured disc when no photo is set. */
function Avatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo?: CmsMedia | null;
  className: string;
}) {
  if (photo) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-full">
        <Image src={photo.path} alt={photo.alt || name} fill sizes="80px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black ${className}`}>
      {initials(name)}
    </div>
  );
}

export default async function AboutPage() {
  const [settings, coreValues, management] = await Promise.all([
    getSettings(),
    getCoreValues(),
    getTeam(),
  ]);
  const { about, ceo, missionVision, cta, media } = settings;
  const aboutImage = media(about?.imageId);

  return (
    <>
      <PageHeader heading={about?.header} />

      {about && (
        <>
          {/* Company overview */}
          <section className="section">
            <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-5 leading-relaxed text-charcoal-700">
                {about.paragraphs.map((p, i) => (
                  <RichText key={i} text={p} />
                ))}
              </div>
              {aboutImage && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    src={aboutImage.path}
                    alt={aboutImage.alt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
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
                  <RichText text={block.body} className="mt-3 leading-relaxed text-charcoal-700" />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* CEO statement */}
      {ceo && (
        <section className="section">
          <div className="container grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="rounded-2xl bg-gold p-8 text-on-gold">
                <Avatar
                  name={ceo.name}
                  photo={media(ceo.photoId)}
                  className="bg-charcoal-900 text-gold"
                />
                <p className="mt-5 text-lg font-bold italic">
                  “<InlineText text={ceo.thankYou} />”
                </p>
                <p className="mt-6 font-extrabold">{ceo.name}</p>
                <p className="text-sm font-medium">{ceo.title}</p>
              </div>
            </div>
            <div className="lg:col-span-2">
              <SectionHeading
                eyebrow={about?.ceoHeading.eyebrow}
                title={about?.ceoHeading.title ?? ''}
                subtitle={about?.ceoHeading.subtitle}
              />
              <div className="mt-5 space-y-4 leading-relaxed text-charcoal-700">
                {ceo.statement.map((p, i) => (
                  <RichText key={i} text={p} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mission & Vision */}
      {missionVision && (
        <section className="section bg-charcoal-50/60">
          <div className="container grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 ring-1 ring-charcoal-100">
              <h3 className="text-2xl font-extrabold text-gold-700">Mission</h3>
              <RichText text={missionVision.mission} className="mt-4 leading-relaxed text-charcoal-700" />
            </div>
            <div className="rounded-2xl bg-white p-8 ring-1 ring-charcoal-100">
              <h3 className="text-2xl font-extrabold text-gold-700">Vision</h3>
              <RichText text={missionVision.vision} className="mt-4 leading-relaxed text-charcoal-700" />
            </div>
          </div>
        </section>
      )}

      {/* Core values */}
      {coreValues.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading
              center
              eyebrow={about?.valuesHeading.eyebrow}
              title={about?.valuesHeading.title ?? ''}
              subtitle={about?.valuesHeading.subtitle}
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coreValues.map((v, i) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-charcoal-100 p-6"
                >
                  <div className="text-3xl font-black text-gold-200">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-charcoal-900">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm text-charcoal-700">
                    <InlineText text={v.description} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Management */}
      {management.length > 0 && (
        <section className="section bg-charcoal-50/60">
          <div className="container">
            <SectionHeading
              center
              eyebrow={about?.managementHeading.eyebrow}
              title={about?.managementHeading.title ?? ''}
              subtitle={about?.managementHeading.subtitle}
            />
            <div className="mt-12 space-y-8">
              {management.map((m) => (
                <div
                  key={m.id}
                  className="grid gap-6 rounded-2xl border border-charcoal-100 bg-white p-8 md:grid-cols-4"
                >
                  <div className="md:col-span-1">
                    <Avatar
                      name={m.name}
                      photo={m.photo}
                      className="bg-gold text-on-gold"
                    />
                    <h3 className="mt-4 text-lg font-bold text-charcoal-900">
                      {m.name}
                    </h3>
                    <p className="text-sm font-medium text-gold-700">{m.role}</p>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-charcoal-700 md:col-span-3">
                    {m.bio.map((p, i) => (
                      <RichText key={i} text={p} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection cta={cta} />
    </>
  );
}
