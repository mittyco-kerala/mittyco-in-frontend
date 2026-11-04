import { getProductShareUrl } from "../src/utils/productUrl.js";

const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

function labelOf(value) {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "object") return value.name || value.label || value.value || "";
    return String(value);
}

function selectedImage(variant, product) {
    const images = Array.isArray(variant?.images) ? variant.images : [];
    const image = images.find((item) => item?.is_primary) || images[0];
    return image?.image || image?.url || product?.product_image || product?.image || "";
}

function publicImageUrl(image, origin) {
    if (!image) return "";
    if (/^https?:\/\//i.test(image)) return image;

    const path = `/${String(image).replace(/^\/+/, "")}`;
    if (path.startsWith("/backend/")) return new URL(path, origin).toString();
    if (path.startsWith("/media/") || path.startsWith("/static/")) {
        return new URL(`/backend${path}`, origin).toString();
    }
    return new URL(path, origin).toString();
}

function selectedUnit(variant, sizeId) {
    const sizes = Array.isArray(variant?.sizes) ? variant.sizes : [];
    return sizes.find((size) => String(size?.id) === String(sizeId)) || sizes[0] || null;
}

function selectedVariant(product, variantId) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return variants.find((variant) => String(variant?.id) === String(variantId)) || variants[0] || null;
}

function publicOrigin(request) {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const forwardedProtocol = request.headers.get("x-forwarded-proto");
    const host = forwardedHost?.split(",")[0].trim() || requestUrl.host;
    const protocol = forwardedProtocol?.split(",")[0].trim() || requestUrl.protocol.replace(":", "");
    return `${protocol}://${host}`;
}

function variantDescription(product, variant, unit) {
    const parts = [
        labelOf(variant?.color),
        labelOf(unit?.unit || unit?.size || unit),
    ].filter(Boolean);
    const baseDescription = product?.description || product?.short_description || "Shop this Mittyco product.";
    return parts.length ? `${baseDescription} Selected: ${parts.join(" · ")}.` : baseDescription;
}

export function createProductShareHtml({ canonicalUrl, description, imageUrl, title }) {
    const safeCanonicalUrl = escapeHtml(canonicalUrl);
    const safeDescription = escapeHtml(description);
    const safeTitle = escapeHtml(title);
    const safeImageUrl = escapeHtml(imageUrl);
    const redirectTarget = JSON.stringify(canonicalUrl).replace(/</g, "\\u003c");

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:type" content="product">
    <meta property="og:url" content="${safeCanonicalUrl}">
    <meta property="og:site_name" content="Mittyco">
    ${imageUrl ? `<meta property="og:image" content="${safeImageUrl}">` : ""}
    ${imageUrl ? `<meta property="og:image:alt" content="${safeTitle}">` : ""}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    ${imageUrl ? `<meta name="twitter:image" content="${safeImageUrl}">` : ""}
    <link rel="canonical" href="${safeCanonicalUrl}">
</head>
<body>
    <p>${safeTitle}</p>
    <script>window.location.replace(${redirectTarget});</script>
</body>
</html>`;
}

function fallbackCanonicalUrl(requestUrl, origin, id) {
    const slug = requestUrl.searchParams.get("slug") || "product";
    const path = `/single/${encodeURIComponent(id)}/${encodeURIComponent(slug)}`;
    const params = new URLSearchParams();
    for (const key of ["variant", "size"]) {
        const value = requestUrl.searchParams.get(key);
        if (value) params.set(key, value);
    }
    const query = params.toString();
    return new URL(query ? `${path}?${query}` : path, origin).toString();
}

export default async function handler(request) {
    if (request.method !== "GET") {
        return new Response("Method Not Allowed", {
            headers: { Allow: "GET" },
            status: 405,
        });
    }

    const requestUrl = new URL(request.url);
    const origin = publicOrigin(request);
    const id = requestUrl.searchParams.get("id") || "";

    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        return new Response("Not Found", { status: 404 });
    }

    try {
        const response = await fetch(new URL(`/backend/product/${encodeURIComponent(id)}/`, origin), {
            headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Product request failed with ${response.status}`);

        const product = await response.json();
        const variant = selectedVariant(product, requestUrl.searchParams.get("variant"));
        const unit = selectedUnit(variant, requestUrl.searchParams.get("size"));
        const canonicalUrl = getProductShareUrl(product, variant, unit, origin);
        const productName = labelOf(product?.name) || "Mittyco product";
        const variantLabel = labelOf(variant?.color);
        const unitLabel = labelOf(unit?.unit || unit?.size || unit);
        const optionLabel = [variantLabel, unitLabel].filter(Boolean).join(" · ");
        const title = `${productName}${optionLabel ? ` – ${optionLabel}` : ""} | Mittyco`;
        const imageUrl = publicImageUrl(selectedImage(variant, product), origin);

        return new Response(createProductShareHtml({
            canonicalUrl,
            description: variantDescription(product, variant, unit),
            imageUrl,
            title,
        }), {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
                "Content-Type": "text/html; charset=utf-8",
            },
            status: 200,
        });
    } catch {
        const canonicalUrl = fallbackCanonicalUrl(requestUrl, origin, id);
        return new Response(createProductShareHtml({
            canonicalUrl,
            description: "Shop this Mittyco product.",
            imageUrl: "",
            title: "Mittyco product",
        }), {
            headers: { "Content-Type": "text/html; charset=utf-8" },
            status: 200,
        });
    }
}
