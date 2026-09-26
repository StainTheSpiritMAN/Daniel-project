import type { Metadata } from 'next';
import Image from 'next/image';
import { CTASection } from '@/components/CTASection';
import { PageHeader } from '@/components/PageHeader';
import { InlineText, RichText } from '@/components/RichText';
import { getNews, getSettings } from '@/lib/cms';
import { resolveLayout } from '@/lib/layout';
import { formatNewsDate } from '@/lib/media';

export async function generateMetadata(): Promise<Metadata> {
  const { newsPage } = await getSettings();
  return { title: 'News & Activities', description: newsPage.metaDescription };
}

export default async function NewsPage() {
  const [{ newsPage, cta, media, layout }, news] = await Promise.all([
    getSettings(),
    getNews(),
  ]);
  // The CTA banner uses the same look as on the homepage.
  const ctaConfig = resolveLayout(layout, 'home').find((s) => s.key === 'cta')!;

  return (
    <>
      <PageHeader
        heading={newsPage.header}
        image={media(newsPage.headerImageId)}
        overlay={newsPage.headerOverlay}
      />

      <section className="section">
        <div className="container max-w-5xl space-y-12">
          {news.length === 0 && (
            <p className="text-center text-charcoal-700">
              News and activities will appear here soon.
            </p>
          )}
          {news.map((post) => (
            <article
              key={post.id}
              id={post.slug}
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm target:ring-2 target:ring-gold md:grid md:grid-cols-5"
            >
              <div className="relative aspect-[4/3] md:col-span-2 md:aspect-auto md:min-h-[18rem]">
                <Image
                  src={post.image.path}
                  alt={post.image.alt}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 md:col-span-3 md:p-8">
                <time
                  dateTime={post.date.slice(0, 10)}
                  className="text-xs font-bold uppercase tracking-wider text-gold-600"
                >
                  {formatNewsDate(post.date)}
                </time>
                <h2 className="mt-2 text-2xl font-extrabold text-charcoal-900">
                  {post.title}
                </h2>
                <p className="mt-2 font-semibold text-charcoal-800">
                  <InlineText text={post.highlight} />
                </p>
                <div className="mt-4 space-y-3 leading-relaxed text-charcoal-700">
                  <RichText text={post.body} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CTASection cta={cta} config={ctaConfig} />
    </>
  );
}
