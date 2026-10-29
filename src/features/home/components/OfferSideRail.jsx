function formatPercentage(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0 || numericValue > 100) return null;
    return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export default function OfferSideRail({ percentage }) {
    const formattedPercentage = formatPercentage(percentage);
    if (!formattedPercentage) return null;

    return (
        <div className="offer-side-rail" aria-label={`${formattedPercentage}% offer`}>
            <span>{formattedPercentage}% OFF</span>
        </div>
    );
}
