import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getServices, getSettings } from '@/lib/cms';
import { renditionUrl } from '@/lib/media';

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ company, branding, media }, services] = await Promise.all([getSettings(), getServices()]);
  const logo = renditionUrl(media(branding.logoId));
  const logoDark = renditionUrl(media(branding.logoDarkId)) ?? logo;

  return (
    <>
      <Navbar tagline={company?.tagline ?? ''} logo={logo} name={company?.name} />
      <main className="flex-1">{children}</main>
      <Footer company={company} services={services} logo={logoDark} />
    </>
  );
}
