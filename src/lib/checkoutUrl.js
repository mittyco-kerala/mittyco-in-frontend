const DEFAULT_CHECKOUT_HOSTS = ["checkout.stripe.com"];

function allowedCheckoutHosts() {
    const configuredHosts = String(import.meta.env.VITE_CHECKOUT_ALLOWED_HOSTS || "").trim();
    if (!configuredHosts) return DEFAULT_CHECKOUT_HOSTS;

    return configuredHosts
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean);
}

export function getSafeCheckoutUrl(rawUrl) {
    const checkoutUrl = new URL(String(rawUrl || ""));
    const isAllowedHost = allowedCheckoutHosts().includes(checkoutUrl.hostname.toLowerCase());

    if (checkoutUrl.protocol !== "https:" || !isAllowedHost) {
        throw new Error("The payment provider returned an untrusted checkout URL.");
    }

    return checkoutUrl.toString();
}
