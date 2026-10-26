import "./DirhamAmount.css";
import { formatINRValue } from "./dirhamFormat";

function DirhamSymbol({ className = "" }) {
    return <span className={`currency-symbol ${className}`.trim()} aria-label="Indian rupee">₹</span>;
}

export default function DirhamAmount({
    value,
    className = "",
    fallback = "—",
    useGrouping = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
}) {
    const formattedValue = formatINRValue(value, { useGrouping, minimumFractionDigits, maximumFractionDigits });
    if (formattedValue === null) return <span className={className}>{fallback}</span>;

    const numericValue = Number(value);
    return (
        <span className={`dirham-amount ${className}`.trim()}>
            {numericValue < 0 && <span className="dirham-amount-sign">−</span>}
            <DirhamSymbol />
            <span className="dirham-amount-value">{formattedValue}</span>
        </span>
    );
}
