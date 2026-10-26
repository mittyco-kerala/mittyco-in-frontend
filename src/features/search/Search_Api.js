import client from "../../../lib/ApiClient";

export const searchProducts = async (
    params = {}
) => {

    const response = await client.get(
        "/search-products/",
        {
            params
        }
    );

    const payload = response.data;
    return Array.isArray(payload)
        ? { results: payload, count: payload.length, next: null, previous: null }
        : { results: Array.isArray(payload?.results) ? payload.results : [], count: Number(payload?.count ?? 0), next: payload?.next ?? null, previous: payload?.previous ?? null, page: payload?.page, page_size: payload?.page_size };

};

export const relatedProducts = async (productId, params = {}) => {
    const response = await client.get(`/related-products/${productId}/`, { params });
    const payload = response.data;
    return Array.isArray(payload)
        ? { results: payload, count: payload.length, next: null, previous: null }
        : { results: Array.isArray(payload?.results) ? payload.results : [], count: Number(payload?.count ?? 0), next: payload?.next ?? null, previous: payload?.previous ?? null };
};
