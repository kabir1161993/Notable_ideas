import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import LobbyView from './components/LobbyView';
import HostDashboard from './components/HostDashboard';
import ParticipantView from './components/ParticipantView';
import QRCodeModal from './components/QRCodeModal';
import Toast from './components/Toast';
import { 
    createPeer, 
    connectToHost, 
    sendJson, 
    generateRoomCode, 
    getHostPeerId, 
    getParticipantPeerId 
} from './services/peerConnection';
import { playPop, playChime, playFanfare } from './services/soundEffects';

const SESSION_STORAGE_KEY = 'stickyvote_session_v1';

export default function App() {
    // Top-level routing state
    const [view, setView] = useState('lobby'); // 'lobby' | 'host' | 'participant'
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [toasts, setToasts] = useState([]);
    const [showQrModal, setShowQrModal] = useState(false);

    // Common Room State
    const [roomCode, setRoomCode] = useState('');
    const [round, setRound] = useState('LOBBY'); // 'LOBBY' | 'ROUND_1' | 'ROUND_2' | 'RESULTS'
    const [userName, setUserName] = useState('');

    // Host-specific State
    const [participants, setParticipants] = useState([]);
    const [notes, setNotes] = useState({}); // { [participantId]: { id, title, content, color, rotation, authorName } }
    const [votes, setVotes] = useState({}); // { [noteId]: { [voterParticipantId]: 'up' | 'down' } }
    const [revealAuthors, setRevealAuthors] = useState(false);

    // Participant-specific State
    const [myParticipantId, setMyParticipantId] = useState('');
    const [myNote, setMyNote] = useState({
        title: '',
        content: '',
        color: 'yellow',
        rotation: (Math.random() * 4 - 2).toFixed(1),
    });
    const [allNotes, setAllNotes] = useState([]); // Sanitized notes in Round 2
    const [myVotes, setMyVotes] = useState({}); // { [noteId]: 'up' | 'down' }
    const [finalResults, setFinalResults] = useState([]);

    // WebRTC connection refs
    const peerRef = useRef(null);
    const hostConnectionsRef = useRef(new Map()); // Map<participantId, connection>
    const participantConnRef = useRef(null); // DataConnection to host
    const heartbeatTimerRef = useRef(null);

    // Toast helper
    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Check URL parameters for room code invite link on first load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoom = urlParams.get('room');
        if (urlRoom) {
            setRoomCode(urlRoom.toUpperCase().trim());
        }
    }, []);

    // ─── Broadcast Helper for Host ────────────────────────
    const broadcastToParticipants = useCallback((message) => {
        hostConnectionsRef.current.forEach((conn) => {
            if (conn && conn.open) {
                sendJson(conn, message);
            }
        });
    }, []);

    // Broadcast customized Round 2 payload (strict anonymity per recipient)
    const broadcastRound2Start = useCallback((currentNotes) => {
        hostConnectionsRef.current.forEach((conn, participantId) => {
            if (!conn || !conn.open) return;

            // Scrub author info for every note
            const sanitized = Object.keys(currentNotes).map(authorId => {
                const n = currentNotes[authorId];
                return {
                    id: n.id || `note_${authorId}`,
                    title: n.title,
                    content: n.content,
                    color: n.color,
                    rotation: n.rotation,
                    // True ONLY for the note authored by this specific participant
                    isOwnNote: authorId === participantId,
                };
            });

            sendJson(conn, {
                type: 'ROUND_2_STARTED',
                notes: sanitized,
                myNoteId: `note_${participantId}`,
            });
        });
    }, []);

    // Broadcast Results payload to all participants
    const broadcastResults = useCallback((currentNotes, currentVotes, isRevealed) => {
        // Calculate cumulative scores
        const results = Object.keys(currentNotes).map(authorId => {
            const n = currentNotes[authorId];
            const noteId = n.id || `note_${authorId}`;
            const noteVotes = currentVotes[noteId] || {};

            let up = 0;
            let down = 0;
            Object.values(noteVotes).forEach(v => {
                if (v === 'up' || v === 1) up++;
                if (v === 'down' || v === -1) down++;
            });

            return {
                id: noteId,
                title: n.title,
                content: n.content,
                color: n.color,
                rotation: n.rotation,
                authorName: n.authorName || 'Anonymous',
                upvotes: up,
                downvotes: down,
                cumulativeScore: up - down,
            };
        }).sort((a, b) => b.cumulativeScore - a.cumulativeScore || b.upvotes - a.upvotes);

        broadcastToParticipants({
            type: 'RESULTS',
            results,
            revealAuthors: isRevealed,
        });
    }, [broadcastToParticipants]);

    // ─── HOST: Create Room ─────────────────────────────────
    const handleCreateRoom = async (hostName) => {
        setIsLoading(true);
        setErrorMessage('');
        const code = generateRoomCode();
        const hostPeerId = getHostPeerId(code);

        try {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }

            const peer = await createPeer(hostPeerId);
            peerRef.current = peer;

            setRoomCode(code);
            setUserName(hostName);
            setView('host');
            setRound('LOBBY');
            setParticipants([{ id: 'host', name: hostName, isHost: true, connected: true }]);
            setIsLoading(false);

            // Update browser URL query param without full page reload
            const newUrl = `${window.location.pathname}?room=${code}`;
            window.history.pushState({ room: code }, '', newUrl);

            addToast(`Room ${code} created! Share the code to invite players.`, 'success');

            // Handle incoming participant connections
            peer.on('connection', (conn) => {
                let currentParticipantId = null;

                conn.on('open', () => {
                    console.log('[Host] Incoming peer connected:', conn.peer);
                });

                conn.on('data', (data) => {
                    if (!data || typeof data !== 'object') return;

                    switch (data.type) {
                        case 'JOIN': {
                            const { participantId, name } = data;
                            currentParticipantId = participantId;
                            hostConnectionsRef.current.set(participantId, conn);

                            setParticipants(prev => {
                                const exists = prev.some(p => p.id === participantId);
                                if (exists) {
                                    return prev.map(p => p.id === participantId ? { ...p, connected: true, name } : p);
                                }
                                return [...prev, { id: participantId, name, isHost: false, connected: true, isReady: false }];
                            });

                            addToast(`${name} joined the room!`, 'info');
                            playPop();

                            // Acknowledge join and send current room state
                            sendJson(conn, {
                                type: 'JOIN_ACCEPTED',
                                roomCode: code,
                                round,
                            });
                            break;
                        }

                        case 'UPDATE_NOTE': {
                            const { participantId, note } = data;
                            if (!participantId) return;

                            setNotes(prev => {
                                const author = participants.find(p => p.id === participantId);
                                return {
                                    ...prev,
                                    [participantId]: {
                                        ...note,
                                        id: `note_${participantId}`,
                                        authorId: participantId,
                                        authorName: author?.name || 'Player',
                                        lastUpdated: Date.now(),
                                    }
                                };
                            });
                            break;
                        }

                        case 'CAST_VOTE': {
                            const { voterId, noteId, vote } = data;
                            if (!voterId || !noteId) return;

                            // Security check: cannot vote on own note
                            if (noteId === `note_${voterId}`) {
                                console.warn('[Host] Rejected vote on own note from:', voterId);
                                return;
                            }

                            setVotes(prev => {
                                const currentNoteVotes = { ...(prev[noteId] || {}) };
                                if (vote === null) {
                                    delete currentNoteVotes[voterId];
                                } else {
                                    currentNoteVotes[voterId] = vote; // 'up' or 'down'
                                }
                                return {
                                    ...prev,
                                    [noteId]: currentNoteVotes,
                                };
                            });
                            break;
                        }

                        case 'PING': {
                            sendJson(conn, { type: 'PONG' });
                            break;
                        }

                        default:
                            break;
                    }
                });

                conn.on('close', () => {
                    if (currentParticipantId) {
                        hostConnectionsRef.current.delete(currentParticipantId);
                        setParticipants(prev => prev.map(p => p.id === currentParticipantId ? { ...p, connected: false } : p));
                    }
                });
            });

        } catch (err) {
            console.error('Failed to create room:', err);
            setErrorMessage(err.message || 'Failed to create room. Please try again.');
            setIsLoading(false);
        }
    };

    // ─── PARTICIPANT: Join Room ───────────────────────────
    const handleJoinRoom = async (codeToJoin, participantName) => {
        setIsLoading(true);
        setErrorMessage('');

        const pid = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const hostPeerId = getHostPeerId(codeToJoin);
        const myPeerId = getParticipantPeerId(codeToJoin, pid);

        try {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }

            const peer = await createPeer(myPeerId);
            peerRef.current = peer;

            const conn = await connectToHost(peer, hostPeerId);
            participantConnRef.current = conn;

            setMyParticipantId(pid);
            setUserName(participantName);
            setRoomCode(codeToJoin);
            setView('participant');
            setIsLoading(false);

            // Send Join handshake to Host
            sendJson(conn, {
                type: 'JOIN',
                participantId: pid,
                name: participantName,
            });

            // Start Heartbeat
            if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = setInterval(() => {
                if (conn && conn.open) {
                    sendJson(conn, { type: 'PING' });
                }
            }, 12000);

            // Listen for Host broadcasts
            conn.on('data', (data) => {
                if (!data || typeof data !== 'object') return;

                switch (data.type) {
                    case 'JOIN_ACCEPTED': {
                        setRound(data.round || 'LOBBY');
                        addToast(`Connected to Room ${data.roomCode}!`, 'success');
                        break;
                    }

                    case 'ROUND_1_STARTED': {
                        setRound('ROUND_1');
                        playChime();
                        addToast('Round 1 has started! Create your sticky note.', 'info');
                        break;
                    }

                    case 'ROUND_2_STARTED': {
                        setRound('ROUND_2');
                        setAllNotes(data.notes || []);
                        playChime();
                        addToast('Round 2 has started! Vote on your peers\' ideas.', 'info');
                        break;
                    }

                    case 'RESULTS': {
                        setRound('RESULTS');
                        setFinalResults(data.results || []);
                        setRevealAuthors(Boolean(data.revealAuthors));
                        playFanfare();
                        triggerConfetti();
                        addToast('Voting has ended! Check out the results.', 'success');
                        break;
                    }

                    case 'REVEAL_AUTHORS_TOGGLE': {
                        setRevealAuthors(Boolean(data.revealAuthors));
                        break;
                    }

                    case 'RESTART_GAME': {
                        setRound('LOBBY');
                        setMyVotes({});
                        setAllNotes([]);
                        setFinalResults([]);
                        addToast('The host restarted the game.', 'info');
                        break;
                    }

                    default:
                        break;
                }
            });

            conn.on('close', () => {
                addToast('Disconnected from Host.', 'error');
            });

        } catch (err) {
            console.error('Failed to join room:', err);
            setErrorMessage(err.message || 'Could not connect to room. Make sure the Host is online.');
            setIsLoading(false);
        }
    };

    // ─── HOST: Phase Transitions ───────────────────────────
    const handleStartRound1 = () => {
        setRound('ROUND_1');
        playChime();
        broadcastToParticipants({ type: 'ROUND_1_STARTED' });
        addToast('Round 1 started! Participants are creating sticky notes.', 'success');
    };

    const handleEndRound1 = () => {
        setRound('ROUND_2');
        playChime();
        broadcastRound2Start(notes);
        addToast('Round 1 ended. Round 2 (Voting) has started!', 'success');
    };

    const handleEndRound2 = () => {
        setRound('RESULTS');
        playFanfare();
        triggerConfetti();
        broadcastResults(notes, votes, revealAuthors);
        addToast('Voting ended! Final scores calculated.', 'success');
    };

    const handleToggleRevealAuthors = () => {
        const nextState = !revealAuthors;
        setRevealAuthors(nextState);
        broadcastToParticipants({
            type: 'REVEAL_AUTHORS_TOGGLE',
            revealAuthors: nextState,
        });
        addToast(nextState ? 'Author names revealed to all players!' : 'Author names hidden.', 'info');
    };

    const handleRestartGame = () => {
        setRound('LOBBY');
        setNotes({});
        setVotes({});
        setRevealAuthors(false);
        broadcastToParticipants({ type: 'RESTART_GAME' });
        addToast('New game session started in lobby.', 'info');
    };

    // ─── PARTICIPANT: Actions ──────────────────────────────
    const handleUpdateNote = (updatedNote) => {
        setMyNote(updatedNote);

        if (participantConnRef.current && participantConnRef.current.open) {
            sendJson(participantConnRef.current, {
                type: 'UPDATE_NOTE',
                participantId: myParticipantId,
                note: updatedNote,
            });
        }
    };

    const handleCastVote = (noteId, voteType) => {
        // Update local participant voting state
        setMyVotes(prev => {
            const next = { ...prev };
            if (voteType === null) {
                delete next[noteId];
            } else {
                next[noteId] = voteType;
            }
            return next;
        });

        // Send to Host
        if (participantConnRef.current && participantConnRef.current.open) {
            sendJson(participantConnRef.current, {
                type: 'CAST_VOTE',
                voterId: myParticipantId,
                noteId,
                vote: voteType,
            });
        }
    };

    // ─── Quick Demo Participants for Host ──────────────────
    const handleAddDemoParticipants = () => {
        const demoPlayers = [
            {
                id: 'demo_1',
                name: 'Sarah (UX)',
                note: {
                    title: 'One-Click AI Meeting Summaries',
                    content: '• Auto-generates action items\n• Direct sync with Slack & Notion\n• Saves 45 min per day per team',
                    color: 'pink',
                    rotation: -1.8,
                }
            },
            {
                id: 'demo_2',
                name: 'Marcus (Dev)',
                note: {
                    title: 'Instant Ephemeral Staging Environments',
                    content: '• Preview every pull request in 10s\n• Isolated testing databases\n• Eliminates merge conflicts before QA',
                    color: 'blue',
                    rotation: 1.5,
                }
            },
            {
                id: 'demo_3',
                name: 'Elena (Marketing)',
                note: {
                    title: 'Interactive Community Challenge Hub',
                    content: '• Weekly team gamification\n• Real-time leaderboard & perks\n• Boosts product engagement by 40%',
                    color: 'green',
                    rotation: -0.7,
                }
            }
        ];

        // Add to participants list
        setParticipants(prev => {
            const newP = [...prev];
            demoPlayers.forEach(dp => {
                if (!newP.some(p => p.id === dp.id)) {
                    newP.push({ id: dp.id, name: dp.name, isHost: false, connected: true, isReady: true });
                }
            });
            return newP;
        });

        // Add to notes
        setNotes(prev => {
            const newN = { ...prev };
            demoPlayers.forEach(dp => {
                newN[dp.id] = {
                    ...dp.note,
                    id: `note_${dp.id}`,
                    authorId: dp.id,
                    authorName: dp.name,
                    lastUpdated: Date.now(),
                };
            });
            return newN;
        });

        // Generate realistic simulated votes
        const newVotes = {};
        demoPlayers.forEach(dp => {
            const myNoteId = `note_${dp.id}`;
            // Each demo player votes on the other demo players
            demoPlayers.forEach(other => {
                const otherNoteId = `note_${other.id}`;
                if (otherNoteId !== myNoteId) {
                    if (!newVotes[otherNoteId]) newVotes[otherNoteId] = {};
                    newVotes[otherNoteId][dp.id] = Math.random() > 0.3 ? 'up' : 'down';
                }
            });
        });
        setVotes(prev => ({ ...prev, ...newVotes }));

        addToast('Added 3 demo players with notes and votes!', 'success');
        playPop();
    };

    // Confetti celebration helper
    const triggerConfetti = () => {
        try {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#fef08a', '#fecdd3', '#bae6fd', '#bbf7d0', '#e9d5ff', '#fed7aa']
            });
        } catch {
            // Ignore if canvas not supported
        }
    };

    // Leave room
    const handleLeave = () => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        if (participantConnRef.current) {
            participantConnRef.current.close();
            participantConnRef.current = null;
        }
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
        }

        // Clean up URL parameter
        const cleanUrl = window.location.pathname;
        window.history.pushState({}, '', cleanUrl);

        setView('lobby');
        setRoomCode('');
        setRound('LOBBY');
        setParticipants([]);
        setNotes({});
        setVotes({});
        setAllNotes([]);
        setMyVotes({});
        setFinalResults([]);
        addToast('Exited room.', 'info');
    };

    const shareUrl = roomCode 
        ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
        : '';

    return (
        <div className="app-container">
            <Toast toasts={toasts} onDismiss={dismissToast} />

            {showQrModal && (
                <QRCodeModal
                    roomCode={roomCode}
                    shareUrl={shareUrl}
                    onClose={() => setShowQrModal(false)}
                />
            )}

            {view === 'lobby' ? (
                <LobbyView
                    initialRoomCode={roomCode}
                    isLoading={isLoading}
                    errorMessage={errorMessage}
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                />
            ) : (
                <div className="game-layout">
                    <Header
                        roomCode={roomCode}
                        round={round}
                        isHost={view === 'host'}
                        userName={userName}
                        onOpenQr={() => setShowQrModal(true)}
                        onLeave={handleLeave}
                        addToast={addToast}
                    />

                    <main className="game-main-content">
                        {view === 'host' ? (
                            <HostDashboard
                                roomCode={roomCode}
                                round={round}
                                participants={participants}
                                notes={notes}
                                votes={votes}
                                revealAuthors={revealAuthors}
                                onStartRound1={handleStartRound1}
                                onEndRound1={handleEndRound1}
                                onEndRound2={handleEndRound2}
                                onToggleRevealAuthors={handleToggleRevealAuthors}
                                onRestartGame={handleRestartGame}
                                onAddDemoParticipants={handleAddDemoParticipants}
                                addToast={addToast}
                            />
                        ) : (
                            <ParticipantView
                                round={round}
                                myNote={myNote}
                                allNotes={allNotes}
                                myNoteId={`note_${myParticipantId}`}
                                myVotes={myVotes}
                                revealAuthors={revealAuthors}
                                finalResults={finalResults}
                                onUpdateNote={handleUpdateNote}
                                onCastVote={handleCastVote}
                            />
                        )}
                    </main>
                </div>
            )}
        </div>
    );
}
