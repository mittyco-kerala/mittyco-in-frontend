export const HTML_API_RESPONSE_MESSAGE = "The API returned an HTML page instead of JSON. Check the Vercel API rewrite.";

function contentTypeOf(headers) {
    if (typeof headers?.get === "function") {
        return String(headers.get("content-type") || headers.get("Content-Type") || "");
    }

    return String(headers?.["content-type"] || headers?.["Content-Type"] || "");
}

export function isUnexpectedHtmlResponse(response = {}) {
    const contentType = contentTypeOf(response.headers).toLowerCase();
    const body = typeof response.data === "string" ? response.data.trimStart() : "";

    return contentType.includes("text/html") || /^<!doctype\s+html\b|^<html\b/i.test(body);
}

export function assertJsonApiResponse(response) {
    if (!isUnexpectedHtmlResponse(response)) return response;

    const error = new Error(HTML_API_RESPONSE_MESSAGE);
    error.code = "ERR_API_HTML_RESPONSE";
    error.isAxiosError = true;
    error.response = {
        ...response,
        data: { detail: HTML_API_RESPONSE_MESSAGE },
    };
    throw error;
}

function formatErrorValue(value) {
    if (Array.isArray(value)) return value.map(formatErrorValue).join(", ");
    if (value && typeof value === "object") return Object.values(value).map(formatErrorValue).join(" ");
    return String(value);
}

export function getApiErrorMessage(error, fallback = "Request failed.", options = {}) {
    const data = error?.response?.data;
    const excluded = new Set(options.exclude || []);
    if (typeof data === "string" && data.trim()) return data;
    if (data?.detail) return formatErrorValue(data.detail);
    if (data?.message) return formatErrorValue(data.message);
    if (data?.error) return formatErrorValue(data.error);
    if (data && typeof data === "object") {
        const entries = Object.entries(data)
            .filter(([key]) => !excluded.has(key))
            .map(([key, value]) => `${key}: ${formatErrorValue(value)}`);
        if (entries.length) return entries.join(" | ");
    }
    if (!error?.response) return "Unable to reach the API. Please check your connection and try again.";
    return fallback;
}
