import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../../../utils/imageUrl";
import defaultImage from "../../../assets/image_not_available.png";

function HomepageBrandSection({ brands }) {
    const navigate = useNavigate();
    const visibleBrands = Array.isArray(brands)
        ? brands.filter((brand) => brand?.id !== null && brand?.id !== undefined)
        : [];

    if (!visibleBrands.length) return null;

    return (
        <section className="brand-showcase" aria-labelledby="homepage-shop-by-brand">
            <header className="brand-showcase-header">
                <div>
                    <p className="brand-showcase-eyebrow">DISCOVER YOUR NEXT FAVOURITE</p>
                    <h2 id="homepage-shop-by-brand">Shop by brand</h2>
                    <p className="brand-showcase-copy">Explore hand-picked collections from the brands you love.</p>
                </div>
                <p className="brand-showcase-count"><strong>{visibleBrands.length}</strong> {visibleBrands.length === 1 ? "brand collection" : "brand collections"}</p>
            </header>

            <div className={`brand-showcase-grid ${visibleBrands.length === 1 ? "is-single" : ""}`}>
                {visibleBrands.map((brand) => {
                    const productCount = Number(brand.product_count || 0);
                    const brandName = brand.name || "Brand";
                    return (
                    <button
                        type="button"
                        className="brand-showcase-card"
                        key={brand.id}
                        aria-label={`Shop ${brandName}`}
                        onClick={() => navigate(`/products/?brand=${encodeURIComponent(brand.slug || brand.id)}`)}
                    >
                        <div className="brand-showcase-visual">
                            <span className="brand-showcase-orb" aria-hidden="true" />
                            <img src={getImageUrl(brand.logo) || defaultImage} alt="" />
                            <span className="brand-showcase-product-count">{productCount ? `${productCount} ${productCount === 1 ? "product" : "products"}` : "Explore collection"}</span>
                        </div>
                        <div className="brand-showcase-card-content">
                            <span>BRAND SPOTLIGHT</span>
                            <h3>{brandName}</h3>
                            <p>Discover the collection and find your perfect pick.</p>
                            <span className="brand-showcase-cta">Shop collection <b aria-hidden="true">→</b></span>
                        </div>
                    </button>
                    );
                })}
            </div>
        </section>
    );
}

export default HomepageBrandSection;

