import { useEffect } from "react";
import "./../styles/ProductCard.css";
import { FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Wishlist_post, Wishlist_delete } from "../../wishlist/api/Wishlisht_Api";
import WishlistQuery from "../../wishlist/queries/WishlistQuery";
import { getImageUrl } from "../../../utils/imageUrl";
import showToast from "../../../utils/toast";
import defaultImage from "../../../assets/image_not_available.png";
import { hasAuthSession } from "../../auth/authUtils";
import DirhamAmount from "../../../components/DirhamAmount";
import ProductHighlightRail from "../../home/components/ProductHighlightRail";
import ProductMessageRail from "../../home/components/ProductMessageRail";
import OfferSideRail from "../../home/components/OfferSideRail";
import { formatOfferLabel } from "../../home/utils/productPricing";

const hasValue = (value) => value !== null && value !== undefined && value !== "";

function getFirstVariant(product) {
    return product?.variants?.[0] || null;
}

function getFirstUnit(variant) {
    if (!variant || variant.price_type === "single") return null;
    return variant.sizes?.[0] || variant.units?.[0] || null;
}

function getProductSelection(product, preferredVariant = null) {
    const variant = preferredVariant || getFirstVariant(product) || (hasValue(product?.default_variant_id)
        ? { id: product.default_variant_id, price_type: hasValue(product.default_variant_unit_id) ? "multiple" : "single" }
        : null);
    const unit = getFirstUnit(variant) || (hasValue(product?.default_variant_unit_id)
        ? { id: product.default_variant_unit_id, stock: product.stock }
        : null);
    return { variant, unit };
}

function getProductImage(product, variant) {
    return variant?.images?.find((item) => item.is_primary)?.image
        || variant?.images?.[0]?.image
        || product?.image
        || product?.product_image;
}

function getAvailability(product, variant, unit) {
    if (hasValue(product?.availability)) return String(product.availability);
    if (hasValue(product?.stock_status)) return String(product.stock_status);

    if (product?.in_stock === true) return "In stock";
    if (product?.in_stock === false) return "Out of stock";

    const stock = unit?.stock ?? variant?.stock ?? product?.stock;
    if (hasValue(stock)) return Number(stock) > 0 ? "In stock" : "Out of stock";
    if (product?.is_available === false) return "Out of stock";
    return "Availability varies";
}

function getPricing(product, variant) {
    const originalPrice = variant?.price ?? product?.original_price ?? product?.starting_price;
    const currentPrice = variant?.discounted_price ?? variant?.price ?? product?.current_price ?? product?.discounted_price ?? product?.starting_price;
    const discountedPrice = variant?.discounted_price ?? product?.discounted_price;
    const hasOffer = product?.has_offer === true || (hasValue(product?.discount_percentage) && Number(product.discount_percentage) > 0);
    const discountType = product?.discount_type || variant?.discount_type || product?.offer?.discount_type || "PERCENTAGE";
    const discountValue = product?.discount_value ?? product?.fixed_amount ?? variant?.discount_value ?? variant?.fixed_amount ?? product?.discount_percentage;

    return { originalPrice, currentPrice, discountedPrice, hasOffer, discountType, discountValue };
}

function getVariantUnitLabel(variant) {
    const units = Array.isArray(variant?.sizes) ? variant.sizes : Array.isArray(variant?.units) ? variant.units : [];
    return units
        .map((item) => item?.unit?.name || item?.size?.name || item?.unit_name || item?.name)
        .filter(Boolean)
        .join(" / ");
}

function getVariantLabel(variant) {
    return variant?.color?.name || getVariantUnitLabel(variant) || variant?.sku || "";
}

