import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { company } from '@/data/company';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Suburban Integrated Services Limited for smart automation, power, renewable energy, and consulting solutions.',
};

const details = [
  {
    label: 'Call us',
    lines: company.phones,
    href: `tel:${company.phones[0]}`,
  },
  {
    label: 'Email us',
    lines: company.emails,
    href: `mailto:${company.emails[0]}`,
  },
  {
    label: 'Visit us',
    lines: [company.address],
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-charcoal-900 py-16 text-white md:py-20">
        <div className="container">
          <span className="eyebrow text-gold-200">Contact Us</span>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Let&apos;s talk about your project
          </h1>
          <p className="mt-4 max-w-2xl text-charcoal-100/75">
            Reach out and our team will get back to you shortly with tailored
            advice and a no-obligation quote.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-charcoal-900">
              Get in touch
            </h2>
            <p className="mt-3 text-charcoal-700">
              We&apos;re here to help with smart automation, power, renewable
              energy, training, and consulting.
            </p>
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
                        href={d.href}
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
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm md:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
