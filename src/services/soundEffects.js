// Synthetic Web Audio API Sound Effects
// No external assets required, low latency, works across all modern browsers.

let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function toggleSound(enabled) {
    if (enabled !== undefined) {
        soundEnabled = enabled;
    } else {
        soundEnabled = !soundEnabled;
    }
    return soundEnabled;
}

export function isSoundEnabled() {
    return soundEnabled;
}

// Gentle soft pop for card creation or interaction
export function playPop() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch {
        // Audio might be blocked until user gesture
    }
}

// Satisfying vote click (upvote or downvote)
export function playVote(isUp = true) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const startFreq = isUp ? 523.25 : 392.0; // C5 or G4
        const endFreq = isUp ? 659.25 : 329.63; // E5 or E4

        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch {
        // Audio ignored
    }
}

// Phase transition chime
export function playChime() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = now + (i * 0.08);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.45);
        });
    } catch {
        // Audio ignored
    }
}

// Results celebration fanfare
export function playFanfare() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        // C - G - C major chord fanfare
        const chords = [
            { freqs: [523.25, 659.25], start: 0, dur: 0.15 },
            { freqs: [587.33, 698.46], start: 0.15, dur: 0.15 },
            { freqs: [659.25, 783.99], start: 0.3, dur: 0.2 },
            { freqs: [783.99, 1046.5], start: 0.5, dur: 0.6 }
        ];

        chords.forEach(({ freqs, start, dur }) => {
            freqs.forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;

                const t = now + start;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(t);
                osc.stop(t + dur + 0.05);
            });
        });
    } catch {
        // Audio ignored
    }
}
