import "../styles/New_Arrival_Home.css";
import Newarrival_Query from "../../newArrivals/queries/Newarrival_Query";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getImageUrl } from "../../../utils/imageUrl";
import Product_Query from "../../sale/queries/Product_Query";
import WishlistQuery from "../../wishlist/queries/WishlistQuery";
import { Wishlist_delete, Wishlist_post } from "../../wishlist/api/Wishlisht_Api";
import showToast from "../../../utils/toast";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { hasAuthSession } from "../../auth/authUtils";
import DirhamAmount from "../../../components/DirhamAmount";
import { getHomepageProductPricing } from "../utils/productPricing";
import ProductHighlightRail from "./ProductHighlightRail";
import ProductMessageRail from "./ProductMessageRail";

const MAX_PRODUCTS_PER_SECTION = 16;
const hasValue = (value) => value !== null && value !== undefined && value !== "";

function getProductSelection(product) {
    const variant = product?.variants?.[0] || (hasValue(product?.default_variant_id)
        ? { id: product.default_variant_id, price_type: hasValue(product.default_variant_unit_id) ? "multiple" : "single" }
        : null);
    const size = variant?.price_type === "single"
        ? null
        : variant?.sizes?.[0] || variant?.units?.[0] || (hasValue(product?.default_variant_unit_id) ? { id: product.default_variant_unit_id } : null);
    return { variant, size };
}

function getProductImage(product) {
    return product?.product_image
        || product?.image
        || product?.variants?.[0]?.images?.find((image) => image.is_primary)?.image
        || product?.variants?.[0]?.images?.[0]?.image;
}

