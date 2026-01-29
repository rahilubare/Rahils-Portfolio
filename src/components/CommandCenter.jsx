import React, { useState, useEffect } from 'react';

const CommandCenter = ({ setTheme }) => {
    const [active, setActive] = useState(false);
    const [input, setInput] = useState('');

    const commands = [
        { name: '/about', action: () => document.getElementById('section-1')?.scrollIntoView({ behavior: 'smooth' }) },
        { name: '/skills', action: () => document.getElementById('section-2')?.scrollIntoView({ behavior: 'smooth' }) },
        { name: '/projects', action: () => document.getElementById('section-5')?.scrollIntoView({ behavior: 'smooth' }) },
        { name: '/contact', action: () => document.getElementById('section-6')?.scrollIntoView({ behavior: 'smooth' }) },
        { name: '/cyberpunk', action: () => setTheme('cyberpunk') },
        { name: '/matrix', action: () => setTheme('matrix') },
        { name: '/minimalist', action: () => setTheme('minimalist') },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setActive(true);
            }
            if (e.key === 'Escape') setActive(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleExecute = (e) => {
        if (e.key === 'Enter') {
            const cmd = commands.find(c => c.name === input.trim().toLowerCase());
            if (cmd) {
                cmd.action();
                setActive(false);
                setInput('');
            } else if (input.startsWith('/')) {
                alert('Unknown command: ' + input);
            }
        }
    };

    if (!active) return null;

    return (
        <div id="command-center" className="active">
            <div className="cc-inner">
                <div className="cc-header">
                    <span className="cc-title">COMMAND_CENTER</span>
                    <span className="cc-hint">ESC to close</span>
                </div>
                <input
                    type="text"
                    id="cc-input"
                    placeholder="Type a command (try /matrix or /minimalist)..."
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleExecute}
                />
                <div id="cc-results">
                    {input === '' && (
                        <div className="cc-suggestions">
                            <span className="suggestion-label">SUGGESTED THEMES:</span>
                            <div className="suggestion-chips">
                                {['/matrix', '/minimalist', '/cyberpunk'].map(cmd => (
                                    <span
                                        key={cmd}
                                        className="cc-chip"
                                        onClick={() => {
                                            const command = commands.find(c => c.name === cmd);
                                            if (command) {
                                                command.action();
                                                setActive(false);
                                            }
                                        }}
                                    >
                                        {cmd}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandCenter;
