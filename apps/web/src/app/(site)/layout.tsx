import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getServices, getSettings } from '@/lib/cms';

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ company }, services] = await Promise.all([getSettings(), getServices()]);

  return (
    <>
      <Navbar tagline={company?.tagline ?? ''} />
      <main className="flex-1">{children}</main>
      <Footer company={company} services={services} />
    </>
  );
}
