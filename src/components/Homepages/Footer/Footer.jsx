import React from 'react';
import './Footer.css';
import { FaEnvelope, FaPhone, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter, FaTiktok } from "react-icons/fa6";

const Footer = () => {

    const navigateToContact = () => {
        const signInElement = document.getElementById('contact');
        if (signInElement) {
            const elementTop = signInElement.getBoundingClientRect().top + window.scrollY - 80; // Adjust for any fixed headers
            window.scrollTo({ top: elementTop, behavior: 'smooth' });
        }
    };

    return (
        <footer className="footer-container">
            <div className="footer-content">
                <p className="footer-text">
                    &copy; {new Date().getFullYear()} Atua. All rights reserved.
                </p>

                {/* Social Media */}
                <div className='social-media-row'>

                    {/* Email */}
                    <a
                        href="mailto:support@atuainc.com?subject=Atua%20Support%20Request&body=Hi%20Atua%20Support%2C%0A%0AI%20need%20assistance%20with%20the%20following%20issue%3A%0A%0A%5BPlease%20describe%20your%20issue%20here%5D%0A%0AThank%20you%20for%20your%20support.%0A%0ABest%20regards%2C%0A%5BYour%20Name%5D"
                    >
                        <FaEnvelope className="media-footer-icon" />
                    </a>

                    {/* WhatsApp */}
                    <a 
                        href="https://wa.me/2347042961902" 
                        // className="contact-item"
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        <FaWhatsapp className="media-footer-icon" />
                    </a>

                    {/* Instagram */}
                    {/* <a
                        href="https://www.instagram.com/opusamaapp/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <FaInstagram className="media-footer-icon" />
                    </a> */}
                    
                    {/* Twitter */}
                    {/* <a
                        href="https://x.com/opusamaapp"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <FaXTwitter className="media-footer-icon" />
                    </a> */}

                    {/* Tiktok*/}
                    {/* <a
                        href="https://www.tiktok.com/@opusamapp"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <FaTiktok className="media-footer-icon" />
                    </a> */}
                </div>

                {/* Policies */}
                <div className="footer-links">
                    <a 
                        href="https://sites.google.com/view/atua-terms-conditions/home"
                        className="footer-link"
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        Terms & Conditions
                    </a>

                    <a 
                        href="https://sites.google.com/view/atua-privacy-policy/home"
                        className="footer-link"
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        Privacy Policy
                    </a>

                    
                    <button className="footer-link"
                    onClick={navigateToContact}>
                        Contact Us
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;