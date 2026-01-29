import React from 'react';

const ProjectModal = ({ project, onClose }) => {
    if (!project) return null;

    return (
        <div className="modal-overlay active" id="projectModal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <h2 className="modal-title">{project.title}</h2>
                <p className="modal-desc">{project.desc}</p>
                <div className="modal-tags">
                    {project.tag && <span className="modal-tag">{project.tag}</span>}
                </div>
                <div className="modal-details">
                    <p>Additional details for {project.title} would go here, potentially with images or tech stack badges.</p>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;
