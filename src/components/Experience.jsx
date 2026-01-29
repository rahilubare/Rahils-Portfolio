import React from 'react';

const Experience = () => {
    return (
        <section className="content-section" id="section-3">
            <div className="section-number">03</div>
            <h2 className="section-title reveal-text">EXPERIENCE</h2>

            <div className="timeline-container">
                <div className="timeline-line"></div>

                <div className="timeline-node reveal-item">
                    <div className="node-dot"></div>
                    <div className="node-content" data-cursor="INFO">
                        <h3>Enix Softwares</h3>
                        <span className="node-date">Nov 2024 – Present</span>
                        <p>IT Engineer | Mumbai, India</p>
                        <ul className="node-list">
                            <li>Optimized SQL ERP databases for performance and integrity.</li>
                            <li>Built **File Resizer Pro** with React and AI-assisted (agentic) development.</li>
                            <li>Automated SQL reporting workflows, boosting efficiency by **33%**.</li>
                            <li>Scaled productivity via custom automation scripts and workflows.</li>
                            <li>Deployed **Grafana/Prometheus** dashboards for real-time observability.</li>
                            <li>Led R&D in AI-driven automation, gaining **15%** overall efficiency.</li>
                            <li>Implemented secure data encryption and compliance standards.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Experience;
