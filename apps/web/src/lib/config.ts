/** Runtime configuration sourced from environment variables (.env.local). */
export const siteConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  siteName:
    process.env.NEXT_PUBLIC_SITE_NAME ?? 'Suburban Integrated Services Limited',
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://www.suburbanintegratedservices.com',
};
