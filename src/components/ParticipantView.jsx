import React from 'react';
import StickyNote from './StickyNote';
import { 
    Clock, 
    Sparkles, 
    CheckCircle2, 
    Vote, 
    Trophy, 
    Lock, 
    FileEdit,
    AlertCircle
} from 'lucide-react';

export default function ParticipantView({
    round,
    myNote,
    allNotes = [],
    myNoteId,
    myVotes = {}, // { [noteId]: 'up' | 'down' }
    revealAuthors = false,
    finalResults = [],
    onUpdateNote,
    onCastVote,
}) {
    // Check if user's note is drafted
    const hasDraft = Boolean(myNote?.title?.trim());

    return (
        <div className="participant-view">
            {/* LOBBY PHASE */}
            {round === 'LOBBY' && (
                <div className="participant-lobby-box">
                    <div className="lobby-pulse-card">
                        <div className="lobby-icon-bubble">
                            <Clock size={36} className="text-primary animate-pulse" />
                        </div>
                        <h2>You're In the Room!</h2>
                        <p className="lobby-msg">
                            Waiting for the Host to start <strong>Round 1: Idea Creation</strong>.
                        </p>
                        <div className="lobby-tip-box">
                            <Sparkles size={18} className="tip-icon" />
                            <div>
                                <strong>What happens next?</strong>
                                <p>You'll create one sticky note with a title and key bullet points. Think of your best pitch!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ROUND 1: CREATE STICKY NOTE */}
            {round === 'ROUND_1' && (
                <div className="participant-round1-container">
                    <div className="phase-banner round1-banner">
                        <div className="banner-left">
                            <div className="banner-badge">Round 1</div>
                            <h2>Create Your Sticky Note</h2>
                            <p>
                                Write your one idea with a clear title and bullet points. You can edit it freely until the Host starts voting.
                            </p>
                        </div>
                        <div className="banner-status">
                            {hasDraft ? (
                                <span className="status-badge-saved">
                                    <CheckCircle2 size={16} /> Auto-Saved
                                </span>
                            ) : (
                                <span className="status-badge-editing">
                                    <FileEdit size={16} /> Drafting Idea
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="editor-layout">
                        <div className="editor-card-wrapper">
                            <StickyNote
                                note={myNote}
                                mode="edit"
                                onChange={onUpdateNote}
                            />
                        </div>

                        <div className="editor-helper-panel">
                            <h3>Tips for a Great Note</h3>
                            <ul className="helper-list">
                                <li>
                                    <strong>One sticky note rule:</strong> You have exactly one note. Make every word count!
                                </li>
                                <li>
                                    <strong>Title:</strong> Keep it short, memorable, and clear (max 60 chars).
                                </li>
                                <li>
                                    <strong>Points & Details:</strong> Add 2–3 concise points or benefits.
                                </li>
                                <li>
                                    <strong>Anonymity:</strong> Your name will be hidden from everyone else during voting!
                                </li>
                            </ul>

                            <div className="privacy-reassurance">
                                <Lock size={15} />
                                <span>Voting will be 100% anonymous to all participants.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ROUND 2: ANONYMOUS VOTING */}
            {round === 'ROUND_2' && (
                <div className="participant-round2-container">
                    <div className="phase-banner round2-banner">
                        <div className="banner-left">
                            <div className="banner-badge">Round 2</div>
                            <h2>Vote on Sticky Notes</h2>
                            <p>
                                Cast your <strong>Upvote</strong> or <strong>Downvote</strong> for other ideas. Tap again to cancel your vote.
                            </p>
                        </div>
                        <div className="voting-legend-box">
                            <span className="legend-tag">
                                <Lock size={13} /> Scores hidden until round ends
                            </span>
                        </div>
                    </div>

                    {allNotes.length === 0 ? (
                        <div className="empty-state-box">
                            <p>No sticky notes received yet. Please wait for the host...</p>
                        </div>
                    ) : (
                        <div className="sticky-notes-board voting-board">
                            {allNotes.map(note => {
                                const isOwn = (note.id === myNoteId || note.isOwnNote);
                                const userVote = myVotes[note.id] || null;

                                return (
                                    <div key={note.id} className="board-note-wrapper">
                                        <StickyNote
                                            note={note}
                                            mode="voting"
                                            isOwnNote={isOwn}
                                            currentVote={userVote}
                                            onVote={onCastVote}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* RESULTS PHASE */}
            {round === 'RESULTS' && (
                <div className="participant-results-container">
                    <div className="results-hero">
                        <div className="trophy-halo">
                            <Trophy size={48} className="trophy-gold" />
                        </div>
                        <h2>Voting Results & Winners</h2>
                        <p className="results-subtitle">
                            Here are the final standings based on cumulative scores (Upvotes − Downvotes).
                        </p>
                    </div>

                    <div className="results-grid">
                        {finalResults.map((note, idx) => {
                            const rank = idx + 1;
                            const isOwn = (note.id === myNoteId || note.isOwnNote);

                            return (
                                <div key={note.id} className={`results-item rank-${rank}`}>
                                    <StickyNote
                                        note={note}
                                        mode="results"
                                        authorName={revealAuthors ? note.authorName : 'Anonymous'}
                                        upvotes={note.upvotes || 0}
                                        downvotes={note.downvotes || 0}
                                        cumulativeScore={note.cumulativeScore || 0}
                                        rank={rank}
                                        revealAuthors={revealAuthors}
                                        isOwnNote={isOwn}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
