import React from 'react';

const Contact = () => {
    const contactLinks = [
        { icon: "📧", label: "rahilubare7@gmail.com", href: "mailto:rahilubare7@gmail.com" },
        { icon: "📱", label: "+91 7588315321", href: "tel:+917588315321" },
        { icon: "📍", label: "Navi Mumbai, Maharashtra, India" },
        { icon: "💻", label: "github.com/rahilubare", href: "https://github.com/rahilubare" }
    ];

    return (
        <section className="content-section" id="section-6">
            <div className="section-number">06</div>
            <h2 className="section-title">CONTACT</h2>
            <div className="contact-info">
                {contactLinks.map((item, i) => (
                    <div key={i} className="contact-item">
                        <span className="contact-icon">{item.icon}</span>
                        {item.href ? (
                            <a href={item.href} className="contact-link" target="_blank" rel="noopener noreferrer">
                                {item.label}
                            </a>
                        ) : (
                            <span className="contact-link">{item.label}</span>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Contact;
