import React from 'react';

const GameUI = ({ score, isActive, onExit }) => {
    if (!isActive) return null;

    return (
        <div id="game-ui" className="active">
            <div className="game-stats">
                <span className="game-label">GLITCH_HUNTER</span>
                <span className="game-score">SCORE: {score}</span>
            </div>
            <div className="game-hints">
                <p>Find and click the green system glitches.</p>
                <button className="game-exit" onClick={onExit}>EXIT GAME</button>
            </div>
        </div>
    );
};

export default GameUI;
