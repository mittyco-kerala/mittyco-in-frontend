import "./Home.css";
import Heropage from "./components/Heropage";
import Shop_by_category from "./components/Shop_by_category";
import New_Arrival_Home from "./components/New_Arrival_Home";
import HomepageProductSection from "./components/HomepageProductSection";
import HomepageBrandSection from "./components/HomepageBrandSection";
import HomepageTrustBenefits from "./components/HomepageTrustBenefits";
import MittycoVideoSection from "./components/MittycoVideoSection";
import Homepage_Query from "./queries/Homepage_Query";
import Product_Query from "../sale/queries/Product_Query";
import ContactUs from "../../components/Contact";

const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.results)) return value.results;
    if (Array.isArray(value?.items)) return value.items;
    return [];
};

const brandsFromProducts = (products) => {
    const brands = new Map();

    asArray(products).forEach((product) => {
        const brand = product?.brand;
        const id = brand?.id ?? brand?.pk;
        if (id === null || id === undefined) return;

        const current = brands.get(String(id));
        brands.set(String(id), {
            ...brand,
            id,
            product_count: (current?.product_count || 0) + 1,
        });
    });

    return [...brands.values()];
};

function HomeLoading() {
    return (
        <main className="homepage-discovery homepage-loading" aria-busy="true" aria-label="Loading homepage">
            <div className="homepage-loading-hero skeleton" />
            <div className="homepage-loading-section">
                <div className="skeleton skeleton-text" />
                <div className="homepage-loading-grid">{Array.from({ length: 8 }).map((_, index) => <div className="homepage-loading-card skeleton" key={index} />)}</div>
            </div>
        </main>
    );
}

function Home() {
    const { data: homepageData = {}, isLoading, isError, error, refetch } = Homepage_Query();
    const homepageBrands = asArray(homepageData.shop_by_brand);
    const { data: brandProducts } = Product_Query(
        { page_size: 100 },
        { enabled: !isLoading && !isError && homepageBrands.length === 0 }
    );
    if (isLoading) return <HomeLoading />;

    if (isError) {
        return (
            <main className="homepage-discovery homepage-state" role="alert">
                <h1>We couldn&apos;t load the home page</h1>
                <p>{error?.response?.data?.detail || "Please try again in a moment."}</p>
                <button type="button" onClick={() => refetch()}>Try again</button>
            </main>
        );
    }

    const categories = asArray(homepageData.categories);
    const newArrivals = homepageData.new_arrivals;
    const trendingNow = homepageData.trending_now;
    const topDeals = homepageData.top_deals;
    const bestSellers = homepageData.best_sellers;
    const justForYou = homepageData.just_for_you;
    const recentlyViewed = homepageData.recently_viewed;
    const shopByBrand = homepageBrands.length ? homepageBrands : brandsFromProducts(brandProducts);
    return (
        <main className="homepage-discovery">
            <Heropage />

            <div className="category-section-wrapper" style={{ background: "#fbfbf6", padding: "14px 15px 28px" }}>
                <Shop_by_category categories={categories.length ? categories : undefined} />
            </div>

            <New_Arrival_Home products={asArray(newArrivals)} totalCount={newArrivals?.count} showNewBadge tone="new" />
            <HomepageProductSection title="Trending now" eyebrow="Popular right now" section={trendingNow} tone="trending" />
            <HomepageProductSection title="Top deals" eyebrow="Best value" section={topDeals} tone="deals" />
            <HomepageProductSection title="Best sellers" eyebrow="Customer favourites" section={bestSellers} tone="bestsellers" />
            <HomepageProductSection title="Just for you" eyebrow="Picked for your next find" section={justForYou} tone="personal" />

            <HomepageBrandSection brands={shopByBrand} />

            <HomepageProductSection title="Recently viewed" eyebrow="Pick up where you left off" section={recentlyViewed} tone="recent" />

            <HomepageTrustBenefits benefits={asArray(homepageData.trust_benefits)} />

            <MittycoVideoSection />

            <ContactUs />
        </main>
    );
}

export default Home;
