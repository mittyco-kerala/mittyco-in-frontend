import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { getErrorMessage, getResource, listResource } from "../services/adminApi";
import { EmptyState, LoadingState } from "../components/AdminPrimitives";
import { getImageUrl } from "../../../utils/imageUrl";
import defaultImage from "../../../assets/image_not_available.png";
import DirhamAmount from "../../../components/DirhamAmount";
import "../styles/ProductEditor.css";

const EMPTY_VALUE = "\u2014";
const rows = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
const idOf = (value) => value?.id ?? value?.pk ?? value;
const labelOf = (value) => typeof value === "object" ? value?.name || value?.title || `#${idOf(value)}` : value || EMPTY_VALUE;
const imagePath = (image) => String(image?.image || image?.url || "").split("?")[0].replace(/^\/+/, "").toLowerCase();
const uniqueImages = (images = []) => {
    const seen = new Set();
    return images.filter((image) => {
        const path = imagePath(image);
        const identity = path ? `path:${path}` : `id:${idOf(image)}`;
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
    });
};

function textValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join("\n").trim();
    return value === null || value === undefined ? "" : String(value).trim();
}

function keyFeatures(value) {
    if (Array.isArray(value)) {
        return value
            .map((feature) => feature && typeof feature === "object" ? feature.name || feature.title || feature.description || "" : feature)
            .map((feature) => String(feature || "").trim())
            .filter(Boolean);
    }
    if (value === null || value === undefined) return [];
    const text = String(value).trim();
    if (!text) return [];
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return keyFeatures(parsed);
    } catch {
        // Plain text is the default product editor format.
    }
    return text
        .split(/\r?\n|\u2022|\u25cf|\u25aa|\u25e6/)
        .map((feature) => feature.replace(/^\s*[-*]\s*/, "").trim())
        .filter(Boolean);
}

const money = (value) => value === null || value === undefined || value === "" ? EMPTY_VALUE : <DirhamAmount value={value} />;

