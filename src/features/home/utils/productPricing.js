import { isOfferActive } from "../../../hooks/offers/offerEligibility";

const toPrice = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const firstPrice = (values) => values.map(toPrice).find((value) => value !== null) ?? null;

const firstPriceAbove = (values, currentPrice) => values
    .map(toPrice)
    .find((value) => value !== null && currentPrice !== null && value > currentPrice) ?? null;

const toPercentage = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 && numericValue <= 100 ? numericValue : null;
};

const roundedPercentage = (value) => Math.round(value * 100) / 100;

/**
 * Prepares display-only pricing from values already supplied by the backend.
 * It never invents a comparison price: an original price is shown only if it
 * is a valid API value strictly greater than the current selling price.
 */
export function getHomepageProductPricing(product = {}, variant = null, now = new Date()) {
    const productDiscountedPrice = toPrice(product.discounted_price);
    const productCurrentPrice = toPrice(product.current_price);
    const productStartingPrice = toPrice(product.starting_price);
    const variantDiscountedPrice = toPrice(variant?.discounted_price);
    const variantPrice = toPrice(variant?.price);

    const currentPrice = firstPrice([
        productDiscountedPrice,
        productCurrentPrice,
        productStartingPrice,
        variantDiscountedPrice,
        variantPrice,
    ]);

    const originalCandidates = productDiscountedPrice !== null
        ? [product.original_price, product.current_price, variant?.price]
        : variantDiscountedPrice !== null
            ? [product.original_price, product.current_price, variant?.price]
            : [product.original_price];
    const originalPrice = firstPriceAbove(originalCandidates, currentPrice);
    const linkedOfferIsActive = !product?.offer || typeof product.offer !== "object" || isOfferActive(product.offer, now);
    const calculatedDiscount = originalPrice !== null && currentPrice !== null
        ? roundedPercentage(((originalPrice - currentPrice) / originalPrice) * 100)
        : null;
    const reportedDiscount = toPercentage(product.discount_percentage);
    const hasReportedOffer = product.has_offer !== false && reportedDiscount !== null;
    // A percentage by itself is not enough to show a sale badge. The API must
    // also provide a real comparison price that is higher than the selling
    // price; this prevents malformed or stale payloads from showing a fake
    // discount.
    const hasOffer = linkedOfferIsActive
        && originalPrice !== null
        && currentPrice !== null
        && currentPrice < originalPrice
        && (calculatedDiscount !== null || hasReportedOffer);

    return {
        currentPrice,
        originalPrice: hasOffer ? originalPrice : null,
        discountPercentage: hasOffer ? (calculatedDiscount ?? reportedDiscount) : null,
        hasOffer,
    };
}

export function formatHomepagePrice(value) {
    const price = toPrice(value);
    return price === null ? "Price unavailable" : price.toFixed(2);
}
