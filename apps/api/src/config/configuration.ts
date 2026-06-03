/**
 * Centralised, typed access to environment configuration.
 * Every value the app needs is derived from process.env here so that
 * nothing reads `process.env` directly elsewhere in the codebase.
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  globalPrefix: string;
  corsOrigins: string[];
  adminApiKey: string;
  database: {
    url: string;
  };
  mail: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
    to: string;
  };
}

const toBool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.API_PORT, 4000),
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminApiKey: process.env.ADMIN_API_KEY ?? '',
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: toNumber(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from:
      process.env.MAIL_FROM ??
      'Suburban Integrated Services <no-reply@suburbanintegratedservices.com>',
    to: process.env.MAIL_TO ?? 'suburbanintegratedservices@gmail.com',
  },
});
