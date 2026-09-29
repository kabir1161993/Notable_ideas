import React from 'react';
import { 
    ThumbsUp, 
    ThumbsDown, 
    User, 
    Trophy, 
    CheckCircle2, 
    Clock, 
    Lock,
    Sparkles 
} from 'lucide-react';
import { playVote } from '../services/soundEffects';

export const NOTE_COLORS = [
    { id: 'yellow', bg: '#fef9c3', border: '#fef08a', text: '#713f12', tape: 'rgba(254, 240, 138, 0.7)', label: 'Sunbeam' },
    { id: 'pink',   bg: '#ffe4e6', border: '#fecdd3', text: '#881337', tape: 'rgba(254, 205, 211, 0.7)', label: 'Coral' },
    { id: 'blue',   bg: '#e0f2fe', border: '#bae6fd', text: '#0c4a6e', tape: 'rgba(186, 230, 253, 0.7)', label: 'Sky' },
    { id: 'green',  bg: '#dcfce7', border: '#bbf7d0', text: '#14532d', tape: 'rgba(187, 247, 208, 0.7)', label: 'Mint' },
    { id: 'purple', bg: '#f3e8ff', border: '#e9d5ff', text: '#581c87', tape: 'rgba(233, 213, 255, 0.7)', label: 'Lilac' },
    { id: 'orange', bg: '#ffedd5', border: '#fed7aa', text: '#7c2d12', tape: 'rgba(254, 215, 170, 0.7)', label: 'Peach' },
];

export function getColorDef(colorId) {
    return NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0];
}

