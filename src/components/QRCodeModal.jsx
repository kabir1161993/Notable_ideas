import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check } from 'lucide-react';

export default function QRCodeModal({ roomCode, shareUrl, onClose }) {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (shareUrl) {
            QRCode.toDataURL(shareUrl, {
                width: 280,
                margin: 2,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                }
            })
            .then(url => setQrDataUrl(url))
            .catch(err => console.error('QR code generation error:', err));
        }
    }, [shareUrl]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <div className="qr-badge">Scan to Join</div>
                    <h2>Join Room {roomCode}</h2>
                    <p className="modal-subtitle">Point your phone camera at this QR code to join instantly</p>
                </div>

                <div className="qr-container">
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt={`QR Code to join room ${roomCode}`} className="qr-image" />
                    ) : (
                        <div className="qr-placeholder">Generating QR code...</div>
                    )}
                </div>

                <div className="modal-url-box">
                    <span className="url-text">{shareUrl}</span>
                    <button className="btn btn-secondary btn-sm copy-btn" onClick={handleCopy}>
                        {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
}