function Product_card({ products = [], isLoading, error, page = 1, pageSize = 14, count = 0, onPageChange, showPagination = true, compact = false }) {
    const navigate = useNavigate();
    const { data: rawWishlist = [], refetch } = WishlistQuery();
    const wishdata = Array.isArray(rawWishlist) ? rawWishlist : rawWishlist?.results || [];
    const totalPages = Math.max(1, Math.ceil(Number(count || products.length) / pageSize));

    useEffect(() => { if (!compact) window.scrollTo(0, 0); }, [compact, page]);

    const addToWishlist = async (product, event, preferredVariant = null) => {
        event.stopPropagation();

        if (!hasAuthSession()) {
            showToast.info("Please login to continue");
            navigate("/login");
            return;
        }

        const { variant: firstVariant, unit: firstUnit } = getProductSelection(product, preferredVariant);
        if (!firstVariant || (firstVariant.price_type !== "single" && !firstUnit)) {
            showToast.error("Variant not available");
            return;
        }

        const wishlistItem = wishdata.find((item) => String(item.variant) === String(firstVariant.id) && String(item.variant_size ?? "") === String(firstUnit?.id ?? ""));
        try {
            if (wishlistItem) {
                await Wishlist_delete(wishlistItem.id);
                showToast.success("Product removed from wishlist");
            } else {
                await Wishlist_post({ variant: firstVariant.id, variant_size: firstUnit ? firstUnit.id : null });
                showToast.success("Product added to wishlist");
            }
            await refetch();
        } catch (requestError) {
            showToast.error(requestError?.response?.data?.detail || "Could not update wishlist");
        }
    };

    if (isLoading) {
        return <div className="catalog-container homepage-product-catalog"><section className="products shop-many-products">{Array.from({ length: 8 }).map((_, index) => <div className="product_card skeleton-card" key={index}><div className="product_img skeleton"></div><div className="product_info"><div className="skeleton skeleton-text category-skeleton"></div><div className="skeleton skeleton-text title-skeleton"></div><div className="skeleton skeleton-text price-skeleton"></div></div></div>)}</section></div>;
    }
    if (error) return <p className="error-state">Unable to load products. Please try again.</p>;
    if (!products.length) return null;

    const cardEntries = products.flatMap((product) => {
        const variants = Array.isArray(product?.variants) ? product.variants : [];
        if (variants.length > 1) return variants.map((variant) => ({ product, variant, splitVariant: true }));
        return [{ product, variant: variants[0] || null, splitVariant: false }];
    });

    return <div className="catalog-container homepage-product-catalog"><section className={`products ${cardEntries.length <= 3 ? "shop-few-products" : "shop-many-products"}`}>
        {cardEntries.map(({ product, variant: cardVariant, splitVariant }) => {
            const { variant: firstVariant, unit: firstUnit } = getProductSelection(product, cardVariant);
            const isWishlisted = !!wishdata.find((item) => String(item.variant) === String(firstVariant?.id) && String(item.variant_size ?? "") === String(firstUnit?.id ?? ""));
            const { originalPrice, currentPrice, discountedPrice, hasOffer, discountType, discountValue } = getPricing(product, firstVariant);
            const offerLabel = formatOfferLabel({ discountType, discountValue, discountPercentage: product.discount_percentage });
            const image = getProductImage(product, firstVariant);
            const displayPrice = hasOffer && hasValue(discountedPrice) ? discountedPrice : currentPrice;
            const showOriginalPrice = hasOffer && hasValue(originalPrice) && hasValue(displayPrice) && String(originalPrice) !== String(displayPrice);
            const availability = getAvailability(product, firstVariant, firstUnit);
            const variantLabel = splitVariant ? getVariantLabel(firstVariant) : "";

            const openProduct = () => navigate(`/single/${product.id}${firstVariant?.id ? `?variant=${firstVariant.id}` : ""}`);
            const openProductWithKeyboard = (event) => {
                if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                openProduct();
            };

            return <article className="product_card" key={`${product.id}-${firstVariant?.id || "default"}`} role="link" tabIndex={0} aria-label={`View ${product.name || "product"}`} onClick={openProduct} onKeyDown={openProductWithKeyboard}>
                <div className="product_img">
                    {product.marketing_highlights?.length ? (
                        <div className="product-image-topbar">
                            <ProductHighlightRail highlights={product.marketing_highlights} placement="badge" />
                        </div>
                    ) : null}
                    <div className="product-image-stage">
                        <img src={image ? getImageUrl(image) : defaultImage} alt={product.name || "Product"} />
                        <button
                            type="button"
                            className="quick-add-bar"
                            onClick={(event) => {
                                event.stopPropagation();
                                openProduct();
                            }}
                        >
                            VIEW PRODUCT
                        </button>
                    </div>
                    {hasOffer && <OfferSideRail discountType={discountType} discountValue={discountValue} percentage={product.discount_percentage} />}
                    <button className={`favorite_btn ${isWishlisted ? "active" : ""}`} onClick={(event) => addToWishlist(product, event, firstVariant)} aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}><FaHeart /></button>
                </div>
                <div className="product_info">
                    <span className="product-category">{product.category?.name || product.brand?.name || ""}</span>
                    <h3 className="product-title">{product.name}</h3>
                    {variantLabel && <span className="product-variant-label">{variantLabel}</span>}
                    <div className="product-details-bottom">
                        <ProductMessageRail messages={product.product_messages} />
                        <div className="product-footer">
                            <div className="price-box">
                                {showOriginalPrice ? (
                                    <span className="old-price"><DirhamAmount value={originalPrice} fallback="Price unavailable" /></span>
                                ) : null}
                                <span className={showOriginalPrice ? "new-price" : "price"}>
                                    <DirhamAmount value={displayPrice} fallback="Price unavailable" />
                                </span>
                                {hasOffer && showOriginalPrice && <span className="price-savings">Save {offerLabel.replace(" OFF", "")}</span>}
                            </div>
                        </div>
                        <span className={`product-availability ${availability.toLowerCase().includes("out") ? "is-unavailable" : ""}`}>{availability}</span>
                    </div>
                </div>
            </article>;
        })}
    </section>
    {showPagination && totalPages > 1 && <div className="pagination-wrapper" aria-label="Product pages"><div className="numbers"><button type="button" className="page-num pagination-arrow" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>‹</button>{Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map((number) => <button type="button" key={number} className={`page-num ${page === number ? "active" : ""}`} onClick={() => onPageChange?.(number)}>{number}</button>)}<button type="button" className="page-num pagination-arrow" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>›</button></div></div>}
    </div>;
}

export default Product_card;
