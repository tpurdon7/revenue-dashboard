export const AUTH_COOKIE_NAME = 'brinc-dashboard-auth';
export const WEBSITE_PASSWORD = 'brinc2014';

export function isAuthenticated(sessionValue: string | undefined): boolean {
  return sessionValue === 'authenticated';
}
