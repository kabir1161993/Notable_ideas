import React, { useState } from 'react';
import { 
    Copy, 
    Check, 
    QrCode, 
    Volume2, 
    VolumeX, 
    LogOut, 
    Crown, 
    User, 
    Sparkles 
} from 'lucide-react';
import { toggleSound, isSoundEnabled } from '../services/soundEffects';

export default function Header({ 
    roomCode, 
    round, 
    isHost, 
    userName, 
    onOpenQr, 
    onLeave,
    addToast 
}) {
    const [copied, setCopied] = useState(false);
    const [soundOn, setSoundOn] = useState(isSoundEnabled());

    const handleCopy = () => {
        const url = window.location.origin + window.location.pathname + '?room=' + roomCode;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            addToast('Invite link copied to clipboard!', 'success');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleToggleSound = () => {
        const newState = toggleSound();
        setSoundOn(newState);
        addToast(newState ? 'Sound effects turned on' : 'Sound effects muted', 'info');
    };

    const getRoundBadge = () => {
        switch (round) {
            case 'LOBBY':
                return { label: 'Lobby', desc: 'Waiting for players', color: 'badge-lobby' };
            case 'ROUND_1':
                return { label: 'Round 1', desc: 'Creating Sticky Notes', color: 'badge-round1' };
            case 'ROUND_2':
                return { label: 'Round 2', desc: 'Voting Active', color: 'badge-round2' };
            case 'RESULTS':
                return { label: 'Results', desc: 'Final Standings', color: 'badge-results' };
            default:
                return { label: 'Active', desc: '', color: 'badge-lobby' };
        }
    };

    const roundInfo = getRoundBadge();

    return (
        <header className="app-header">
            <div className="header-left">
                <div className="brand">
                    <div className="brand-icon">
                        <span className="sticky-dot"></span>
                        <Sparkles size={18} className="sparkle-icon" />
                    </div>
                    <div className="brand-text">
                        <h1 className="brand-title">StickyVote</h1>
                        <span className="brand-tagline">Real-Time Pitch & Vote</span>
                    </div>
                </div>

                {roomCode && (
                    <div className="room-badge-group">
                        <div className="room-code-pill" title="Click to copy invite link" onClick={handleCopy}>
                            <span className="room-label">ROOM</span>
                            <strong className="room-value">{roomCode}</strong>
                            {copied ? <Check size={14} className="copy-check" /> : <Copy size={14} className="copy-icon" />}
                        </div>

                        {onOpenQr && (
                            <button 
                                className="icon-btn" 
                                onClick={onOpenQr} 
                                title="Show QR Code for mobile joining"
                                aria-label="Show QR Code"
                            >
                                <QrCode size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="header-center">
                <div className={`round-indicator ${roundInfo.color}`}>
                    <span className="pulse-dot"></span>
                    <span className="round-name">{roundInfo.label}</span>
                    <span className="round-separator">•</span>
                    <span className="round-desc">{roundInfo.desc}</span>
                </div>
            </div>

            <div className="header-right">
                <button 
                    className="icon-btn" 
                    onClick={handleToggleSound} 
                    title={soundOn ? 'Mute sounds' : 'Enable sounds'}
                    aria-label={soundOn ? 'Mute sounds' : 'Enable sounds'}
                >
                    {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>

                <div className={`user-pill ${isHost ? 'host-pill' : ''}`}>
                    {isHost ? (
                        <>
                            <Crown size={15} className="host-icon" />
                            <span>Host</span>
                        </>
                    ) : (
                        <>
                            <User size={15} />
                            <span className="user-name-text">{userName || 'Player'}</span>
                        </>
                    )}
                </div>

                {onLeave && (
                    <button 
                        className="leave-btn" 
                        onClick={onLeave} 
                        title="Leave game"
                        aria-label="Leave game"
                    >
                        <LogOut size={16} />
                        <span className="leave-text">Exit</span>
                    </button>
                )}
            </div>
        </header>
    );
}
