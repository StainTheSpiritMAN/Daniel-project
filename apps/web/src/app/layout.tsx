import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { siteConfig } from '@/lib/config';
import { company } from '@/data/company';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${company.name} — ${company.tagline}`,
    template: `%s | ${company.shortName}`,
  },
  description: company.intro,
  keywords: [
    'Suburban Integrated Services',
    'smart home automation Nigeria',
    'solar power solutions',
    'renewable energy',
    'CCTV installation',
    'IT consulting',
    'inverter installation',
    'Rivers State',
  ],
  openGraph: {
    title: `${company.name} — ${company.tagline}`,
    description: company.intro,
    url: siteConfig.siteUrl,
    siteName: company.name,
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
