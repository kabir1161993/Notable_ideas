import React, { useState } from 'react';
import StickyNote from './StickyNote';
import ExportModal from './ExportModal';
import { 
    Users, 
    FileText, 
    Vote, 
    Play, 
    ArrowRight, 
    Eye, 
    EyeOff, 
    RotateCcw, 
    PlusCircle, 
    Trophy, 
    CheckCircle2, 
    Clock, 
    Info,
    Download
} from 'lucide-react';

export default function HostDashboard({
    roomCode = '',
    round,
    participants,
    notes,
    votes,
    revealAuthors,
    onStartRound1,
    onEndRound1,
    onEndRound2,
    onToggleRevealAuthors,
    onRestartGame,
    onAddDemoParticipants,
    addToast,
}) {
    const [previewParticipantView, setPreviewParticipantView] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Compute live stats
    const totalParticipants = participants.filter(p => !p.isHost).length;
    const submittedNotesCount = Object.keys(notes).length;

    // Calculate voting metrics
    let totalVotesCast = 0;
    const noteStats = {};

    Object.keys(notes).forEach(authorId => {
        const noteId = notes[authorId].id || `note_${authorId}`;
        const noteVotes = votes[noteId] || {};
        let up = 0;
        let down = 0;

        Object.values(noteVotes).forEach(v => {
            if (v === 'up' || v === 1) up++;
            if (v === 'down' || v === -1) down++;
        });

        totalVotesCast += (up + down);
        noteStats[noteId] = {
            upvotes: up,
            downvotes: down,
            cumulativeScore: up - down,
        };
    });

    // Sort notes for Results phase
    const sortedNotes = Object.keys(notes).map(authorId => {
        const note = notes[authorId];
        const noteId = note.id || `note_${authorId}`;
        const stat = noteStats[noteId] || { upvotes: 0, downvotes: 0, cumulativeScore: 0 };
        const author = participants.find(p => p.id === authorId);

        return {
            ...note,
            id: noteId,
            authorName: author?.name || note.authorName || 'Anonymous',
            upvotes: stat.upvotes,
            downvotes: stat.downvotes,
            cumulativeScore: stat.cumulativeScore,
        };
    }).sort((a, b) => b.cumulativeScore - a.cumulativeScore || b.upvotes - a.upvotes);

    return (
        <div className="host-dashboard">
            {/* Command Bar Header */}
            <div className="host-control-banner">
                <div className="stats-row">
                    <div className="stat-card">
                        <Users size={20} className="stat-icon icon-blue" />
                        <div className="stat-info">
                            <span className="stat-num">{totalParticipants}</span>
                            <span className="stat-title">Participants</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <FileText size={20} className="stat-icon icon-yellow" />
                        <div className="stat-info">
                            <span className="stat-num">{submittedNotesCount}/{totalParticipants}</span>
                            <span className="stat-title">Notes Written</span>
                        </div>
                    </div>

                    {round === 'ROUND_2' && (
                        <div className="stat-card">
                            <Vote size={20} className="stat-icon icon-green" />
                            <div className="stat-info">
                                <span className="stat-num">{totalVotesCast}</span>
                                <span className="stat-title">Total Votes Cast</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Host Phase Controls */}
                <div className="host-actions">
                    {round === 'LOBBY' && (
                        <button 
                            className="btn btn-primary btn-lg pulse-glow"
                            onClick={onStartRound1}
                            disabled={totalParticipants === 0}
                        >
                            <Play size={18} />
                            Start Round 1: Create Notes
                        </button>
                    )}

                    {round === 'ROUND_1' && (
                        <button 
                            className="btn btn-primary btn-lg"
                            onClick={onEndRound1}
                            disabled={submittedNotesCount === 0}
                        >
                            <ArrowRight size={18} />
                            End Round 1 & Start Voting (Round 2)
                        </button>
                    )}

                    {round === 'ROUND_2' && (
                        <div className="btn-group">
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowExportModal(true)}
                                title="Export current voting board"
                            >
                                <Download size={16} />
                                Export
                            </button>

                            <button 
                                className="btn btn-outline"
                                onClick={() => setPreviewParticipantView(!previewParticipantView)}
                                title="Toggle what participants see (anonymous, hidden scores)"
                            >
                                {previewParticipantView ? <EyeOff size={16} /> : <Eye size={16} />}
                                {previewParticipantView ? 'Show Host View' : 'Preview Participant View'}
                            </button>

                            <button 
                                className="btn btn-primary btn-lg"
                                onClick={onEndRound2}
                            >
                                <Trophy size={18} />
                                End Round 2 & View Results
                            </button>
                        </div>
                    )}

                    {round === 'RESULTS' && (
                        <div className="btn-group">
                            <button 
                                className="btn btn-secondary btn-lg"
                                onClick={() => setShowExportModal(true)}
                                title="Export full board to Markdown, CSV, or JSON"
                            >
                                <Download size={18} />
                                Export Board
                            </button>

                            <button 
                                className={`btn ${revealAuthors ? 'btn-secondary' : 'btn-outline'}`}
                                onClick={onToggleRevealAuthors}
                            >
                                {revealAuthors ? <EyeOff size={16} /> : <Eye size={16} />}
                                {revealAuthors ? 'Hide Author Names' : 'Reveal Author Names'}
                            </button>

                            <button 
                                className="btn btn-primary"
                                onClick={onRestartGame}
                            >
                                <RotateCcw size={16} />
                                Start New Game
                            </button>
                        </div>
                    )}

                    {/* Quick Demo Helper */}
                    {round === 'LOBBY' && (
                        <button 
                            className="btn btn-ghost btn-sm"
                            onClick={onAddDemoParticipants}
                            title="Add 3 simulated participants with notes for quick testing"
                        >
                            <PlusCircle size={15} />
                            Add Demo Players
                        </button>
                    )}
                </div>
            </div>

            {/* PHASE 1: LOBBY */}
            {round === 'LOBBY' && (
                <div className="host-section lobby-roster-section">
                    <div className="section-title-bar">
                        <h2>Connected Participants ({totalParticipants})</h2>
                        <span className="section-subtitle">Players who join with your room code will appear here.</span>
                    </div>

                    {totalParticipants === 0 ? (
                        <div className="empty-state-box">
                            <Users size={48} className="empty-icon text-muted" />
                            <h3>Waiting for players to join...</h3>
                            <p>Share your room code or QR code with your team to begin!</p>
                            <button className="btn btn-secondary mt-3" onClick={onAddDemoParticipants}>
                                <PlusCircle size={16} />
                                Add 3 Demo Players (Instant Test)
                            </button>
                        </div>
                    ) : (
                        <div className="participant-roster-grid">
                            {participants.filter(p => !p.isHost).map(p => (
                                <div key={p.id} className="player-badge-card">
                                    <div className="player-avatar">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="player-details">
                                        <span className="player-name">{p.name}</span>
                                        <span className="player-status-text">
                                            <span className="online-indicator"></span> Ready in lobby
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PHASE 2: ROUND 1 — CREATE STICKY NOTES */}
            {round === 'ROUND_1' && (
                <div className="host-section round1-section">
                    <div className="section-title-bar">
                        <div>
                            <h2>Round 1: Live Sticky Note Submissions</h2>
                            <p className="section-subtitle">
                                You can see all participant notes and their authors in real-time as they draft them.
                            </p>
                        </div>
                        <div className="status-legend">
                            <span className="legend-item"><CheckCircle2 size={14} className="text-success" /> Submitted</span>
                            <span className="legend-item"><Clock size={14} className="text-warning" /> Still editing</span>
                        </div>
                    </div>

                    {totalParticipants === 0 ? (
                        <div className="empty-state-box">
                            <p>No participants in room.</p>
                        </div>
                    ) : (
                        <div className="sticky-notes-board">
                            {participants.filter(p => !p.isHost).map(p => {
                                const note = notes[p.id] || { title: '', content: '', color: 'yellow', rotation: 0 };
                                const isReady = Boolean(p.isReady || (note.title && note.content));

                                return (
                                    <div key={p.id} className="board-note-wrapper">
                                        <StickyNote
                                            note={note}
                                            mode="host-round1"
                                            authorName={p.name}
                                            isReady={isReady}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* PHASE 3: ROUND 2 — VOTING PHASE */}
            {round === 'ROUND_2' && (
                <div className="host-section round2-section">
                    <div className="section-title-bar">
                        <div>
                            <h2>Round 2: Live Voting Command Center</h2>
                            <p className="section-subtitle">
                                {previewParticipantView 
                                    ? '👀 Previewing Anonymous Participant View (Authors & Running Scores are hidden to players)' 
                                    : 'Cumulative Score = Total Upvotes − Total Downvotes. Only you (the Host) can see running scores!'}
                            </p>
                        </div>
                    </div>

                    <div className="sticky-notes-board">
                        {sortedNotes.map(note => {
                            return (
                                <div key={note.id} className="board-note-wrapper">
                                    <StickyNote
                                        note={note}
                                        mode={previewParticipantView ? 'voting' : 'host-round2'}
                                        authorName={previewParticipantView ? '' : note.authorName}
                                        upvotes={note.upvotes}
                                        downvotes={note.downvotes}
                                        cumulativeScore={note.cumulativeScore}
                                        isOwnNote={false}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* PHASE 4: FINAL RESULTS */}
            {round === 'RESULTS' && (
                <div className="host-section results-section">
                    <div className="results-hero">
                        <div className="trophy-halo">
                            <Trophy size={48} className="trophy-gold" />
                        </div>
                        <h2>Final Results & Standings</h2>
                        <p className="results-subtitle">
                            Cumulative Score = Total Upvotes − Total Downvotes.
                            {revealAuthors 
                                ? ' Authors have been revealed to all players.' 
                                : ' Anonymous mode is active (authors are hidden).'}
                        </p>
                    </div>

                    <div className="results-grid">
                        {sortedNotes.map((note, idx) => {
                            const rank = idx + 1;
                            return (
                                <div key={note.id} className={`results-item rank-${rank}`}>
                                    <StickyNote
                                        note={note}
                                        mode="results"
                                        authorName={note.authorName}
                                        upvotes={note.upvotes}
                                        downvotes={note.downvotes}
                                        cumulativeScore={note.cumulativeScore}
                                        rank={rank}
                                        revealAuthors={revealAuthors}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Export Board Modal */}
            {showExportModal && (
                <ExportModal
                    roomCode={roomCode}
                    sortedNotes={sortedNotes}
                    revealAuthors={revealAuthors}
                    onClose={() => setShowExportModal(false)}
                    addToast={addToast}
                />
            )}
        </div>
    );
}
