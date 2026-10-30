
import '../styles/Offer.css';
import Offer_Query from "../queries/Offer_Query";
import { getImageUrl } from '../../../utils/imageUrl';
import { isOfferActive } from "../offerEligibility";
import { formatOfferLabel } from "../../../features/home/utils/productPricing";

function OfferPoster() {
  const { data: offers = [], isLoading, error } = Offer_Query();
  const offer = offers.find(isOfferActive);

if (isLoading) {
    return (
        <div className="loading-container">
            <div className="loader"></div>
            
        </div>
    );
}

if (error) {
    return (
        <p className="error-text">
            Failed to load offers.
        </p>
    );
}

  return (
    <>
      {offer && (
        <section className="offer-banner-container">
          <div className="offer-banner">
            {/* Full-screen Background Image Layer */}
            {offer.image && (
              <div className="offer-image-fullscreen">
                <img
                  src={getImageUrl(offer.image)}
                  alt={offer.title}
                />
              </div>
            )}

            {/* Content Layer sitting on top (Z-Index) and on the left */}
            <div className="offer-content-overlay">
              <span className="offer-tag">LIMITED TIME COLLECTION</span>
              <h1 className="offer-title">{offer.title}</h1>
              {formatOfferLabel({ discountType: offer.discount_type, discountValue: offer.discount_value ?? offer.fixed_amount ?? offer.discount_percentage, discountPercentage: offer.discount_percentage }) && <span className="offer-discount-label">{formatOfferLabel({ discountType: offer.discount_type, discountValue: offer.discount_value ?? offer.fixed_amount ?? offer.discount_percentage, discountPercentage: offer.discount_percentage })}</span>}
              <p className="offer-description">{offer.description}</p>
              <button className="offer-btn" onClick={() => window.location.href = `/shop?offer=true`}>
                EXPLORE OFFERS
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default OfferPoster;