export default function StickyNote({
    note,
    mode = 'display', // 'edit' | 'host-round1' | 'voting' | 'host-round2' | 'results'
    authorName = '',
    isOwnNote = false,
    currentVote = null, // 'up' | 'down' | null
    upvotes = 0,
    downvotes = 0,
    cumulativeScore = 0,
    rank = null,
    revealAuthors = false,
    onChange = null,
    onVote = null,
    isReady = false,
}) {
    const colorDef = getColorDef(note?.color || 'yellow');
    const rotation = note?.rotation || 0;

    const handleVoteClick = (voteType) => {
        if (!onVote || isOwnNote) return;
        // Toggle vote off if clicked again
        const nextVote = currentVote === voteType ? null : voteType;
        if (nextVote) {
            playVote(nextVote === 'up');
        }
        onVote(note.id, nextVote);
    };

    return (
        <div 
            className={`sticky-note-card ${mode} ${isOwnNote ? 'is-own-note' : ''}`}
            style={{
                backgroundColor: colorDef.bg,
                borderColor: colorDef.border,
                color: colorDef.text,
                transform: `rotate(${rotation}deg)`,
            }}
        >
            {/* Washi Tape Graphic */}
            <div 
                className="washi-tape" 
                style={{ backgroundColor: colorDef.tape }}
            />

            {/* Rank Badge for Results */}
            {mode === 'results' && rank && (
                <div className={`rank-badge rank-${rank}`}>
                    {rank === 1 ? '🥇 1st Place' : rank === 2 ? '🥈 2nd Place' : rank === 3 ? '🥉 3rd Place' : `#${rank}`}
                </div>
            )}

            {/* Header: Author info or anonymity badge */}
            <div className="note-card-header">
                {/* When Host views in Round 1 or Round 2, show author */}
                {(mode === 'host-round1' || mode === 'host-round2' || (mode === 'results' && revealAuthors)) && (
                    <div className="author-tag" title="Sticky note creator">
                        <User size={13} />
                        <span className="author-name">{authorName || note?.authorName || 'Unknown'}</span>
                    </div>
                )}

                {/* In voting mode, if it's the player's own note */}
                {mode === 'voting' && isOwnNote && (
                    <div className="own-note-badge" title="This is your submission">
                        <Lock size={12} />
                        <span>Your Note</span>
                    </div>
                )}

                {/* In voting mode for other notes, show anonymous badge */}
                {mode === 'voting' && !isOwnNote && (
                    <div className="anonymous-badge" title="Author hidden during voting">
                        <Sparkles size={12} />
                        <span>Anonymous Idea</span>
                    </div>
                )}

                {/* Results mode when author is kept anonymous */}
                {mode === 'results' && !revealAuthors && (
                    <div className="anonymous-badge">
                        <span>Anonymous</span>
                    </div>
                )}

                {/* Round 1 status indicator on host dashboard */}
                {mode === 'host-round1' && (
                    <div className={`status-pill ${isReady ? 'status-ready' : 'status-editing'}`}>
                        {isReady ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        <span>{isReady ? 'Ready' : 'Editing'}</span>
                    </div>
                )}
            </div>

            {/* Card Body: Edit Mode vs Display Mode */}
            {mode === 'edit' ? (
                <div className="note-edit-body">
                    <div className="input-field-group">
                        <label className="note-field-label">Idea Title</label>
                        <input
                            type="text"
                            className="note-title-input"
                            placeholder="Give your idea a punchy title..."
                            value={note.title || ''}
                            maxLength={120}
                            onChange={(e) => onChange && onChange({ ...note, title: e.target.value })}
                        />
                        <span className="char-count">{(note.title || '').length}/120</span>
                    </div>

                    <div className="input-field-group">
                        <label className="note-field-label">Points & Details (Up to 2,000 characters)</label>
                        <textarea
                            className="note-content-input"
                            placeholder="• Detail 1: Why this is great&#10;• Detail 2: How it works&#10;• Detail 3: Impact / Benefits&#10;• Write as much detail as you need..."
                            rows={7}
                            maxLength={2000}
                            value={note.content || ''}
                            onChange={(e) => onChange && onChange({ ...note, content: e.target.value })}
                        />
                        <span className="char-count">{(note.content || '').length}/2000</span>
                    </div>

                    {/* Color Swatches */}
                    <div className="color-swatches-row">
                        <span className="swatches-label">Note Color:</span>
                        <div className="swatches">
                            {NOTE_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`swatch-btn ${note.color === c.id ? 'active' : ''}`}
                                    style={{ backgroundColor: c.bg, borderColor: c.border }}
                                    title={c.label}
                                    onClick={() => onChange && onChange({ ...note, color: c.id })}
                                    aria-label={`Select ${c.label} color`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="note-display-body">
                    <h3 className="note-display-title">
                        {note.title || <span className="empty-placeholder">Untitled Idea</span>}
                    </h3>

                    <div className="note-display-content">
                        {note.content ? (
                            note.content.split('\n').map((line, idx) => (
                                <p key={idx} className="note-line">
                                    {line || '\u00A0'}
                                </p>
                            ))
                        ) : (
                            <span className="empty-placeholder">No points provided yet.</span>
                        )}
                    </div>
                </div>
            )}

            {/* Voting Controls for Participants in Round 2 */}
            {mode === 'voting' && (
                <div className="voting-action-footer">
                    {isOwnNote ? (
                        <div className="voting-disabled-notice">
                            <span>You cannot vote on your own sticky note</span>
                        </div>
                    ) : (
                        <div className="voting-buttons-group">
                            <button
                                type="button"
                                className={`vote-btn vote-up ${currentVote === 'up' ? 'active' : ''}`}
                                onClick={() => handleVoteClick('up')}
                                aria-label="Upvote this idea"
                                title="Upvote (+1 point)"
                            >
                                <ThumbsUp size={16} />
                                <span>Upvote</span>
                            </button>

                            <button
                                type="button"
                                className={`vote-btn vote-down ${currentVote === 'down' ? 'active' : ''}`}
                                onClick={() => handleVoteClick('down')}
                                aria-label="Downvote this idea"
                                title="Downvote (-1 point)"
                            >
                                <ThumbsDown size={16} />
                                <span>Downvote</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Host Dashboard Round 2 Live Score Tracker */}
            {mode === 'host-round2' && (
                <div className="host-score-tally">
                    <div className="score-stat-pills">
                        <span className="stat-pill upvote-pill" title="Total Upvotes">
                            <ThumbsUp size={13} />
                            +{upvotes}
                        </span>
                        <span className="stat-pill downvote-pill" title="Total Downvotes">
                            <ThumbsDown size={13} />
                            -{downvotes}
                        </span>
                        <span className={`stat-pill cumulative-pill ${cumulativeScore > 0 ? 'score-pos' : cumulativeScore < 0 ? 'score-neg' : 'score-zero'}`} title="Cumulative Score (Upvotes - Downvotes)">
                            Score: <strong>{cumulativeScore > 0 ? `+${cumulativeScore}` : cumulativeScore}</strong>
                        </span>
                    </div>

                    {/* Visual Vote Balance Bar */}
                    <div className="vote-balance-bar">
                        <div 
                            className="balance-segment up-segment" 
                            style={{ width: `${(upvotes + downvotes) > 0 ? (upvotes / (upvotes + downvotes)) * 100 : 50}%` }}
                        />
                        <div 
                            className="balance-segment down-segment" 
                            style={{ width: `${(upvotes + downvotes) > 0 ? (downvotes / (upvotes + downvotes)) * 100 : 50}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Results Standings Footer for Host & Participants */}
            {mode === 'results' && (
                <div className="results-score-footer">
                    <div className="final-score-callout">
                        <span className="score-label">Cumulative Score</span>
                        <span className={`final-score-val ${cumulativeScore > 0 ? 'score-pos' : cumulativeScore < 0 ? 'score-neg' : 'score-zero'}`}>
                            {cumulativeScore > 0 ? `+${cumulativeScore}` : cumulativeScore}
                        </span>
                    </div>

                    <div className="results-breakdown">
                        <span className="breakdown-item up-text" title="Upvotes">
                            <ThumbsUp size={12} /> +{upvotes}
                        </span>
                        <span className="breakdown-item down-text" title="Downvotes">
                            <ThumbsDown size={12} /> -{downvotes}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
