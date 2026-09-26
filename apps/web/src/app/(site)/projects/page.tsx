import type { Metadata } from 'next';
import Image from 'next/image';
import { CTASection } from '@/components/CTASection';
import { ClientLogos } from '@/components/ClientLogos';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeading } from '@/components/SectionHeading';
import { getClients, getGallery, getProjects, getSettings } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const { projectsPage } = await getSettings();
  return { title: 'Projects & Clientele', description: projectsPage?.metaDescription };
}

export default async function ProjectsPage() {
  const [{ projectsPage, cta }, projects, gallery, clients] = await Promise.all([
    getSettings(),
    getProjects(),
    getGallery(),
    getClients(),
  ]);

  return (
    <>
      <PageHeader heading={projectsPage?.header} />

      {projects.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
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
                  {project.description && (
                    <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
                      {project.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="section bg-charcoal-50/60">
          <div className="container">
            <SectionHeading
              center
              eyebrow={projectsPage?.galleryHeading.eyebrow}
              title={projectsPage?.galleryHeading.title ?? ''}
              subtitle={projectsPage?.galleryHeading.subtitle}
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((photo) => (
                <figure
                  key={photo.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl shadow-sm"
                >
                  <Image
                    src={photo.image.path}
                    alt={photo.image.alt}
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
      )}

      {/* Clients */}
      {clients.length > 0 && (
        <section className="section">
          <div className="container text-center">
            <span className="eyebrow">{projectsPage?.clientsHeading.eyebrow}</span>
            <h2 className="heading">{projectsPage?.clientsHeading.title}</h2>
            <ClientLogos clients={clients} />
          </div>
        </section>
      )}

      <CTASection cta={cta} />
    </>
  );
}
