import { FiCreditCard, FiHeadphones, FiRefreshCw, FiTruck } from "react-icons/fi";

const TRUST_BENEFIT_ICONS = {
    "secure-payment": FiCreditCard,
    "delivery-information": FiTruck,
    "customer-support": FiHeadphones,
    "easy-returns": FiRefreshCw,
};

function HomepageTrustBenefits({ benefits }) {
    const visibleBenefits = Array.isArray(benefits)
        ? benefits.filter((benefit) => benefit && TRUST_BENEFIT_ICONS[benefit.icon_key])
        : [];

    if (!visibleBenefits.length) return null;

    return (
        <section className="homepage-benefits" aria-labelledby="homepage-trust-benefits">
            <div className="homepage-section-heading homepage-benefits-heading">
                <div>
                    <h2 id="homepage-trust-benefits">Trust &amp; benefits</h2>
                </div>
            </div>
            <div className="homepage-benefits-grid">
                {visibleBenefits.map((benefit, index) => {
                    const Icon = TRUST_BENEFIT_ICONS[benefit.icon_key];
                    return (
                    <article className="homepage-benefit" key={benefit.id ?? benefit.key ?? `${benefit.icon_key}-${index}`}>
                        <span className="homepage-benefit-icon" aria-hidden="true"><Icon /></span>
                        <h3>{benefit.title}</h3>
                        <p>{benefit.description}</p>
                    </article>
                    );
                })}
            </div>
        </section>
    );
}

export default HomepageTrustBenefits;

