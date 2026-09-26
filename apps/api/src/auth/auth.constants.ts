export const ACCESS_COOKIE = 'sis_at';
export const REFRESH_COOKIE = 'sis_rt';

/** Failed logins allowed per (IP, email) pair before that pair is blocked. */
export const MAX_FAILED_LOGINS = 10;
export const LOGIN_FAILURE_WINDOW_MINUTES = 60;

/**
 * A just-rotated refresh token is still honoured for this long, so two tabs
 * refreshing at the same moment are not mistaken for token theft.
 */
export const REFRESH_REUSE_GRACE_MS = 30_000;
export const ROLES_KEY = 'roles';
