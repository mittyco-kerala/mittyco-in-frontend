function formatOffer({ discountType, discountValue, percentage, fixedAmount }) {
    const type = String(discountType || "PERCENTAGE").toUpperCase();
    const numericValue = Number(discountValue ?? (type === "FIXED" ? fixedAmount : percentage));
    if (!Number.isFinite(numericValue) || numericValue <= 0 || (type !== "FIXED" && numericValue > 100)) return null;
    if (type === "FIXED") return `₹${numericValue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} OFF`;
    return `${Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}% OFF`;
}

export default function OfferSideRail({ discountType, discountValue, percentage, fixedAmount }) {
    const label = formatOffer({ discountType, discountValue, percentage, fixedAmount });
    if (!label) return null;

    return (
        <div className="offer-side-rail" aria-label={`${label} offer`}>
            <span>{label}</span>
        </div>
    );
}
