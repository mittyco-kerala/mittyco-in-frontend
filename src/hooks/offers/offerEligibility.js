const hasValue = (value) => value !== null && value !== undefined && value !== "";

function toOfferDate(value, endOfDay = false) {
    if (!hasValue(value)) return null;

    const normalizedValue = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && endOfDay
        ? `${value}T23:59:59.999`
        : value;
    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Uses offer data supplied by the API to decide whether it is safe to present
 * the offer. Date checks are deliberately defensive so expired or malformed
 * offers are never promoted by the Home page.
 */
export function isOfferActive(offer, now = new Date()) {
    if (!offer || offer.is_active === false || offer.is_active === 0 || String(offer.is_active).toLowerCase() === "false") return false;

    const startDate = toOfferDate(offer.start_date ?? offer.starts_at ?? offer.startDate);
    const endDate = toOfferDate(offer.end_date ?? offer.expires_at ?? offer.endDate, true);

    if (startDate === undefined || endDate === undefined) return false;
    if (startDate && endDate && startDate > endDate) return false;
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;

    return true;
}
