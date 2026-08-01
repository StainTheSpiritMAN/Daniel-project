import type { Metadata } from 'next';
import Image from 'next/image';
import { CTASection } from '@/components/CTASection';
import { ClientLogos } from '@/components/ClientLogos';
import { SectionHeading } from '@/components/SectionHeading';
import { projectGallery, projects } from '@/data/company';

export const metadata: Metadata = {
  title: 'Projects & Clientele',
  description:
    'A selection of projects delivered by Suburban Integrated Services Limited across power, security, ICT, and renewable energy.',
};

export default function ProjectsPage() {
  return (
    <>
      <section className="bg-charcoal-900 py-16 text-white md:py-20">
        <div className="container">
          <span className="eyebrow text-gold-200">Our Projects &amp; Clientele</span>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Delivering results across Nigeria
          </h1>
          <p className="mt-4 max-w-2xl text-charcoal-100/75">
            A snapshot of recent project highlights spanning power backup,
            security systems, ICT infrastructure, and renewable energy.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <div
                key={i}
                className="flex flex-col rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm transition hover:border-gold-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
                    {project.client}
                  </span>
                  <span className="rounded-full bg-charcoal-900 px-2.5 py-1 text-xs font-bold text-gold">
                    {project.year}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold leading-snug text-charcoal-900">
                  {project.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section bg-charcoal-50/60">
        <div className="container">
          <SectionHeading
            center
            eyebrow="From the Field"
            title="Our work in pictures"
            subtitle="Real installations and training engagements delivered by our team."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectGallery.map((photo) => (
              <figure
                key={photo.src}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl shadow-sm"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-900/85 to-transparent p-4 pt-10">
                  <span className="text-sm font-semibold text-white">
                    {photo.caption}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="section">
        <div className="container text-center">
          <span className="eyebrow">Our Clients</span>
          <h2 className="heading">Trusted by leading organizations</h2>
          <ClientLogos />
        </div>
      </section>

      <CTASection />
    </>
  );
}