function New_Arrival_Home({
    products,
    totalCount,
    title = "New Arrivals",
    subtitle = "The latest curated collection for the modern lifestyle.",
    viewAllTo = "/shop?sort=new",
    showNewBadge = false,
    tone = "new",
}) {
    const navigate = useNavigate();
    const hasProvidedProducts = Array.isArray(products);
    const { data: rawData, isLoading: newArrivalsLoading, error: newArrivalsError } = Newarrival_Query({ enabled: !hasProvidedProducts });
    const { data: rawShopData, isLoading: shopLoading } = Product_Query({}, { enabled: !hasProvidedProducts });
    const data = hasProvidedProducts ? products : (rawData?.results || []);
    const shopData = hasProvidedProducts ? [] : (rawShopData?.results || []);
    const isLoading = !hasProvidedProducts && (newArrivalsLoading || shopLoading);
    const error = hasProvidedProducts ? null : newArrivalsError;
    const { data: rawWishlist = [], refetch: refetchWishlist } = WishlistQuery();
    const wishlist = Array.isArray(rawWishlist) ? rawWishlist : rawWishlist?.results || [];
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => setShowLoader(false), 700);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [isLoading]);

    const displayData = hasProvidedProducts
        ? data.slice(0, MAX_PRODUCTS_PER_SECTION)
        : [...data, ...shopData.filter((item) => !data.some((arrival) => String(arrival.id) === String(item.id)))].slice(0, MAX_PRODUCTS_PER_SECTION);
    const availableCount = Number(totalCount ?? (hasProvidedProducts ? data.length : rawData?.count ?? data.length));
    const showViewAll = availableCount > MAX_PRODUCTS_PER_SECTION || data.length > MAX_PRODUCTS_PER_SECTION;

    if (hasProvidedProducts && !data.length) return null;

    const addToWishlist = async (product, event) => {
        event.stopPropagation();
        if (!hasAuthSession()) {
            showToast.info("Please login to continue");
            navigate("/login");
            return;
        }

        const { variant, size } = getProductSelection(product);
        if (!variant || (variant.price_type !== "single" && !size)) {
            showToast.error("Variant not available");
            return;
        }

        const wishlistItem = wishlist.find((item) => String(item.variant) === String(variant.id) && String(item.variant_size ?? "") === String(size?.id ?? ""));
        try {
            if (wishlistItem) {
                await Wishlist_delete(wishlistItem.id);
                showToast.success("Product removed from wishlist");
            } else {
                await Wishlist_post({ variant: variant.id, variant_size: size?.id ?? null });
                showToast.success("Product added to wishlist");
            }
            await refetchWishlist();
        } catch (requestError) {
            showToast.error(requestError?.response?.data?.detail || "Could not update wishlist");
        }
    };

    if (isLoading || showLoader) {
        return (
            <div className={`new-arrivals-wrapper new-arrivals-wrapper--${tone}`}>
                <section className="new-arrivals">
                    <div className="heading-container">
                        <div className="heading-text">
                            <h2>{title}</h2>
                            <p className="heading-sub">{subtitle}</p>
                        </div>
                        <div className="view-all-link skeleton" style={{ width: "80px", height: "24px", padding: 0 }} />
                    </div>
                    <div className="grid-container"><div className="new-arrivals-grid">{Array.from({ length: 16 }).map((_, index) => <div key={index} className="new-product-card"><div className="image-container skeleton" /><div className="product-details" style={{ marginTop: "15px" }}><div className="skeleton skeleton-text" style={{ width: "40%" }} /><div className="skeleton skeleton-text" style={{ width: "80%", height: "18px" }} /><div className="skeleton skeleton-text" style={{ width: "30%", marginTop: "8px" }} /></div></div>)}</div></div>
                </section>
            </div>
        );
    }

    if (error) return <p className="error-text">Failed to load products.</p>;
    if (!displayData.length) return null;

    return (
        <div className={`new-arrivals-wrapper new-arrivals-wrapper--${tone}`}>
            <section className="new-arrivals">
                <div className="heading-container">
                    <div className="heading-text">
                        <h2>{title}</h2>
                        <p className="heading-sub">{subtitle}</p>
                    </div>
                </div>

                <div className="grid-container">
                    <div className="new-arrivals-grid">
                        {displayData.map((item) => {
                            const { variant, size } = getProductSelection(item);
                            const isWishlisted = wishlist.some((wishlistItem) => String(wishlistItem.variant) === String(variant?.id) && String(wishlistItem.variant_size ?? "") === String(size?.id ?? ""));
                            const image = getProductImage(item);
                            const { currentPrice, originalPrice, discountPercentage, hasOffer } = getHomepageProductPricing(item, variant);

                            return (
                                <article key={item.id} className="new-product-card">
                                    <div className="image-container" onClick={() => navigate(`/single/${item.id}`)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(`/single/${item.id}`); }}>
                                        {(item.marketing_highlights?.length || hasOffer || (showNewBadge && item.is_active)) ? (
                                            <div className="product-image-topbar">
                                                <ProductHighlightRail highlights={item.marketing_highlights} placement="badge" />
                                                {hasOffer && <span className="badge-offer">{discountPercentage}% OFF</span>}
                                                {showNewBadge && item.is_active && <span className="badge-new">NEW</span>}
                                            </div>
                                        ) : null}
                                        <div className="product-image-stage">
                                            <img src={image ? getImageUrl(image) : undefined} alt={item.name} className="product-img" />
                                            <button type="button" className="quick-add-btn" onClick={(event) => { event.stopPropagation(); navigate(`/single/${item.id}`); }}>VIEW PRODUCT</button>
                                        </div>
                                        <button type="button" className={`wishlist-btn ${isWishlisted ? "is-wishlisted" : ""}`} onClick={(event) => addToWishlist(item, event)} aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}>{isWishlisted ? <FaHeart className="heart-icon" /> : <FaRegHeart className="heart-icon" />}</button>
                                    </div>

                                    <div className="product-details">
                                        <span className="product-tag">{item.category?.name || item.brand?.name || "EXCLUSIVE"}</span>
                                        <h3 className="newHome-product-title" title={item.name || "Product"}>
                                            {item.name || item.description || "Product"}
                                        </h3>
                                        <div className="product-meta">
                                            <div className="price-area">
                                                {originalPrice !== null && <span className="old-price"><DirhamAmount value={originalPrice} fallback="Price unavailable" /></span>}
                                                <span className="product-price"><DirhamAmount value={currentPrice} fallback="Price unavailable" /></span>
                                            </div>
                                        </div>
                                        <ProductMessageRail messages={item.product_messages} />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>

                {showViewAll && <div className="view-all-bottom-container" style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
                    <Link to={viewAllTo} className="view-all-btn">VIEW ALL<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="view-all-arrow"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></Link>
                </div>}
            </section>
        </div>
    );
}

export default New_Arrival_Home;
