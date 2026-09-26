import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '@/lib/config';
import { getSettings } from '@/lib/cms';
import { mediaUrl } from '@/lib/media';
import { themeCss } from '@/lib/theme';

export async function generateMetadata(): Promise<Metadata> {
  const { company, seo, branding, media } = await getSettings();
  const icon = media(branding.iconId)?.variants.icon;
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
    ...(icon
      ? {
          icons: {
            icon: [
              { url: mediaUrl(icon['32'])!, sizes: '32x32', type: 'image/png' },
              { url: mediaUrl(icon['192'])!, sizes: '192x192', type: 'image/png' },
            ],
            apple: [{ url: mediaUrl(icon['180'])!, sizes: '180x180' }],
          },
        }
      : {}),
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = await getSettings();
  return (
    <html lang="en">
      <head>
        {/* Admin-selected colour theme (overrides the defaults in globals.css). */}
        <style id="site-theme">{themeCss(theme)}</style>
      </head>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
