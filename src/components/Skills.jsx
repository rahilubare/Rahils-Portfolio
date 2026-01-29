import React from 'react';

const Skills = () => {
    const skillGroups = [
        { title: "Automation & AI", items: ["n8n", "Zapier", "AI-Assisted Development", "Agentic Workflows"] },
        { title: "Cloud & Infrastructure", items: ["AWS", "Docker", "Kubernetes", "Linux (Ubuntu/RHEL)"] },
        { title: "Databases", items: ["SQL Server", "MySQL", "Microsoft SSMS"] },
        { title: "Programming & Scripts", items: ["Python", "Bash", "GitHub"] },
        { title: "Security & Networking", items: ["XTS-AES Encryption", "IT Auditing", "Endpoint Hardening", "DNS Configuration"] },
        { title: "Observability", items: ["Grafana", "Prometheus", "Service Monitoring"] }
    ];

    return (
        <section className="content-section" id="section-2">
            <div className="section-number">02</div>
            <h2 className="section-title reveal-text">SKILLSET</h2>
            <div className="skills-container">
                {skillGroups.map((group, i) => (
                    <div key={i} className="skill-group reveal-item">
                        <h3 className="group-title">{group.title}</h3>
                        <div className="skills-grid">
                            {group.items.map((skill, j) => (
                                <div key={j} className="skill-item" data-cursor="SKILL">{skill}</div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Skills;
