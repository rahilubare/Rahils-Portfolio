import React from 'react';

const Projects = ({ onProjectSelect }) => {
    const projects = [
        {
            id: "devpal",
            type: "large",
            tag: "FEATURED",
            title: "DevPal",
            desc: "AI Chat Assistant powered by LLaMA2. Full-stack with FastAPI & React.",
            action: "EXPLORE"
        },
        {
            id: "inventory",
            type: "mid",
            tag: "TOOL",
            title: "Inventory System",
            desc: "Real-time stock monitoring & alerts."
        },
        {
            id: "habit",
            type: "small",
            title: "Habit Tracker",
            desc: "UX/UI Design"
        },
        {
            id: "ubuntu",
            type: "small",
            tag: "OS",
            title: "Ubuntu",
            desc: "Linux Specialist",
            accent: true
        }
    ];

    return (
        <section className="content-section" id="section-5">
            <div className="section-number">05</div>
            <h2 className="section-title reveal-text">PROJECTS</h2>

            <div className="bento-grid">
                {projects.map((project, i) => (
                    <div
                        key={i}
                        className={`bento-card card-${project.type} project-card reveal-item`}
                        data-id={project.id}
                        data-cursor="VIEW"
                        onClick={() => onProjectSelect(project)}
                    >
                        <div className={`card-bg ${project.accent ? 'accent' : ''}`}></div>
                        <div className="card-content">
                            {project.tag && <span className="card-tag">{project.tag}</span>}
                            <h3>{project.title}</h3>
                            <p>{project.desc}</p>
                            {project.action && <button className="view-btn">{project.action}</button>}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Projects;
