import React, { useState, useEffect } from 'react';
import '../styles/HeroSlider.css';
import { NavLink } from 'react-router-dom'
import Men from '../../../assets/Hero_Men.webp'

// Sample data representing your slides
const SLIDE_DATA = [
    {
        id: '01',
        headingTop: 'ELEGANCE MEETS',
        headingMainFilled: 'VIBRANT',
        headingMainOutline: 'VISION',
        description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem, totam rem aperiam, eaque ipsa quae ab illo inventore et quasi architecto beatae vitae dicta sunt explicabo.',
        image: Men
    },
    {
        id: '02',
        headingTop: 'BOLD & BEAUTIFUL',
        headingMainFilled: 'MODERN',
        headingMainOutline: 'STYLE',
        description: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
    },
    {
        id: '03',
        headingTop: 'PURE CREATIVITY',
        headingMainFilled: 'ARTISTIC',
        headingMainOutline: 'SOUL',
        description: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore.',
        image:Men
    },
    {
        id: '04',
        headingTop: 'TIMELESS GRACE',
        headingMainFilled: 'CLASSIC',
        headingMainOutline: 'TOUCH',
        description: 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur Quis autem vel eum.',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
    }
];

export default function HeroSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Automatically switch slides every 3 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDE_DATA.length);
        }, 3000);

        // Cleanup the timer when the component unmounts to prevent memory leaks
        return () => clearInterval(timer);
    }, []);

    const currentSlide = SLIDE_DATA[currentIndex];

    return (
        <section className="hero-section">
            {/* Background Image / Image Container */}
            <div className="hero-image-container">
                <img
                    src={currentSlide.image}
                    alt={currentSlide.headingMainFilled}
                    className="hero-image"
                />
                {/* Dark overlay to match the reference look */}
                <div className="hero-overlay"></div>
            </div>

            {/* Main Content Area */}
            <div className="hero-content">
                <h3 className="hero-subheading">{currentSlide.headingTop}</h3>
                <h1 className="hero-title">
                    <span className="text-filled">{currentSlide.headingMainFilled}</span>{' '}
                    <span className="text-outlined">{currentSlide.headingMainOutline}</span>
                </h1>
                <p className="hero-description">{currentSlide.description}</p>

                {/* Call to Action Button */}
                <NavLink to='/shop'>
                    <div className="hero-cta">
                        <span className="cta-text">Buy the Latest Trend</span>
                        <div className="cta-circle-arrow">
                            <span className="arrow">→</span>
                        </div>
                    </div>
                </NavLink>
            </div>
            {/* Right-side Vertical Navigation / Numbers Indicator */}
            <div className="hero-navigation">
                {SLIDE_DATA.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`nav-number-item ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)} // Optional: Allows user to click numbers to jump slides
                    >
                        {index === currentIndex && <span className="active-line">—</span>}
                        <span className="number-text">{slide.id}</span>
                    </div>
                ))}
            </div>
        </section >
    );
}
