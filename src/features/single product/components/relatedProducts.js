const asList = (value) => Array.isArray(value) ? value : [];

export const relatedProductsFromResponse = (response) => {
    const embeddedProducts = asList(response?.related_products);
    const products = Array.isArray(response)
        ? response
        : embeddedProducts.length ? embeddedProducts : response?.results;

    return asList(products).slice(0, 4);
};
