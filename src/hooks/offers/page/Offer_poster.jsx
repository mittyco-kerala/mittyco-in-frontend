
import '../styles/Offer.css';
import Offer_Query from "../queries/Offer_Query";
import { getImageUrl } from '../../../utils/imageUrl';
import { isOfferActive } from "../offerEligibility";

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
