import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import picklePoster from "../../../assets/mittyco/pickle-range.jpeg";
import coconutPoster from "../../../assets/mittyco/coconut-oil-cold.jpeg";
import kitchenPoster from "../../../assets/mittyco/garlic-pickle-product.jpeg";
import "../styles/MittycoVideoSection.css";

const videos = {
    kerala: {
        src: "/mittyco-videos/mittyco-coconut-oil-story.mp4",
        poster: coconutPoster,
        eyebrow: "Traditional coconut goodness",
        title: "From Kerala coconuts to every home",
        copy: "Mittyco coconut oil is prepared with care and packed in Kannur, Kerala — bringing a familiar taste and trusted quality to everyday cooking.",
    },
    pickle: {
        src: "/mittyco-videos/mittyco-pickle-story.mp4",
        poster: picklePoster,
        eyebrow: "Homemade goodness",
        title: "Pickle, jar by jar",
        copy: "Bold Kerala flavours made to bring rice, snacks, and everyday meals alive.",
    },
    kitchen: {
        src: "/mittyco-videos/mittyco-kitchen-story.mp4",
        poster: kitchenPoster,
        eyebrow: "Made with care",
        title: "A taste of our kitchen",
        copy: "Simple ingredients, honest recipes, and the warmth of food prepared with patience.",
    },
};

function BusinessVideo({ video, featured = false }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return undefined;

        const startPlayback = () => {
            videoElement.muted = true;
            videoElement.play().catch(() => {
                // Autoplay can still be blocked by a browser policy.
            });
        };

        if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            startPlayback();
        } else {
            videoElement.addEventListener("canplay", startPlayback);
        }

        return () => videoElement.removeEventListener("canplay", startPlayback);
    }, [video.src]);

    return (
        <div className={`mittyco-story-video-card ${featured ? "mittyco-story-video-card--featured" : ""}`}>
            <div className="mittyco-story-video-frame">
                <video
                    ref={videoRef}
                    className="mittyco-story-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onPause={(event) => {
                        event.currentTarget.play().catch(() => {
                            // Autoplay can still be blocked by a browser policy.
                        });
                    }}
                    preload="metadata"
                    poster={video.poster}
                >
                    <source src={video.src} type="video/mp4" />
                    Your browser does not support video playback.
                </video>
            </div>
            <div className="mittyco-story-video-copy">
                <p>{video.eyebrow}</p>
                <h3>{video.title}</h3>
                <span>{video.copy}</span>
            </div>
        </div>
    );
}

function MittycoVideoSection({ compact = false }) {
    return (
        <section
            className={`mittyco-video-section ${compact ? "mittyco-video-section--contact" : ""}`.trim()}
            aria-labelledby="mittyco-video-heading"
        >
            <div className="mittyco-story-block">
                <div className="mittyco-story-heading">
                    <div>
                        <p className="mittyco-video-eyebrow">MADE IN KERALA</p>
                        <h2 id="mittyco-video-heading">Rooted here. Made for every home.</h2>
                    </div>
                    <p className="mittyco-video-intro">
                        From our production and packaging unit in Kannur, Mittyco brings Kerala-made oils and pickles to your table.
                    </p>
                </div>
                <div className="mittyco-story-feature">
                    <BusinessVideo video={videos.kerala} featured />
                    <div className="mittyco-story-note">
                        <span className="mittyco-story-note-mark" aria-hidden="true">✦</span>
                        <h3>Nature&apos;s goodness delivered</h3>
                        <p>
                            Honest ingredients, careful preparation, and the taste of a business built around real food and real families.
                        </p>
                        <Link to="/about" className="mittyco-story-link">Our story <span aria-hidden="true">→</span></Link>
                    </div>
                </div>
            </div>

            <div className="mittyco-story-block mittyco-story-block--kitchen">
                <div className="mittyco-story-heading">
                    <div>
                        <p className="mittyco-video-eyebrow">FROM OUR KITCHEN</p>
                        <h2>Made with care. Shared with love.</h2>
                    </div>
                    <p className="mittyco-video-intro">
                        Watch the flavours behind Mittyco&apos;s homemade pickle collection and coconut oil range.
                    </p>
                </div>
                <div className="mittyco-story-grid">
                    <BusinessVideo video={videos.pickle} />
                    <BusinessVideo video={videos.kitchen} />
                </div>
            </div>

            <Link to="/shop" className="mittyco-video-cta">Shop Mittyco products <span aria-hidden="true">→</span></Link>
        </section>
    );
}

export default MittycoVideoSection;
