/**
 * Forms post to the PHP endpoints on cPanel. Static preview hosts such as
 * Vercel cannot execute PHP, so show the demo success state there instead.
 */
export function isDemoMode() {
  if (import.meta.env.DEV || import.meta.env.PUBLIC_DEMO_MODE === "true") {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return window.location.hostname.endsWith(".vercel.app");
}
