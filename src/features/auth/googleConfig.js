// Google Identity Services needs the public OAuth client ID at build time.
// Keep the value in deployment configuration instead of falling back to a
// placeholder that would make the provider fail with an opaque client error.
export const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
export const isGoogleAuthConfigured = Boolean(GOOGLE_CLIENT_ID);
