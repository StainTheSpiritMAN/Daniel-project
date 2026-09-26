import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '@/lib/config';
import { getSettings } from '@/lib/cms';
import { mediaUrl } from '@/lib/media';

export async function generateMetadata(): Promise<Metadata> {
  const { company, seo, media } = await getSettings();
  const name = company?.name ?? siteConfig.siteName;
  const title = seo?.defaultTitle ?? name;
  const description = seo?.defaultDescription ?? company?.intro;
  const ogImage = mediaUrl(media(seo?.ogImageId)?.path);

  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
      default: title,
      template: `%s | ${company?.shortName ?? name}`,
    },
    description,
    keywords: seo?.keywords,
    openGraph: {
      title,
      description,
      url: siteConfig.siteUrl,
      siteName: name,
      type: 'website',
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
