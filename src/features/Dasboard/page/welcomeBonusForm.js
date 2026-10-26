const toIsoDateTime = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString() : value;

export function validateWelcomeBonus(values) {
    const errors = {};
    if (!values.name.trim()) errors.name = "Name is required.";
    if (values.applicability_type === "PRODUCT" && !values.product) errors.product = "Select a product.";
    if (values.applicability_type === "CATEGORY" && !values.category) errors.category = "Select a category.";
    if (values.discount_type === "PERCENTAGE") {
        if (!Number.isFinite(Number(values.discount_percentage)) || Number(values.discount_percentage) <= 0 || Number(values.discount_percentage) > 100) errors.discount_percentage = "Enter a percentage greater than 0 and at most 100.";
    } else if (!Number.isFinite(Number(values.fixed_amount)) || Number(values.fixed_amount) <= 0) {
        errors.fixed_amount = "Enter a fixed amount greater than 0.";
    }
    if (!values.start_date) errors.start_date = "Start date is required.";
    if (!values.end_date) errors.end_date = "End date is required.";
    if (values.start_date && values.end_date && new Date(values.end_date) <= new Date(values.start_date)) errors.end_date = "End date must be after the start date.";
    return errors;
}

export function welcomeBonusPayload(values) {
    const productWise = values.applicability_type === "PRODUCT";
    const percentage = values.discount_type === "PERCENTAGE";
    return {
        name: values.name.trim(),
        applicability_type: values.applicability_type,
        product: productWise ? Number(values.product) || values.product : null,
        category: productWise ? null : Number(values.category) || values.category,
        discount_type: values.discount_type,
        discount_percentage: percentage ? Number(values.discount_percentage) : null,
        fixed_amount: percentage ? null : Number(values.fixed_amount),
        start_date: toIsoDateTime(values.start_date),
        end_date: toIsoDateTime(values.end_date),
        is_active: Boolean(values.is_active),
    };
}
