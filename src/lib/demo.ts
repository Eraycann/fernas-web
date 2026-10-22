/**
 * Forms post to the PHP endpoints on cPanel. Static preview hosts such as
 * Vercel cannot execute PHP, so the Vercel project sets
 * PUBLIC_DEMO_MODE=true at build time to show the demo success state.
 */
export function isDemoMode() {
  return Boolean(import.meta.env.DEV || import.meta.env.PUBLIC_DEMO_MODE === "true");
}
