import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function InstantsViewer({ instant, onClose, currentUser, socket, showToast }) {
  const [progress, setProgress] = useState(100);
  const VIEW_DURATION = 5000; // 5 seconds view time

  useEffect(() => {
    if (!instant) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / VIEW_DURATION) * 100);
      setProgress(remaining);
      
      if (elapsed >= VIEW_DURATION) {
        clearInterval(interval);
        handleClose();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [instant]);

  const handleClose = async () => {
    try {
      // Mark as read in the DB
      await fetch('http://localhost:3001/api/instants/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instantId: instant.id })
      });

      // Notify the sender over socket
      if (socket) {
        socket.emit('instant_opened', {
          instantId: instant.id,
          senderId: instant.senderId,
          receiverId: currentUser.id
        });
      }

      onClose(instant.id);
    } catch (err) {
      console.error("Error marking instant as opened:", err);
      onClose(instant.id);
    }
  };

  if (!instant) return null;

  return (
    <div className="call-overlay" style={{ zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.95)' }}>
      <div className="instant-viewer-container">
        {/* Progress Bar */}
        <div className="instant-progress-bar-wrapper">
          <div className="instant-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Sender Info */}
        <div className="instant-viewer-header">
          <div className="sender-meta">
            <img src={instant.senderAvatar} alt={instant.senderName} className="sender-avatar-mini" />
            <div className="sender-text">
              <span className="sender-name">{instant.senderName}</span>
              <span className="instant-timestamp">Instant • Just now</span>
            </div>
          </div>
          <button className="instant-close-btn" onClick={handleClose}><X size={24} /></button>
        </div>

        {/* Immersive Image */}
        <div className="instant-image-wrapper">
          <img src={instant.imageUrl} alt="instant" className="instant-full-image" />
        </div>

        {/* Caption Overlay */}
        {instant.caption && (
          <div className="instant-caption-overlay">
            <p>{instant.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
