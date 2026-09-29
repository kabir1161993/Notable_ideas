/**
 * PeerJS WebRTC Connection Service for StickyVote
 *
 * Utilizes STUN & TURN servers for reliable NAT traversal.
 * Host acts as the coordinator (Star Topology).
 * Participants connect directly to the Host.
 */

import { Peer } from 'peerjs';

// STUN + TURN config from chat-colab (Open Relay Project)
export const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
];

export const HEARTBEAT_INTERVAL = 12000; // 12 seconds
export const HEARTBEAT_TIMEOUT = 8000;   // 8 seconds

// Generate a clean, human-friendly 6-character room code
export function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export function getHostPeerId(roomCode) {
    return `stickyvote_h_${roomCode.toLowerCase().trim()}`;
}

export function getParticipantPeerId(roomCode, participantId) {
    return `stickyvote_p_${roomCode.toLowerCase().trim()}_${participantId}`;
}

/**
 * Creates a PeerJS instance with standard STUN/TURN servers
 */
export function createPeer(peerId) {
    return new Promise((resolve, reject) => {
        const peer = new Peer(peerId, {
            debug: 1,
            config: {
                iceServers: ICE_SERVERS,
            },
        });

        const openTimeout = setTimeout(() => {
            reject(new Error('Signaling server connection timed out. Please check your internet connection.'));
        }, 12000);

        peer.on('open', (id) => {
            clearTimeout(openTimeout);
            console.log(`[PeerJS] Connected to signaling broker with ID: ${id}`);
            resolve(peer);
        });

        peer.on('error', (err) => {
            clearTimeout(openTimeout);
            console.error('[PeerJS] Error:', err);
            if (err.type === 'unavailable-id') {
                reject(new Error('A room with this code is already active. Please create a new one or join it.'));
            } else if (err.type === 'peer-unavailable') {
                reject(new Error('Host room not found. Please double check the room code.'));
            } else {
                reject(err);
            }
        });
    });
}

/**
 * Participant connects to Host
 */
export function connectToHost(peer, hostPeerId) {
    return new Promise((resolve, reject) => {
        const conn = peer.connect(hostPeerId, { reliable: true });

        const timeout = setTimeout(() => {
            if (!conn.open) {
                conn.close();
                reject(new Error('Connection to Host timed out. Ensure the Host has the room open.'));
            }
        }, 15000);

        conn.on('open', () => {
            clearTimeout(timeout);
            console.log(`[PeerJS] Connected to Host: ${hostPeerId}`);
            resolve(conn);
        });

        conn.on('error', (err) => {
            clearTimeout(timeout);
            console.error('[PeerJS] Connection error:', err);
            reject(err);
        });
    });
}

/**
 * Sends a JSON message over a PeerJS DataConnection
 */
export function sendJson(connection, payload) {
    if (connection && connection.open) {
        try {
            connection.send(payload);
            return true;
        } catch (err) {
            console.error('[PeerJS] Failed to send payload:', err);
            return false;
        }
    }
    return false;
}
