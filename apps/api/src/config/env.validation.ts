/**
 * Lightweight startup validation for required env vars.
 * Runs via ConfigModule's `validate` hook before the app boots so that a
 * missing DATABASE_URL fails fast with a clear message rather than at first query.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => {
    const value = config[key];
    return value === undefined || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        `Copy apps/api/.env.example to apps/api/.env and fill them in.`,
    );
  }

  return config;
}
