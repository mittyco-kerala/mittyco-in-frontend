import New_Arrival_Home from "./New_Arrival_Home";

const MAX_PRODUCTS_PER_SECTION = 16;

function getSectionProducts(section) {
    if (Array.isArray(section)) return section;
    if (Array.isArray(section?.results)) return section.results;
    if (Array.isArray(section?.products)) return section.products;
    return [];
}

function uniqueProducts(products) {
    const seen = new Set();
    return products.filter((product) => {
        const id = product?.id;
        if (id === null || id === undefined || seen.has(String(id))) return false;
        seen.add(String(id));
        return true;
    });
}

function getSectionCount(section, products) {
    const count = Number(section?.count ?? section?.total);
    return Number.isFinite(count) ? count : products.length;
}

function HomepageProductSection({ title, eyebrow, section, viewAllTo = "/shop", tone }) {
    const allProducts = uniqueProducts(getSectionProducts(section));
    const products = allProducts.slice(0, MAX_PRODUCTS_PER_SECTION);
    if (!products.length) return null;

    return (
        <New_Arrival_Home
            products={products}
            totalCount={getSectionCount(section, allProducts)}
            title={title}
            subtitle={eyebrow}
            viewAllTo={viewAllTo}
            tone={tone}
        />
    );
}

export default HomepageProductSection;
