import Link from 'next/link';

export function CTASection() {
  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-charcoal-900 px-8 py-14 text-center md:px-16">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gold/5" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Ready to power your next project?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-charcoal-100/70">
              Let&apos;s deploy smart, sustainable, and reliable solutions
              tailored to your needs — from homes and offices to rural
              communities.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-primary">
                Get a Free Consultation
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-md border-2 border-white/30 px-6 py-3 font-semibold text-white transition hover:border-gold hover:text-gold"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
