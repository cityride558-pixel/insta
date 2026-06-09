import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Smile, Sparkles, Check, Send } from 'lucide-react';

const PRESET_VIBES = [
  { name: 'Sunset Vibe 🌅', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Cozy Coffee ☕', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80' },
  { name: 'City Night 🌃', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&auto=format&fit=crop&q=80' },
  { name: 'Cute Pet 🐱', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80' },
  { name: 'Retro Polaroid 📸', url: 'https://images.unsplash.com/photo-1526244434298-88fcbdb25d42?w=600&auto=format&fit=crop&q=80' }
];

export default function InstantsCamera({ onClose, currentUser, friends, activeChatId, socket, showToast, sendToChat }) {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [caption, setCaption] = useState('');
  
  // Recipients handling
  const [recipients, setRecipients] = useState(() => {
    return activeChatId ? [activeChatId] : (friends[0] ? [friends[0].id] : []);
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start/Stop Camera
  const startCamera = async () => {
    try {
      setSelectedVibe(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      showToast("Camera access denied. Try picking a vibe! ✨");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    // Start camera by default on open if possible
    startCamera();
    return () => stopCamera();
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Mirror the selfie capture
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleSelectVibe = (vibe) => {
    stopCamera();
    setCapturedImage(null);
    setSelectedVibe(vibe);
  };

  const handleToggleRecipient = (friendId) => {
    setRecipients(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId) 
        : [...prev, friendId]
    );
  };

  const handleSend = async () => {
    const finalImage = capturedImage || (selectedVibe ? selectedVibe.url : null);
    if (!finalImage) {
      showToast("Take a photo or pick a vibe first! 📸");
      return;
    }
    if (recipients.length === 0) {
      showToast("Select at least one friend to send to! 👥");
      return;
    }

    try {
      if (sendToChat) {
        // Send directly to the active chat(s) as a message
        const messagePayload = JSON.stringify({
          type: 'photo',
          url: finalImage,
          caption: caption || ''
        });
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        for (const receiverId of recipients) {
          if (socket) {
            socket.emit('send_message', {
              senderId: currentUser.id,
              receiverId,
              text: messagePayload,
              time: timeString
            });
          }
        }
        showToast("Photo sent to chat! ✈️");
        onClose();
        return;
      }

      for (const receiverId of recipients) {
        const response = await fetch('http://localhost:3001/api/instants/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId,
            imageUrl: finalImage,
            caption
          })
        });

        if (response.ok) {
          const newInstant = await response.json();
          // Emit socket notification
          if (socket) {
            socket.emit('send_instant', {
              ...newInstant,
              senderName: currentUser.name,
              senderAvatar: currentUser.avatar
            });
          }
        }
      }

      showToast("Instant sent successfully! ✈️");
      onClose();
    } catch (err) {
      console.error("Error sending instant or photo:", err);
      showToast("Failed to send photo.");
    }
  };

  return (
    <div className="call-overlay" style={{ zIndex: 1000 }}>
      <div className="instants-camera-container">
        <div className="instants-header">
          <h2>{sendToChat ? 'Send to Chat 📸' : 'Send Instant 📸'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="camera-preview-wrapper">
          {cameraActive && (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
              <button className="shutter-button" onClick={capturePhoto} />
            </>
          )}

          {!cameraActive && capturedImage && (
            <div className="captured-view">
              <img src={capturedImage} alt="captured" className="captured-image" />
              <button className="retake-button" onClick={startCamera}>Retake 🔄</button>
            </div>
          )}

          {!cameraActive && selectedVibe && (
            <div className="captured-view">
              <img src={selectedVibe.url} alt="vibe" className="captured-image" />
              <button className="retake-button" onClick={startCamera}>Use Camera 📷</button>
            </div>
          )}

          {!cameraActive && !capturedImage && !selectedVibe && (
            <div className="camera-fallback" onClick={startCamera}>
              <Camera size={48} />
              <p>Camera is off. Click to start camera, or choose a vibe below.</p>
            </div>
          )}
        </div>

        {/* Vibing Quick Pick */}
        <div className="vibes-carousel">
          <p className="section-label">Or Pick a Vibe ✨</p>
          <div className="vibes-list">
            {PRESET_VIBES.map((vibe, idx) => (
              <div 
                key={idx} 
                className={`vibe-item ${selectedVibe?.name === vibe.name ? 'active' : ''}`}
                onClick={() => handleSelectVibe(vibe)}
              >
                <img src={vibe.url} alt={vibe.name} />
                <span>{vibe.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Caption Input */}
        <div className="caption-input-container">
          <input 
            type="text" 
            placeholder="Add a caption..." 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={100}
            className="caption-input"
          />
        </div>

        {/* Friends Selection */}
        <div className="recipients-selector">
          <p className="section-label">Send to:</p>
          <div className="friends-grid">
            {friends.map(friend => {
              const isSelected = recipients.includes(friend.id);
              return (
                <div 
                  key={friend.id} 
                  className={`friend-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleRecipient(friend.id)}
                >
                  <img src={friend.avatar} alt={friend.name} className="friend-avatar-mini" />
                  <div className="friend-details-mini">
                    <span className="friend-name-mini">{friend.name}</span>
                    <span className="friend-username-mini">@{friend.username}</span>
                  </div>
                  <div className="checkbox-indicator">
                    {isSelected && <Check size={14} color="#fff" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          className="send-instant-btn" 
          onClick={handleSend}
          disabled={!capturedImage && !selectedVibe}
        >
          <Send size={18} /> {sendToChat ? 'Send to Chat' : 'Send Instant'}
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
