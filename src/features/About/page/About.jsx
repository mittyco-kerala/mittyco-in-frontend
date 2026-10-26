import "../styles/About.css";
import { Link, useNavigate } from "react-router-dom";
import { FaInstagram, FaLeaf, FaShieldAlt } from "react-icons/fa";
import mittycoLogo from "../../../assets/mittyco/mittyco-logo.jpeg";
import coldCoconutOil from "../../../assets/mittyco/coconut-oil-cold.jpeg";
import pickleRange from "../../../assets/mittyco/pickle-range.jpeg";

const About = () => {
    const navigate = useNavigate();

    return (
        <main className="about-modern-wrapper">
            <section className="about-modern-hero about-fade">
                <div className="hero-text-content">
                    <span className="hero-eyebrow">THE MITTYCO STORY</span>
                    <h1 className="hero-display">Good food starts with <span className="hero-italic">good ingredients.</span></h1>
                    <p className="hero-subtext">Mittyco is a Kerala food brand built around the things we value at home: natural ingredients, familiar recipes, careful preparation, and food worth sharing.</p>
                    <button className="hero-modern-btn" onClick={() => navigate("/shop")}>Explore our products <span className="arrow">→</span></button>
                </div>
                <div className="hero-image-content">
                    <div className="image-frame mittyco-about-image-frame"><img src={coldCoconutOil} alt="Mittyco cold pressed coconut oil" /></div>
                </div>
            </section>

            <section className="about-modern-story about-fade">
                <div className="story-left">
                    <div className="story-sticky">
                        <h2>Rooted in tradition. Made for today.</h2>
                        <p>Our coconut oils and homemade pickles are inspired by the flavours and methods passed down through Kerala homes. Every product is made to feel honest, useful, and close to home.</p>
                        <p>We make room for the details that matter: trusted ingredients, clear labelling, hygienic packing, and the taste of food prepared with patience.</p>
                        <div className="story-highlights">
                            <div className="highlight-box"><span className="highlight-title">Natural by choice</span><span className="highlight-text">No unnecessary shortcuts. Just carefully prepared oils and pickles.</span></div>
                            <div className="highlight-box"><span className="highlight-title">Made in Kannur</span><span className="highlight-text">Proudly produced and packed in Kerala for families everywhere.</span></div>
                        </div>
                    </div>
                </div>
                <div className="story-right"><img src={pickleRange} alt="Mittyco homemade pickle collection" className="story-vibe-img" /></div>
            </section>

            <section className="about-human-values about-fade">
                <div className="values-header">
                    <img className="about-brand-mark" src={mittycoLogo} alt="Mittyco — Nature's goodness delivered" />
                    <h2>What Mittyco stands for</h2>
                    <p>Simple food. Thoughtful making. A taste you can trust.</p>
                </div>
                <div className="values-grid">
                    <div className="value-card"><FaLeaf className="value-icon" /><h3>Honest ingredients</h3><p>We keep our recipes familiar and our promise clear: products made with care and nothing to hide.</p></div>
                    <div className="value-card"><FaShieldAlt className="value-icon" /><h3>Careful quality</h3><p>From preparation to packing, every batch is handled with attention and respect for the people who enjoy it.</p></div>
                    <div className="value-card"><FaInstagram className="value-icon" /><h3>Made to be shared</h3><p>Follow our journey and discover the everyday meals, flavours, and stories behind Mittyco.</p><a className="about-social-link" href="https://www.instagram.com/mi_ttyco/" target="_blank" rel="noreferrer">@mi_ttyco ↗</a></div>
                </div>
            </section>

            <section className="about-modern-quote about-fade">
                <blockquote>“Nature&apos;s goodness delivered — from our home in Kerala to yours.”</blockquote>
                <div className="quote-author">— The Mittyco family</div>
                <Link to="/contact" className="about-contact-link">Talk to Mittyco <span aria-hidden="true">→</span></Link>
            </section>
        </main>
    );
};

export default About;
