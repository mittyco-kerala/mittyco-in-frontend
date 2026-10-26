import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../Heropage.css";
import { getImageUrl } from "../../../utils/imageUrl";
import Hero_Query from "../queries/Hero_Query";
import fallbackHeroImage from "../../../assets/mittyco/pickle-range.jpeg";

const FALLBACK_HERO_SLIDES = [
    {
        id: "fallback-hero",
        subtitle: "AUTHENTICALLY MITTYCO",
        title: "Flavours made with care",
        description: "Discover homemade Kerala flavours crafted for every meal.",
        button_text: "Shop the collection",
        image: fallbackHeroImage,
    },
];

const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.results)) return value.results;
    if (Array.isArray(value?.items)) return value.items;
    return [];
};

const getHeroCopy = (...values) => values
    .map((value) => String(value ?? "").trim())
    .find((text) => text && text !== ".") || "";

const getHeroImage = (image) => image?.url || image?.image || image;

function Heropage() {
    const { data: rawHeroSlides } = Hero_Query();
    const apiHeroSlides = asArray(rawHeroSlides).filter((slide) => getHeroImage(slide?.image || slide?.banner_image || slide?.image_url));
    const heroSlides = apiHeroSlides.length > 0 ? apiHeroSlides : FALLBACK_HERO_SLIDES;
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (heroSlides.length < 2) return undefined;

        const timer = window.setInterval(() => {
            setCurrentSlide((index) => (index + 1) % heroSlides.length);
        }, 4500);

        return () => window.clearInterval(timer);
    }, [heroSlides.length]);

    const nextSlide = () => setCurrentSlide((index) => (index + 1) % heroSlides.length);
    const previousSlide = () => setCurrentSlide((index) => (index - 1 + heroSlides.length) % heroSlides.length);
    const activeSlideIndex = Math.min(currentSlide, heroSlides.length - 1);

    return (
        <div className="hero-page-wrapper">
            <section
                className="hero-split-layout single"
                aria-label="Mittyco featured products"
            >
                <div className="hero-carousel-section" aria-live="polite">
                    {heroSlides.map((slide, index) => {
                        const image = getHeroImage(slide.image || slide.banner_image || slide.image_url);
                        const title = getHeroCopy(slide.title, slide.heading) || "Mittyco favourites";
                        return (
                            <div
                                key={slide.id ?? `hero-${index}`}
                                className={`hero-slide ${activeSlideIndex === index ? "active" : ""}`}
                                aria-hidden={activeSlideIndex !== index}
                            >
                                <img src={getImageUrl(image)} alt={title} className="hero-image" />
                                <div className="hero-overlay" />
                                <div className="hero-content">
                                    {getHeroCopy(slide.subtitle, slide.eyebrow) && (
                                        <span className="hero-subtitle">{getHeroCopy(slide.subtitle, slide.eyebrow)}</span>
                                    )}
                                    <h1>{title}</h1>
                                    {getHeroCopy(slide.description, slide.text) && (
                                        <p>{getHeroCopy(slide.description, slide.text)}</p>
                                    )}
                                    <Link to="/shop" className="shop-btn-premium">
                                        {getHeroCopy(slide.button_text) || "Shop now"} <span className="arrow">→</span>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}

                    {heroSlides.length > 1 && (
                        <>
                            <button type="button" className="carousel-nav-btn prev-btn" onClick={previousSlide} aria-label="Previous hero banner">‹</button>
                            <button type="button" className="carousel-nav-btn next-btn" onClick={nextSlide} aria-label="Next hero banner">›</button>
                            <div className="hero-dots" role="tablist" aria-label="Hero banners">
                                {heroSlides.map((slide, index) => (
                                    <button
                                        type="button"
                                        key={slide.id ?? `hero-dot-${index}`}
                                        className={`modern-dot ${activeSlideIndex === index ? "active-modern-dot" : ""}`}
                                        onClick={() => setCurrentSlide(index)}
                                        aria-label={`Show hero banner ${index + 1}`}
                                        aria-selected={activeSlideIndex === index}
                                        role="tab"
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Heropage;
