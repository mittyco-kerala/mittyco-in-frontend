const isPresent = (value) => value !== null && value !== undefined && value !== "";

function labelOf(value) {
    if (!isPresent(value)) return "";
    if (typeof value === "object") return value.name || value.label || value.value || "";
    return String(value);
}

export function slugifyProductPart(value) {
    return labelOf(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getColorLabel(product, variant) {
    return labelOf(variant?.color) || labelOf(variant?.color_name) || labelOf(product?.default_color_name);
}

function getUnitLabels(product, unit) {
    const size = unit?.unit || unit?.size || unit;
    const unitName = labelOf(size) || labelOf(unit?.unit_name) || labelOf(product?.default_unit_name);
    const unitType = labelOf(unit?.unit_type)
        || labelOf(size?.unit_type)
        || labelOf(unit?.unit_type_name)
        || labelOf(product?.default_unit_type_name);

    return [unitType, unitName].filter(Boolean);
}

function getPrice(product, variant, unit) {
    return [
        unit?.price,
        variant?.price,
        product?.starting_price,
        unit?.discounted_price,
        variant?.discounted_price,
        product?.current_price,
        product?.discounted_price,
    ].find(isPresent);
}

function formatPrice(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return number.toFixed(2);
}

export function getProductPath(product = {}, variant = null, unit = null) {
    const productId = product?.id ?? product?.pk ?? product?.uuid;
    if (!isPresent(productId)) return "/single/product";

    const price = formatPrice(getPrice(product, variant, unit));
    const slugParts = [
        product?.name,
        getColorLabel(product, variant),
        ...getUnitLabels(product, unit),
        price ? `price ${price}` : "",
    ].map(slugifyProductPart).filter(Boolean);

    return `/single/${encodeURIComponent(String(productId))}/${slugParts.join("-") || "product"}`;
}

export function getProductUrl(product = {}, variant = null, unit = null) {
    const path = getProductPath(product, variant, unit);
    const params = new URLSearchParams();
    const variantId = variant?.id ?? product?.default_variant_id;
    const unitId = unit?.id ?? product?.default_variant_unit_id;

    if (isPresent(variantId)) params.set("variant", String(variantId));
    if (isPresent(unitId)) params.set("size", String(unitId));

    const query = params.toString();
    return query ? `${path}?${query}` : path;
}
