import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { PageHeader } from '@/components/PageHeader';
import { getServices, getSettings } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const { contactPage } = await getSettings();
  return { title: 'Contact', description: contactPage?.metaDescription };
}

export default async function ContactPage() {
  const [{ company, contactPage }, services] = await Promise.all([
    getSettings(),
    getServices(),
  ]);

  const details = company
    ? [
        {
          label: 'Call us',
          lines: company.phones,
          href: (line: string) => `tel:${line.replace(/\s+/g, '')}`,
        },
        {
          label: 'Email us',
          lines: company.emails,
          href: (line: string) => `mailto:${line}`,
        },
        { label: 'Visit us', lines: [company.address] },
      ]
    : [];

  return (
    <>
      <PageHeader heading={contactPage?.header} />

      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-charcoal-900">
              {contactPage?.intro.title}
            </h2>
            <p className="mt-3 text-charcoal-700">{contactPage?.intro.body}</p>
            <div className="mt-8 space-y-6">
              {details.map((d) => (
                <div key={d.label}>
                  <p className="text-sm font-bold uppercase tracking-wider text-gold-600">
                    {d.label}
                  </p>
                  {d.lines.map((line) =>
                    d.href ? (
                      <a
                        key={line}
                        href={d.href(line)}
                        className="block text-charcoal-800 hover:text-gold-700"
                      >
                        {line}
                      </a>
                    ) : (
                      <p key={line} className="text-charcoal-800">
                        {line}
                      </p>
                    ),
                  )}
                </div>
              ))}
              {company?.mapUrl && (
                <a
                  href={company.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-semibold text-gold-700 hover:text-gold-600"
                >
                  View on map →
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm md:p-8">
              <ContactForm services={services.map((s) => s.title)} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
