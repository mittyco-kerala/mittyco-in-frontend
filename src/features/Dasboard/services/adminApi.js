import client from "../../../lib/ApiClient";

export const ADMIN_BASE = "/admin/manage";

export const resourceUrl = (resource, id = "") =>
    `${ADMIN_BASE}/${resource}/${id ? `${id}/` : ""}`;

export const listResource = (resource, params = {}) =>
    client.get(resourceUrl(resource), { params });

export const getResource = (resource, id) =>
    client.get(resourceUrl(resource, id));

export const createResource = (resource, data) =>
    client.post(resourceUrl(resource), data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);

export const updateResource = (resource, id, data) =>
    client.patch(resourceUrl(resource, id), data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);

export const deleteResource = (resource, id) =>
    client.delete(resourceUrl(resource, id));

export const duplicateResource = (resource, id) =>
    client.post(`${resourceUrl(resource, id)}duplicate/`);

export const setPrimaryResource = (resource, id) =>
    client.post(`${resourceUrl(resource, id)}set-primary/`);

export const toggleWelcomeBonusActive = (id) =>
    client.post(`${resourceUrl("welcome-bonuses", id)}toggle-active/`);

// Token blacklist requests deliberately use the Super Admin JSON API. These
// helpers only deal with refresh-token metadata; a raw refresh token must
// never be requested, retained, or rendered by the dashboard.
export const getOutstandingTokens = (params = {}) =>
    client.get(`${ADMIN_BASE}/token-blacklist/outstanding-tokens/`, { params });

export const getBlacklistedTokens = (params = {}) =>
    client.get(`${ADMIN_BASE}/token-blacklist/blacklisted-tokens/`, { params });

export const blacklistToken = (id) =>
    client.post(`${ADMIN_BASE}/token-blacklist/outstanding-tokens/${id}/blacklist/`);

// Detail/edit pages use the dedicated endpoint because generic admin CRUD
// responses contain model fields only, not customer/address/line-item data.
export const getOrderDetails = (id) => client.get(`/orders/${id}/`);
export const updateOrderDetails = (id, data) => client.patch(`/orders/${id}/`, data);

export const unwrapList = (payload) => {
    if (Array.isArray(payload)) return { rows: payload, count: payload.length };
    const rows = payload?.results || [];
    return {
        rows: Array.isArray(rows) ? rows : [],
        count: payload?.count ?? rows.length,
        next: payload?.next,
        previous: payload?.previous,
        page: payload?.page,
        page_size: payload?.page_size,
    };
};

// Admin and public list endpoints use DRF's paginated shape. Keeping this
// helper in one place prevents a table from accidentally rendering the whole
// response object as a row collection.
export const paginationFromPayload = (payload) => {
    const normalized = unwrapList(payload);
    return {
        results: normalized.rows,
        count: normalized.count,
        next: normalized.next ?? null,
        previous: normalized.previous ?? null,
        page: normalized.page,
        page_size: normalized.page_size,
    };
};

export const normalizeSchema = (payload) => {
    if (!payload) return {};
    return payload.fields || payload.models || payload.schema || payload;
};

export const getFieldSchema = (schema, resource) => {
    const normalized = normalizeSchema(schema);
    if (Array.isArray(normalized?.resources)) return normalized.resources.find((item) => item.key === resource || item.key === resource.replaceAll("_", "-")) || {};
    return normalized?.[resource] || normalized?.[resource.replaceAll("-", "_")] || {};
};

export const getErrorMessage = (error, fallback = "Something went wrong") => {
    const data = error?.response?.data;
    if (error?.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error?.response?.status === 403) return "You do not have permission to perform this action.";
    if (error?.response?.status === 404) return "Resource not found.";
    if (typeof data === "string") return data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data && typeof data === "object") {
        const formatValue = (value) => Array.isArray(value) ? value.map(formatValue).join(", ") : value && typeof value === "object" ? Object.values(value).map(formatValue).join(" ") : String(value);
        return Object.entries(data)
            .map(([key, value]) => `${key}: ${formatValue(value)}`)
            .join(" | ");
    }
    return fallback;
};

export const flattenApiErrors = (payload) => {
    if (!payload || typeof payload !== "object") return {};
    const formatValue = (value) => Array.isArray(value) ? value.map(formatValue).join(", ") : value && typeof value === "object" ? Object.values(value).map(formatValue).join(" ") : String(value);
    return Object.fromEntries(Object.entries(payload).map(([key, value]) => [
        key,
        formatValue(value),
    ]));
};