export default function ProductView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [references, setReferences] = useState({ categories: [], subcategories: [], offers: [], colors: [], unitTypes: [], units: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const productResponse = await getResource("products", id);
                const variantResponse = await listResource("product-variants", { product: id, page_size: 500 });
                const variantRows = rows(variantResponse.data);
                const details = await Promise.all(variantRows.map(async (variant) => {
                    const [units, images] = await Promise.all([
                        listResource("product-variant-units", { variant: idOf(variant), page_size: 500 }),
                        listResource("product-images", { variant: idOf(variant), page_size: 500 }),
                    ]);
                    return {
                        ...variant,
                        units: rows(units.data),
                        images: uniqueImages(rows(images.data).sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))),
                    };
                }));
                if (active) {
                    setProduct(productResponse.data);
                    setVariants(details);
                }
            } catch (requestError) {
                if (active) setError(getErrorMessage(requestError, "Could not load product."));
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => { active = false; };
    }, [id]);

    useEffect(() => {
        let active = true;
        Promise.all([
            listResource("categories", { page_size: 500 }),
            listResource("subcategories", { page_size: 500 }),
            listResource("offers", { page_size: 500 }),
            listResource("colors", { page_size: 500 }),
            listResource("unit-types", { page_size: 500 }),
            listResource("units", { page_size: 500 }),
        ]).then(([categories, subcategories, offers, colors, unitTypes, units]) => {
            if (active) setReferences({
                categories: rows(categories.data),
                subcategories: rows(subcategories.data),
                offers: rows(offers.data),
                colors: rows(colors.data),
                unitTypes: rows(unitTypes.data),
                units: rows(units.data),
            });
        }).catch(() => {});
        return () => { active = false; };
    }, []);

    const lookupLabel = (value, collection) => labelOf(collection.find((item) => String(idOf(item)) === String(idOf(value))) || value);

    if (loading) return <div className="admin-page"><LoadingState label="Loading product..." /></div>;
    if (error) return <div className="admin-page"><div className="admin-form-error product-editor-error">{error}</div><button className="admin-button secondary" onClick={() => navigate("/mittyco-dashboard/products")}><FiArrowLeft /> Back to Products</button></div>;
    if (!product) return <div className="admin-page"><EmptyState title="Product not found" /></div>;

    const descriptionText = textValue(product.description);
    const features = keyFeatures(product.key_features);

    return (
        <div className="admin-page product-view-page">
            <div className="product-view-toolbar">
                <button className="admin-button secondary" onClick={() => navigate("/mittyco-dashboard/products")}><FiArrowLeft /> Back to Products</button>
            </div>

            <div className="admin-page-header">
                <div>
                    <p className="admin-eyebrow">PRODUCT VIEW</p>
                    <h2>{product.name}</h2>
                    <p>Read-only product details and variant information.</p>
                </div>
            </div>

            <section className="product-view-card">
                <div className="product-view-card-heading">
                    <div><h3>Product Information</h3><p>General information, description, and selling details.</p></div>
                </div>

                {(descriptionText || features.length > 0) && <div className="product-view-copy-grid">
                    {descriptionText && <div className="product-view-copy-block product-view-description"><small>Description</small><p>{descriptionText}</p></div>}
                    {features.length > 0 && <div className="product-view-copy-block product-view-key-features"><small>Key features</small><ul>{features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}</ul></div>}
                </div>}

                <div className="product-view-grid">
                    <div><small>Category</small><p>{lookupLabel(product.category, references.categories)}</p></div>
                    <div><small>Subcategory</small><p>{lookupLabel(product.subcategory, references.subcategories)}</p></div>
                    <div><small>Offer</small><p>{lookupLabel(product.offer, references.offers)}</p></div>
                    <div><small>Seller</small><p>{product.seller_name || EMPTY_VALUE}</p></div>
                    <div><small>Shipping fee</small><p>{money(product.shipping_fee)}</p></div>
                    <div><small>Delivery time</small><p>{product.estimated_delivery_time || EMPTY_VALUE}</p></div>
                    <div><small>Warranty</small><p>{product.warranty_info || EMPTY_VALUE}</p></div>
                    <div><small>Current viewers</small><p>{product.current_viewers_count ?? 0}</p></div>
                    <div><small>Status</small><p>{product.is_active ? "Active" : "Inactive"}</p></div>
                    <div><small>Promotional link</small><p>{product.promotional_banner_link || EMPTY_VALUE}</p></div>
                </div>

                {product.promotional_banner_image && <div className="product-view-media"><small>Promotional image</small><img className="product-view-promo-image" src={getImageUrl(product.promotional_banner_image)} alt={`${product.name} promotion`} /></div>}
            </section>

            <section className="product-view-card">
                <div className="product-view-card-heading">
                    <div><h3>Variants</h3><p>Colors, pricing, stock, units, and images.</p></div>
                    <span className="product-view-count">{variants.length} {variants.length === 1 ? "variant" : "variants"}</span>
                </div>
                {variants.length ? variants.map((variant, index) => {
                    const primary = variant.images.find((image) => image.is_primary) || variant.images[0];
                    const additionalImages = variant.images.filter((image) => {
                        if (!primary) return true;
                        const primaryPath = imagePath(primary);
                        return idOf(image) !== idOf(primary) && (!primaryPath || imagePath(image) !== primaryPath);
                    });
                    const colorLabel = lookupLabel(variant.color, references.colors);
                    return <article className="product-view-variant" key={idOf(variant) || index}>
                        <div className="product-view-variant-head">
                            <div>
                                <strong>{colorLabel !== EMPTY_VALUE ? colorLabel : `Variant ${index + 1}`}</strong>
                                <span>{variant.price_type === "multiple" ? "Multiple price" : <>Single price · {money(variant.price)} · Stock {variant.stock ?? 0}</>}</span>
                                {variant.sku && <small>SKU: {variant.sku}</small>}
                            </div>
                            {primary?.image && <img src={getImageUrl(primary.image)} alt={colorLabel} onError={(event) => { event.currentTarget.src = defaultImage; }} />}
                        </div>
                        {variant.price_type === "multiple" && <div className="product-view-units"><div className="product-view-units-heading"><span>Unit</span><span>Price / Stock</span></div>{variant.units.map((unit, unitIndex) => <div key={idOf(unit) || unitIndex}><span>{lookupLabel(unit.unit_type, references.unitTypes)} / {lookupLabel(unit.unit, references.units)}{unit.sku && <small>SKU: {unit.sku}</small>}</span><strong>{money(unit.price)} · Stock {unit.stock ?? 0}</strong></div>)}</div>}
                        {additionalImages.length > 0 && <div className="product-view-images">{additionalImages.map((image, imageIndex) => <img key={idOf(image) || imageIndex} src={getImageUrl(image.image)} alt={`${product.name} ${colorLabel} image ${imageIndex + 2}`} onError={(event) => { event.currentTarget.src = defaultImage; }} />)}</div>}
                    </article>;
                }) : <EmptyState title="No variants" description="This product has no variants yet." />}
            </section>
        </div>
    );
}
