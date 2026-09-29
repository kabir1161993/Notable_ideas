import React, { useState, useEffect } from 'react';
import { 
    PlusCircle, 
    LogIn, 
    Crown, 
    User, 
    Sparkles, 
    HelpCircle, 
    ArrowRight,
    CheckCircle2
} from 'lucide-react';

export default function LobbyView({
    initialRoomCode = '',
    isLoading = false,
    errorMessage = '',
    onCreateRoom,
    onJoinRoom,
}) {
    const [mode, setMode] = useState(initialRoomCode ? 'join' : 'choose'); // 'choose' | 'host' | 'join'
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState(initialRoomCode);

    useEffect(() => {
        if (initialRoomCode) {
            setRoomCode(initialRoomCode.toUpperCase());
            setMode('join');
        }
    }, [initialRoomCode]);

    const handleHostSubmit = (e) => {
        e.preventDefault();
        onCreateRoom(name.trim() || 'Host');
    };

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (!roomCode.trim()) return;
        onJoinRoom(roomCode.trim().toUpperCase(), name.trim());
    };

    return (
        <div className="lobby-wrapper">
            <div className="lobby-hero">
                <div className="hero-decorations">
                    <div className="hero-note hero-note-1">💡 Pitch Great Ideas</div>
                    <div className="hero-note hero-note-2">🗳️ Anonymous Votes</div>
                    <div className="hero-note hero-note-3">🏆 Crown the Best</div>
                </div>

                <div className="hero-badge">
                    <Sparkles size={14} /> Peer-to-Peer Game
                </div>
                <h1 className="hero-headline">StickyVote</h1>
                <p className="hero-subtext">
                    Brainstorm, pitch on sticky notes, and anonymously vote in real time. Hosted peer-to-peer directly in your browser.
                </p>
            </div>

            <div className="lobby-card">
                {errorMessage && (
                    <div className="error-banner fade-in">
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Mode Selector */}
                {mode === 'choose' && (
                    <div className="mode-options-grid fade-in">
                        <div 
                            className="mode-card card-host"
                            onClick={() => setMode('host')}
                        >
                            <div className="mode-card-icon host-icon-bg">
                                <Crown size={28} />
                            </div>
                            <h3>Create Room as Host</h3>
                            <p>Control the rounds, monitor real-time submissions, and view cumulative vote counts.</p>
                            <button className="btn btn-primary w-full mt-3">
                                <PlusCircle size={18} />
                                Create Room
                            </button>
                        </div>

                        <div 
                            className="mode-card card-join"
                            onClick={() => setMode('join')}
                        >
                            <div className="mode-card-icon join-icon-bg">
                                <LogIn size={28} />
                            </div>
                            <h3>Join as Participant</h3>
                            <p>Submit your single sticky note and vote anonymously on your peers' ideas.</p>
                            <button className="btn btn-secondary w-full mt-3">
                                <LogIn size={18} />
                                Join Room
                            </button>
                        </div>
                    </div>
                )}

                {/* Host Setup Form */}
                {mode === 'host' && (
                    <form className="lobby-form fade-in" onSubmit={handleHostSubmit}>
                        <div className="form-header">
                            <button 
                                type="button" 
                                className="back-link" 
                                onClick={() => setMode('choose')}
                                disabled={isLoading}
                            >
                                ← Back
                            </button>
                            <h2>Create Game Room</h2>
                        </div>

                        <div className="form-group">
                            <label htmlFor="host-name">Your Name (Host)</label>
                            <div className="input-with-icon">
                                <Crown size={18} className="input-icon" />
                                <input
                                    id="host-name"
                                    type="text"
                                    placeholder="e.g. Alex"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                    maxLength={25}
                                    autoFocus
                                />
                            </div>
                            <span className="input-hint">You will control the game flow and see the host dashboard.</span>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary btn-lg w-full mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Setting up room...
                                </>
                            ) : (
                                <>
                                    <Crown size={18} />
                                    Launch Host Dashboard
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Participant Join Form */}
                {mode === 'join' && (
                    <form className="lobby-form fade-in" onSubmit={handleJoinSubmit}>
                        <div className="form-header">
                            <button 
                                type="button" 
                                className="back-link" 
                                onClick={() => setMode('choose')}
                                disabled={isLoading}
                            >
                                ← Back
                            </button>
                            <h2>Join Room</h2>
                        </div>

                        <div className="form-group">
                            <label htmlFor="participant-name">Your Name <span className="text-danger">*</span></label>
                            <div className="input-with-icon">
                                <User size={18} className="input-icon" />
                                <input
                                    id="participant-name"
                                    type="text"
                                    placeholder="e.g. Jordan"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                    maxLength={25}
                                    required
                                    autoFocus
                                />
                            </div>
                            <span className="input-hint">Required to participate in the game.</span>
                        </div>

                        <div className="form-group mt-3">
                            <label htmlFor="room-code">Room Code <span className="text-danger">*</span></label>
                            <input
                                id="room-code"
                                type="text"
                                className="room-code-input"
                                placeholder="e.g. 7X4K92"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                disabled={isLoading}
                                maxLength={8}
                                required
                            />
                            <span className="input-hint">Ask the Host for their 6-character room code.</span>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-secondary btn-lg w-full mt-4"
                            disabled={isLoading || !name.trim() || !roomCode.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Connecting to Host...
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Enter Room
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* Quick Game Rules Recap */}
            <div className="rules-recap-grid">
                <div className="rule-card">
                    <span className="rule-step">Step 1</span>
                    <h4>1 Note Per Person</h4>
                    <p>Write your best idea with a clear title and details during Round 1.</p>
                </div>
                <div className="rule-card">
                    <span className="rule-step">Step 2</span>
                    <h4>Anonymous Voting</h4>
                    <p>In Round 2, authors are hidden. Upvote or Downvote your peers' ideas.</p>
                </div>
                <div className="rule-card">
                    <span className="rule-step">Step 3</span>
                    <h4>Cumulative Score</h4>
                    <p>Score = Upvotes − Downvotes. Host views live tally, final scores revealed at the end!</p>
                </div>
            </div>
        </div>
    );
}
