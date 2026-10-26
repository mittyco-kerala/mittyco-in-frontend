// VITE_API_BASE_URL is the supported configuration. Keep VITE_API_URL as a
// migration fallback, and default to the same-origin proxy used by Vercel and
// local Vite development when a deployment environment variable is omitted.
const configuredApiUrl = String(
    import.meta.env.VITE_API_BASE_URL
        || import.meta.env.VITE_API_URL
        || "/backend",
).trim().replace(/\/+$/, "");

const isRelativeApiUrl = configuredApiUrl.startsWith("/");
const isVercelProxyApiUrl = configuredApiUrl === "/backend";
if (isRelativeApiUrl && import.meta.env.PROD && !isVercelProxyApiUrl) {
    throw new Error("Production builds must use VITE_API_BASE_URL=/backend or an absolute HTTPS API origin.");
}

const parsedApiUrl = isRelativeApiUrl ? null : new URL(configuredApiUrl);

// Local HTTP is acceptable only while both the storefront and API are local.
// A secure storefront must never attempt to send credentials to an HTTP API.
if (import.meta.env.PROD && parsedApiUrl && parsedApiUrl.protocol !== "https:") {
    throw new Error("Production builds must use an HTTPS API origin.");
}
if (typeof window !== "undefined" && window.location.protocol === "https:" && parsedApiUrl && parsedApiUrl.protocol !== "https:") {
    throw new Error("VITE_API_BASE_URL must use HTTPS when the storefront uses HTTPS.");
}

export const API_URL = isRelativeApiUrl ? configuredApiUrl : parsedApiUrl.toString().replace(/\/$/, "");
