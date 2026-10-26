import { useEffect, useMemo, useRef, useState } from "react";
import { getImageUrl } from "../../../utils/imageUrl";
import defaultImage from "../../../assets/image_not_available.png";
import DirhamAmount from "../../../components/DirhamAmount";
import "../style/RelatedProductsModal.css";

const idOf = (value) => value?.id ?? value?.pk ?? value?.uuid ?? value ?? null;
const asList = (value) => Array.isArray(value) ? value : [];

function optionLabel(option) {
    if (!option) return "";
    if (typeof option === "string" || typeof option === "number") return String(option);
    return option.name || option.label || option.title || option.unit?.name || option.unit?.label || option.size?.name || option.size?.label || option.unit || option.size || `Option ${idOf(option)}`;
}

function productImage(product) {
    if (product?.image) return product.image;
    const firstVariant = asList(product?.variants)[0];
    const firstImage = asList(firstVariant?.images).find((image) => image?.is_primary) || asList(firstVariant?.images)[0];
    return firstImage?.image || firstImage?.url || "";
}

function displayPrice(product) {
    const price = product?.discounted_price ?? product?.starting_price ?? product?.price;
    return price === null || price === undefined || price === "" ? null : Number(price);
}

function originalPrice(product) {
    const current = displayPrice(product);
    const original = product?.starting_price ?? product?.price;
    const numeric = original === null || original === undefined || original === "" ? null : Number(original);
    return Number.isFinite(numeric) && Number.isFinite(current) && numeric > current ? numeric : null;
}

function priceText(price) {
    return <DirhamAmount value={price} fallback="Price available in cart" />;
}

function variantsFor(product) {
    return asList(product?.variants);
}

function unitsFor(variant) {
    return asList(variant?.sizes || variant?.units || variant?.variant_sizes);
}

function initialChoice(product) {
    const variants = variantsFor(product);
    const defaultId = idOf(product?.default_variant_id);
    const defaultVariant = variants.find((variant) => String(idOf(variant)) === String(defaultId));
    const needsSelection = Boolean(product?.requires_variant_selection);
    const variant = needsSelection ? null : (defaultVariant || variants[0] || null);
    return {
        selected: false,
        variantId: idOf(variant),
        variantSizeId: null,
    };
}

function choicesFor(products) {
    return Object.fromEntries(asList(products).map((product) => [String(idOf(product)), initialChoice(product)]));
}

function getValidation(product, choice) {
    if (!choice?.selected) return "";
    const variants = variantsFor(product);
    const selectedVariant = variants.find((variant) => String(idOf(variant)) === String(choice.variantId));
    if (product?.requires_variant_selection && !choice.variantId) return "Choose a variant before adding this product.";
    if (variants.length && !selectedVariant) return "Choose an available variant before adding this product.";
    if (selectedVariant?.price_type === "multiple" && !choice.variantSizeId) return "Choose a size or unit before adding this product.";
    return "";
}

