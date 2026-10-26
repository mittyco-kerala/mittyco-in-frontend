import "./../Footer.css";

import footerlogo from './../assets/mittyco/mittyco-logo-transparent.png'
import { Link } from 'react-router-dom';
import { FaInstagram, FaEnvelope, FaMapMarkerAlt, } from "react-icons/fa";
function Footer() {
    return (
        <div>

            <footer className="footer">

                <div className="footer-container">

                    <div className="footer-column brand">
                        <img src={footerlogo} alt="Mittyco — Nature's goodness delivered" className="footer-logo" />
                        <p>Authentic coconut oils and homemade pickles from our kitchen in Kannur, Kerala.<br />FSSAI No: 21325250000662</p>
                    </div>

                    <div className="footer-column social-column">
                        <h3>Follow Us</h3>

                        <div className="social-icons">
                            <a href="https://www.instagram.com/mi_ttyco/" target="_blank" rel="noreferrer" aria-label="Mittyco on Instagram">
                                <FaInstagram />
                            </a>
                        </div>
                    </div>

                    <div className="footer-column">
                        <h3>Quick Links</h3>

                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/shop">Shop</Link></li>
                            <li><Link to="/shop">Categories</Link></li>
                            <li><Link to="/shop?offer=true">Offers</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Customer Care</h3>

                        <ul>
                            <li><Link to="/profile">My Account</Link></li>
                            <li><Link to="/myorders">Track Order</Link></li>
                            <li><Link to="/myorders">Shipping &amp; Delivery</Link></li>

                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Contact Us</h3>

                        <ul className="contact">
                            <li>
                                <FaEnvelope />  <a href="mailto:infomittyco@gmail.com">infomittyco@gmail.com</a>
                            </li>

                            <li>
                                <FaMapMarkerAlt /> 59/A, Panayanthatta, Thollathuvayal, Nhekly (P.O.), Peringome, Payyanur, Kannur, Kerala 670353
                            </li>
                        </ul>
                    </div>

                    <div className="footer-column payment">
                        <h3>Order Options</h3>

                        <div className="payment-options">
                            <span>COD</span>
                            <span>WhatsApp</span>
                        </div>
                    </div>

                </div>

            </footer>

            <div className="copyright">
                © 2026 Mittyco. Nature&apos;s goodness delivered.
            </div>

        </div>
    )
}

export default Footer

