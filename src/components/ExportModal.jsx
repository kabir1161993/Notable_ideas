import React, { useState } from 'react';
import { 
    Download, 
    FileText, 
    Table, 
    Code, 
    Copy, 
    Check, 
    X, 
    Share2 
} from 'lucide-react';

export default function ExportModal({ 
    roomCode, 
    sortedNotes = [], 
    revealAuthors = false, 
    onClose,
    addToast 
}) {
    const [copiedFormat, setCopiedFormat] = useState(null);

    // Generate Markdown representation
    const generateMarkdown = () => {
        let md = `# StickyVote Board Export — Room ${roomCode}\n`;
        md += `*Exported on ${new Date().toLocaleString()}*\n\n`;
        md += `## 🏆 Final Standings\n\n`;

        sortedNotes.forEach((note, idx) => {
            const rank = idx + 1;
            const author = revealAuthors ? (note.authorName || 'Anonymous') : 'Anonymous';
            md += `### #${rank} ${note.title || 'Untitled Idea'}\n`;
            md += `- **Author:** ${author}\n`;
            md += `- **Cumulative Score:** ${note.cumulativeScore > 0 ? `+${note.cumulativeScore}` : note.cumulativeScore} (+${note.upvotes || 0} upvotes / -${note.downvotes || 0} downvotes)\n\n`;
            md += `**Details & Points:**\n`;
            md += `${note.content || '*(No details provided)*'}\n\n`;
            md += `---\n\n`;
        });

        return md;
    };

    // Generate CSV representation
    const generateCSV = () => {
        const headers = ['Rank', 'Title', 'Author', 'Cumulative Score', 'Upvotes', 'Downvotes', 'Points & Details'];
        
        const rows = sortedNotes.map((note, idx) => {
            const rank = idx + 1;
            const author = revealAuthors ? (note.authorName || 'Anonymous') : 'Anonymous';
            const cleanTitle = (note.title || '').replace(/"/g, '""');
            const cleanContent = (note.content || '').replace(/"/g, '""');
            
            return [
                rank,
                `"${cleanTitle}"`,
                `"${author}"`,
                note.cumulativeScore || 0,
                note.upvotes || 0,
                note.downvotes || 0,
                `"${cleanContent}"`,
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    };

    // Generate JSON representation
    const generateJSON = () => {
        const data = {
            roomCode,
            exportedAt: new Date().toISOString(),
            revealAuthors,
            notes: sortedNotes.map((note, idx) => ({
                rank: idx + 1,
                id: note.id,
                title: note.title || '',
                authorName: revealAuthors ? (note.authorName || 'Anonymous') : 'Anonymous',
                color: note.color,
                content: note.content || '',
                cumulativeScore: note.cumulativeScore || 0,
                upvotes: note.upvotes || 0,
                downvotes: note.downvotes || 0,
            }))
        };
        return JSON.stringify(data, null, 2);
    };

    const downloadFile = (content, filename, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Downloaded ${filename}`, 'success');
    };

    const copyToClipboard = (content, formatLabel) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedFormat(formatLabel);
            addToast(`Copied ${formatLabel} to clipboard!`, 'success');
            setTimeout(() => setCopiedFormat(null), 2000);
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card export-modal-card" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <div className="qr-badge">Host Export</div>
                    <h2>Export Board Data</h2>
                    <p className="modal-subtitle">
                        Download or copy the complete sticky note board and voting results ({sortedNotes.length} notes).
                    </p>
                </div>

                <div className="export-options-list">
                    {/* Markdown Option */}
                    <div className="export-item-card">
                        <div className="export-item-info">
                            <div className="export-icon-box md-icon-box">
                                <FileText size={22} />
                            </div>
                            <div className="export-text">
                                <h4>Markdown Report (.md)</h4>
                                <p>Human-readable text with titles, rankings, scores, and full details. Ideal for Notion & Slack.</p>
                            </div>
                        </div>
                        <div className="export-actions">
                            <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => copyToClipboard(generateMarkdown(), 'Markdown')}
                            >
                                {copiedFormat === 'Markdown' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                {copiedFormat === 'Markdown' ? 'Copied' : 'Copy'}
                            </button>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => downloadFile(generateMarkdown(), `stickyvote-room-${roomCode}.md`, 'text/markdown')}
                            >
                                <Download size={14} />
                                Download .md
                            </button>
                        </div>
                    </div>

                    {/* CSV Option */}
                    <div className="export-item-card">
                        <div className="export-item-info">
                            <div className="export-icon-box csv-icon-box">
                                <Table size={22} />
                            </div>
                            <div className="export-text">
                                <h4>Spreadsheet CSV (.csv)</h4>
                                <p>Tabular data compatible with Microsoft Excel, Google Sheets, and Apple Numbers.</p>
                            </div>
                        </div>
                        <div className="export-actions">
                            <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => copyToClipboard(generateCSV(), 'CSV')}
                            >
                                {copiedFormat === 'CSV' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                {copiedFormat === 'CSV' ? 'Copied' : 'Copy'}
                            </button>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => downloadFile(generateCSV(), `stickyvote-room-${roomCode}.csv`, 'text/csv')}
                            >
                                <Download size={14} />
                                Download .csv
                            </button>
                        </div>
                    </div>

                    {/* JSON Option */}
                    <div className="export-item-card">
                        <div className="export-item-info">
                            <div className="export-icon-box json-icon-box">
                                <Code size={22} />
                            </div>
                            <div className="export-text">
                                <h4>Raw JSON (.json)</h4>
                                <p>Full structured data format with IDs, timestamps, vote tallies, and colors.</p>
                            </div>
                        </div>
                        <div className="export-actions">
                            <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => copyToClipboard(generateJSON(), 'JSON')}
                            >
                                {copiedFormat === 'JSON' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                {copiedFormat === 'JSON' ? 'Copied' : 'Copy'}
                            </button>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => downloadFile(generateJSON(), `stickyvote-room-${roomCode}.json`, 'application/json')}
                            >
                                <Download size={14} />
                                Download .json
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
