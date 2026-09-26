import type { Metadata } from 'next';
import Image from 'next/image';
import { CTASection } from '@/components/CTASection';
import { PageHeader } from '@/components/PageHeader';
import { CheckIcon, serviceIcon } from '@/components/Icons';
import { getServices, getSettings } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const { servicesPage } = await getSettings();
  return { title: 'Services', description: servicesPage?.metaDescription };
}

export default async function ServicesPage() {
  const [{ servicesPage, cta, media }, services] = await Promise.all([
    getSettings(),
    getServices(),
  ]);

  return (
    <>
      <PageHeader
        heading={servicesPage?.header}
        image={media(servicesPage?.headerImageId)}
      />

      <section className="section">
        <div className="container space-y-20">
          {services.map((service, idx) => {
            const Icon = serviceIcon(service.slug);
            const reversed = idx % 2 === 1;
            return (
              <div
                key={service.id}
                id={service.slug}
                className="scroll-mt-24 grid gap-8 lg:grid-cols-2 lg:items-center"
              >
                <div className={reversed ? 'lg:order-2' : ''}>
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold text-charcoal-900">
                    <Icon className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 text-2xl font-extrabold text-charcoal-900 md:text-3xl">
                    {service.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-charcoal-700">
                    {service.summary}
                  </p>
                </div>
                <div
                  className={`overflow-hidden rounded-2xl border border-charcoal-100 bg-charcoal-50/50 ${
                    reversed ? 'lg:order-1' : ''
                  }`}
                >
                  {service.image && (
                    <div className="relative aspect-video">
                      <Image
                        src={service.image.path}
                        alt={service.image.alt}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <ul className="space-y-3 p-8">
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

      <CTASection cta={cta} />
    </>
  );
}
