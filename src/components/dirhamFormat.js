export function formatINRValue(value, { useGrouping = false, minimumFractionDigits = 2, maximumFractionDigits = 2 } = {}) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;
    return Math.abs(numericValue).toLocaleString("en-IN", {
        useGrouping,
        minimumFractionDigits,
        maximumFractionDigits,
    });
}

// Kept as a compatibility alias for existing imports while the storefront
// transitions from its old currency component name to INR.
export const formatDirhamValue = formatINRValue;