export default function RelatedProductsModal({ products, sourceProductId, onClose, onAddSelected, onRefreshChoices }) {
    const [choices, setChoices] = useState(() => choicesFor(products));
    const [errors, setErrors] = useState({});
    const [requestError, setRequestError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const dialogRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        previousFocusRef.current = document.activeElement;
        const timeout = window.setTimeout(() => dialogRef.current?.focus(), 0);
        const onKeyDown = (event) => {
            if (event.key === "Escape" && !submitting) onClose();
            if (event.key === "Tab") {
                const focusable = [...(dialogRef.current?.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])") || [])];
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            window.clearTimeout(timeout);
            document.removeEventListener("keydown", onKeyDown);
            previousFocusRef.current?.focus?.();
        };
    }, [onClose, submitting]);

    const selectedProducts = useMemo(() => asList(products).filter((product) => choices[String(idOf(product))]?.selected), [products, choices]);
    const hasInvalidSelection = selectedProducts.some((product) => getValidation(product, choices[String(idOf(product))]));

    const updateChoice = (productId, update) => {
        setRequestError("");
        setChoices((current) => ({ ...current, [String(productId)]: { ...current[String(productId)], ...update } }));
        setErrors((current) => ({ ...current, [String(productId)]: "" }));
    };

    const refreshChoices = async () => {
        if (!onRefreshChoices) return;
        try {
            const freshProducts = await onRefreshChoices();
            if (Array.isArray(freshProducts)) {
                setChoices(choicesFor(freshProducts));
            }
        } catch {
            // Keep the current options usable if the refresh itself fails.
        }
    };

    const submit = async () => {
        const nextErrors = Object.fromEntries(selectedProducts.map((product) => [String(idOf(product)), getValidation(product, choices[String(idOf(product))])]).filter(([, message]) => message));
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            setRequestError("Choose the required options for each selected product.");
            return;
        }

        if (!selectedProducts.length) {
            onClose();
            return;
        }

        const relatedProducts = selectedProducts.map((product) => {
            const choice = choices[String(idOf(product))];
            return {
                product: idOf(product),
                variant: choice.variantId || idOf(product?.default_variant_id),
                ...(choice.variantSizeId ? { variant_size: choice.variantSizeId } : {}),
                quantity: 1,
            };
        });

        setSubmitting(true);
        setRequestError("");
        try {
            const result = await onAddSelected({ source_product: sourceProductId, related_products: relatedProducts });
            if (result?.unavailable) {
                setRequestError("Some selected related products are no longer available.");
                await refreshChoices();
                onClose();
                return;
            }
            onClose();
        } catch (error) {
            const data = error?.response?.data || {};
            const errorCode = data.error_code || data.code;
            if (errorCode === "RELATED_VARIANT_REQUIRED") {
                const nextErrors = Object.fromEntries(selectedProducts.map((product) => [String(idOf(product)), "Choose a variant before adding this product."]));
                setErrors(nextErrors);
                setRequestError(data.message || "Choose a variant for each selected product.");
            } else if (errorCode === "RELATED_PRODUCT_NOT_ALLOWED") {
                setRequestError(data.message || "One or more related products are no longer available for this item.");
                await refreshChoices();
            } else {
                setRequestError(data.message || data.detail || "We could not add the selected products. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="related-products-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
            <section className="related-products-modal" role="dialog" aria-modal="true" aria-labelledby="related-products-title" aria-describedby="related-products-description" ref={dialogRef} tabIndex="-1">
                <header className="related-products-header">
                    <div>
                        <p className="related-products-eyebrow">COMPLETE YOUR ORDER</p>
                        <h2 id="related-products-title">You may also like</h2>
                        <p id="related-products-description">Add any of these items to your cart. Your main product has already been added.</p>
                    </div>
                    <button type="button" className="related-products-close" onClick={onClose} disabled={submitting} aria-label="No thanks, close related products">&times;</button>
                </header>

                {requestError && <div className="related-products-message" role="alert">{requestError}</div>}

                <div className="related-products-list">
                    {asList(products).map((product) => {
                        const productId = String(idOf(product));
                        const choice = choices[productId] || initialChoice(product);
                        const variants = variantsFor(product);
                        const selectedVariant = variants.find((variant) => String(idOf(variant)) === String(choice.variantId));
                        const sizes = unitsFor(selectedVariant);
                        const currentPrice = displayPrice(product);
                        const compareAt = originalPrice(product);
                        const cardError = errors[productId];
                        const hasVariantControl = Boolean(product?.requires_variant_selection || variants.length > 1);
                        const selectionGuidance = getValidation(product, choice);
                        return (
                            <article className={`related-product-card ${choice.selected ? "is-selected" : ""}`} key={productId}>
                                <label className="related-product-check">
                                    <input type="checkbox" checked={Boolean(choice.selected)} onChange={(event) => updateChoice(productId, { selected: event.target.checked })} disabled={submitting} />
                                    <span>Add to cart</span>
                                </label>
                                <img className="related-product-image" src={productImage(product) ? getImageUrl(productImage(product)) : defaultImage} alt="" onError={(event) => { event.currentTarget.src = defaultImage; }} />
                                <div className="related-product-info">
                                    <h3>{product.name || "Related product"}</h3>
                                    {product.description && <p className="related-product-description">{product.description}</p>}
                                    <p className="related-product-price"><strong>{priceText(currentPrice)}</strong>{compareAt && <s>{priceText(compareAt)}</s>}{product.discount_percentage ? <span>Save {product.discount_percentage}%</span> : null}</p>
                                    {choice.selected && hasVariantControl && <label className="related-option-field"><span>Variant{product?.requires_variant_selection ? " *" : ""}</span><select value={choice.variantId || ""} onChange={(event) => updateChoice(productId, { variantId: event.target.value || null, variantSizeId: null })} disabled={submitting}><option value="">Choose a variant</option>{variants.map((variant, index) => <option key={idOf(variant) || index} value={idOf(variant)}>{optionLabel(variant.color) || variant.name || variant.title || `Variant ${index + 1}`}</option>)}</select></label>}
                                    {choice.selected && selectedVariant?.price_type === "multiple" && <label className="related-option-field"><span>Size / unit *</span><select value={choice.variantSizeId || ""} onChange={(event) => updateChoice(productId, { variantSizeId: event.target.value || null })} disabled={submitting}><option value="">Choose a size or unit</option>{sizes.map((size, index) => <option key={idOf(size) || index} value={idOf(size)}>{optionLabel(size)}</option>)}</select></label>}
                                    {choice.selected && (cardError || selectionGuidance) && <small className="related-product-error" role="alert">{cardError || selectionGuidance}</small>}
                                </div>
                            </article>
                        );
                    })}
                </div>

                <footer className="related-products-actions">
                    <button type="button" className="related-products-no-thanks" onClick={onClose} disabled={submitting}>No, Thanks</button>
                    <button type="button" className="related-products-add" onClick={submit} disabled={submitting || hasInvalidSelection}>{submitting ? "Adding..." : selectedProducts.length ? `Add Selected (${selectedProducts.length})` : "Continue"}</button>
                </footer>
            </section>
        </div>
    );
}
