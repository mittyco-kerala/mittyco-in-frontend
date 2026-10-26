
// import client from "../../../lib/ApiClient";


// export const prodectGet = async (filter = {}) => {

//     let response;

//     if (filter.offer === true || filter.offer === "true") {

//         response = await client.get(
//             "offer-products/"
//         );


//         return response.data.products || [];

//     }

//     response = await client.get(
//         "products/",
//         {
//             params: filter
//         }
//     );

//     return response.data;
// };

import client from "../../../lib/ApiClient";

export const normalizeProductPage = (payload) => {
    if (Array.isArray(payload)) return { results: payload, count: payload.length, next: null, previous: null };
    return {
        results: Array.isArray(payload?.results) ? payload.results : [],
        count: Number(payload?.count ?? 0),
        next: payload?.next ?? null,
        previous: payload?.previous ?? null,
        page: payload?.page,
        page_size: payload?.page_size,
    };
};

export const prodectGet = async (filter = {}) => {

    let response;

    if (filter.offer === true || filter.offer === "true") {

        response = await client.get("offer-products/", { params: filter });

        return normalizeProductPage(response.data?.products || response.data);
    }

    const endpoint = filter.search
        ? "search-products/"
        : filter.subcategory
            ? "products/"
            : filter.category
            ? `category-products/${filter.category}/`
            : "products/";
    const params = { ...filter };
    // The category-products endpoint does not apply a subcategory query. Use
    // products/ for combined filters and keep both values in the request.
    if (!filter.subcategory) delete params.category;
    response = await client.get(endpoint, { params });

    return normalizeProductPage(response.data);
};

export const relatedProductsGet = async (productId, params = {}) => {
    const response = await client.get(`related-products/${productId}/`, { params });
    return normalizeProductPage(response.data);
};
