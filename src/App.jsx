import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, MessageCircle, Compass, Heart, Settings, 
  Search, Info, Image as ImageIcon, 
  Smile, Send, Sparkles, Bell, BellOff, LogOut, User, UserPlus, 
  Check, X, CheckCheck, ArrowLeft, History, Camera, Layers,
  Sun, Moon, Swords, Trophy, Plus, Mic, Pause, Play, FileAudio
} from 'lucide-react';
import { io } from 'socket.io-client';
import InstantsCamera from './InstantsCamera';
import InstantsViewer from './InstantsViewer';
import StickerGameCenter from './StickerGameCenter';
import './index.css';

const API_URL = 'http://localhost:3001/api';

// WAV encoder and audio buffer helper utilities for fallback sound synthesizer
const bufferToWavBase64 = (buffer) => {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = raw PCM
  const bitDepth = 16;
  
  let result;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  
  const bufferLength = result.length * 2;
  const wavBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(wavBuffer);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength, true);
  
  floatTo16BitPCM(view, 44, result);
  
  const blob = new Blob([view], { type: 'audio/wav' });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result);
  });
};

const interleave = (inputL, inputR) => {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
};

const floatTo16BitPCM = (output, offset, input) => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};

const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const synthesizePetSound = async (type) => {
  const sampleRate = 44100;
  const duration = 1.2; // seconds
  const ctx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'meow') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, 0);
    osc.frequency.exponentialRampToValueAtTime(700, 0.3);
    osc.frequency.exponentialRampToValueAtTime(500, 1.0);
    
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.8, 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, 1.2);
  } else if (type === 'bark') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, 0);
    osc.frequency.exponentialRampToValueAtTime(80, 0.25);
    
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.9, 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, 0.3);
  } else {
    // growl
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, 0);
    osc.frequency.linearRampToValueAtTime(65, 1.2);
    
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(35, 0); 
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(8, 0);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.7, 0.15);
    gain.gain.linearRampToValueAtTime(0.5, 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, 1.2);
  }
  
  osc.start(0);
  osc.stop(duration);
  
  const renderedBuffer = await ctx.startRendering();
  return bufferToWavBase64(renderedBuffer);
};

const VoiceBubble = ({ url, duration, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      setIsPlaying(true);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="voice-message-bubble" style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px',
      borderRadius: '20px', background: isMe ? 'var(--gradient-primary)' : 'var(--bg-panel)',
      color: isMe ? 'white' : 'var(--text-main)', border: '1px solid var(--border-color)',
      minWidth: '200px', maxWidth: '280px', boxShadow: 'var(--shadow-glow)'
    }}>
      <button onClick={togglePlay} style={{
        background: isMe ? 'white' : 'var(--gradient-primary)',
        border: 'none', width: '36px', height: '36px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: isMe ? 'var(--accent-purple)' : 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0
      }}>
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} style={{ marginLeft: '2px' }} fill="currentColor" />}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ height: '4px', background: isMe ? 'rgba(255,255,255,0.3)' : 'var(--border-color)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            background: isMe ? 'white' : 'var(--accent-purple)',
            width: `${progressPercentage}%`
          }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [socket, setSocket] = useState(() => window.socketInstance || null);

  useEffect(() => {
    document.body.className = `${theme}-theme`;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [authMode, setAuthMode] = useState('login'); 
  
  const [authForm, setAuthForm] = useState({ username: '', password: '', name: '', avatar: '' });
  const [authError, setAuthError] = useState('');

  const [friends, setFriends] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  
  const [chatHistories, setChatHistories] = useState({});
  const [activeChatId, setActiveChatId] = useState(null);
  const [closingChatId, setClosingChatId] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState('messages');
  const prevTabRef = useRef(null); // tracks which tab user was on before opening a chat
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // === NOTIFICATION SYSTEM ===
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved === null ? true : saved === 'true';
  });
  const [notifPermission, setNotifPermission] = useState(() => 
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const wakeLockRef = useRef(null);
  const notifSoundCtxRef = useRef(null);
  const titleIntervalRef = useRef(null);
  const originalTitleRef = useRef(document.title);

  // Persist notification toggle
  useEffect(() => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
  }, [notificationsEnabled]);

  // Request notification permission when enabled
  useEffect(() => {
    if (notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => setNotifPermission(perm));
    }
  }, [notificationsEnabled]);

  // Wake Lock: prevent device sleep while app is active
  useEffect(() => {
    const acquireWakeLock = async () => {
      if (!notificationsEnabled || !currentUser) return;
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        }
      } catch (e) {
        // Wake Lock failed (e.g. low battery, not supported)
      }
    };
    acquireWakeLock();

    // Re-acquire on visibility change (browser releases wake lock when tab hidden)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && notificationsEnabled && currentUser) {
        acquireWakeLock();
      }
      // Clear title flash when user returns
      if (document.visibilityState === 'visible' && titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
        document.title = originalTitleRef.current;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [notificationsEnabled, currentUser]);

  // Play notification sound using AudioContext (no external files needed)
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Two-tone chime
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(830, now, 0.15);       // High note
      playTone(1100, now + 0.12, 0.2); // Higher note
      setTimeout(() => ctx.close(), 500);
    } catch (e) {
      // AudioContext not available
    }
  };

  // Flash document title for unread messages
  const flashTitle = (senderName) => {
    if (titleIntervalRef.current) return; // Already flashing
    let show = true;
    titleIntervalRef.current = setInterval(() => {
      document.title = show ? `💬 ${senderName} sent a message!` : originalTitleRef.current;
      show = !show;
    }, 1000);
  };

  // Fire a browser notification
  const fireNotification = (senderName, messagePreview, senderAvatar) => {
    if (!notificationsEnabled) return;

    // Always play sound regardless of Notification API permission
    playNotificationSound();

    // Flash title if tab not focused
    if (document.visibilityState !== 'visible') {
      flashTitle(senderName);
    }

    // Browser Notification (needs permission)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`${senderName}`, {
          body: messagePreview,
          icon: senderAvatar || '/vite.svg',
          badge: '/vite.svg',
          tag: `msg-${Date.now()}`,
          requireInteraction: true, // Stays until user interacts
          silent: false
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        // Auto-close after 8 seconds
        setTimeout(() => notif.close(), 8000);
      } catch (e) {
        // Notification constructor failed
      }
    }
  };
  // === END NOTIFICATION SYSTEM ===

  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const [statusTicker, setStatusTicker] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusTicker(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const messagesEndRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingDurationRef = useRef(0);
  const recordingStartTimeRef = useRef(0);

  // Swipe to cancel and lock states
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isCancelledBySwipe, setIsCancelledBySwipe] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isLockedBySwipe, setIsLockedBySwipe] = useState(false);
  const [isSorryModalOpen, setIsSorryModalOpen] = useState(false);

  const [micPermission, setMicPermission] = useState('unknown'); // 'unknown' | 'granted' | 'denied' | 'prompt'

  // Check mic permission on mount and when user logs in
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' });
          setMicPermission(result.state); // 'granted', 'denied', or 'prompt'
          result.onchange = () => setMicPermission(result.state);
        }
      } catch (e) {
        // Some browsers don't support querying microphone permission
        setMicPermission('unknown');
      }
    };
    if (currentUser) checkMicPermission();
  }, [currentUser]);

  const startRecording = async () => {
    // If we already know mic is denied, skip straight to fallback
    if (micPermission === 'denied') {
      cleanupRecordListeners();
      setIsRecording(false);
      setIsRecordOptionsOpen(true);
      return;
    }

    try {
      // Check if mediaDevices API is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not available. Use HTTPS or localhost.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      audioChunksRef.current = [];
      
      // Prefer webm/opus, fallback to whatever is supported
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : '';
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        // Discard clips shorter than 500ms
        if (recordingDurationRef.current < 1 && (Date.now() - recordingStartTimeRef.current < 500)) {
          showToast("Hold longer to record 🎙️");
          return;
        }

        // Only send if we have chunks and didn't cancel
        if (audioChunksRef.current.length > 0 && !mediaRecorderRef.current.isCancelled) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result;
            const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const payload = {
              type: 'voice',
              url: base64Audio,
              duration: recordingDurationRef.current
            };
            
            socket.emit('send_message', {
              senderId: currentUser.id,
              receiverId: activeChatId,
              text: JSON.stringify(payload),
              time: timeString
            });
            showToast("Voice note sent! 🎤");
          };
        }
      };

      mediaRecorderRef.current.isCancelled = false;
      mediaRecorder.start(250); // collect data in 250ms chunks for smoother waveform
      setIsRecording(true);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
      recordingStartTimeRef.current = Date.now();

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const next = prev + 1;
          recordingDurationRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      cleanupRecordListeners();
      setIsRecording(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setIsRecordOptionsOpen(true);
      } else if (err.name === 'NotFoundError') {
        showToast("No microphone found on this device 🎙️");
        setIsRecordOptionsOpen(true);
      } else {
        showToast("Microphone error — use fallback options 🎙️");
        setIsRecordOptionsOpen(true);
      }
    }
  };

  const [isRecordOptionsOpen, setIsRecordOptionsOpen] = useState(false);
  const audioFileRef = useRef(null);

  const handleAudioFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      showToast("Please select a valid audio file! 🎵");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64Audio = reader.result;
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const audio = new Audio(base64Audio);
      audio.onloadedmetadata = () => {
        const duration = Math.round(audio.duration) || 3;
        const payload = {
          type: 'voice',
          url: base64Audio,
          duration: duration
        };
        
        socket.emit('send_message', {
          senderId: currentUser.id,
          receiverId: activeChatId,
          text: JSON.stringify(payload),
          time: timeString
        });
        showToast("Voice note uploaded! 🎵");
        setIsRecordOptionsOpen(false);
      };
    };
  };

  const sendSynthesizedSound = async (type) => {
    try {
      showToast("Synthesizing pet sound... 🪄");
      const base64Audio = await synthesizePetSound(type);
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const payload = {
        type: 'voice',
        url: base64Audio,
        duration: type === 'bark' ? 1 : 2
      };
      
      socket.emit('send_message', {
        senderId: currentUser.id,
        receiverId: activeChatId,
        text: JSON.stringify(payload),
        time: timeString
      });
      showToast(`Sent ${type} sound! 🐾`);
      setIsRecordOptionsOpen(false);
    } catch (e) {
      console.error(e);
      showToast("Failed to synthesize sound.");
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    mediaRecorderRef.current.isCancelled = !shouldSend;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleRecordPress = (e) => {
    // Prevent double execution on touch/hybrid devices
    if (e.type === 'mousedown' && 'ontouchstart' in window) {
      return;
    }

    if (isRecording || mediaRecorderRef.current?.state === 'recording') return;

    // If mic is denied, go straight to fallback without trying getUserMedia
    if (micPermission === 'denied') {
      setIsRecordOptionsOpen(true);
      return;
    }

    try {
      if (e.cancelable) {
        e.preventDefault();
      }
    } catch (err) {}

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    dragStartRef.current = { x: clientX, y: clientY };
    setIsCancelledBySwipe(false);
    setIsLockedBySwipe(false);
    setSlideOffset(0);
    
    startRecording();
    
    window.addEventListener('mouseup', handleRecordRelease);
    window.addEventListener('touchend', handleRecordRelease);
    window.addEventListener('mousemove', handleRecordMove);
    window.addEventListener('touchmove', handleRecordMove);
  };

  const handleRecordMove = (e) => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    if (deltaX < 0) {
      const offset = Math.max(-120, deltaX);
      setSlideOffset(offset);
      
      if (deltaX < -100 && !isCancelledBySwipe) {
        setIsCancelledBySwipe(true);
        stopRecording(false);
        showToast("Recording cancelled 🗑️");
        cleanupRecordListeners();
      }
    }

    if (deltaY < -60 && !isLockedBySwipe && !isCancelledBySwipe) {
      setIsLockedBySwipe(true);
      showToast("Recording locked 🔒");
    }
  };

  const handleRecordRelease = (e) => {
    cleanupRecordListeners();
    if (isCancelledBySwipe) return;
    if (isLockedBySwipe) return;

    stopRecording(true);
  };

  const cleanupRecordListeners = () => {
    window.removeEventListener('mouseup', handleRecordRelease);
    window.removeEventListener('touchend', handleRecordRelease);
    window.removeEventListener('mousemove', handleRecordMove);
    window.removeEventListener('touchmove', handleRecordMove);
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Instants States
  const [activeInstants, setActiveInstants] = useState([]);
  const [viewingInstant, setViewingInstant] = useState(null);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);
  const [cameraSendToChat, setCameraSendToChat] = useState(false);
  const [archiveInstants, setArchiveInstants] = useState([]);

  // Sticker Games States
  const [isStickerGameOpen, setIsStickerGameOpen] = useState(false);
  const [stickerGameMode, setStickerGameMode] = useState('create');
  const [stickerGameData, setStickerGameData] = useState(null);
  const [stickerGameMessageId, setStickerGameMessageId] = useState(null);

  // Refs to prevent stale socket bindings
  const activeTabRef = useRef(activeTab);
  const friendsRef = useRef(friends);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('currentUser', JSON.stringify(data));
      setCurrentUser(data);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setFriends([]);
    setDiscoverUsers([]);
    setFriendRequests([]);
    setChatHistories({});
    setActiveChatId(null);
    setActiveInstants([]);
    setViewingInstant(null);
    setIsCreatingInstant(false);
    setArchiveInstants([]);
  };

  const handleAvatarUpdate = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const response = await fetch(`${API_URL}/update-avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, avatar: reader.result })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          const updatedUser = { ...currentUser, avatar: data.avatar };
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          showToast('Profile picture updated successfully! 🎉');
        } else {
          showToast('Failed to update profile picture. 😢');
        }
      } catch (err) {
        console.error(err);
        showToast('Error updating profile picture. 😢');
      }
    };
  };

  const loadData = async (activeSocket) => {
    try {
      const [friendsRes, discoverRes, reqsRes, instantsRes] = await Promise.all([
        fetch(`${API_URL}/friends/${currentUser.id}`),
        fetch(`${API_URL}/discover/${currentUser.id}`),
        fetch(`${API_URL}/requests/${currentUser.id}`),
        fetch(`${API_URL}/instants/active/${currentUser.id}`)
      ]);

      const friendsData = await friendsRes.json();
      const discoverData = await discoverRes.json();
      const reqsData = await reqsRes.json();
      const instantsData = await instantsRes.json();

      const initializedFriends = friendsData.map(u => ({ ...u, unread: 0, online: false }));
      setFriends(initializedFriends);
      setDiscoverUsers(discoverData);
      setFriendRequests(reqsData);
      setActiveInstants(instantsData);

      // Removed auto-selection of the first friend so users start at the chat list

      const sock = activeSocket || socket || window.socketInstance;
      if (sock) {
        sock.emit('check_online', initializedFriends.map(u => u.id), (statuses) => {
          setFriends(prev => prev.map(u => {
            const res = statuses[u.id];
            if (res) {
              return { ...u, online: res.online, lastSeen: res.online ? null : res.lastSeen };
            }
            return u;
          }));
        });
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const loadArchive = async () => {
    try {
      const response = await fetch(`${API_URL}/instants/archive/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setArchiveInstants(data);
      }
    } catch (err) {
      console.error("Error loading archive:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    if (!window.socketInstance) {
      window.socketInstance = io('http://localhost:3001');
    } else if (window.socketInstance.disconnected) {
      window.socketInstance.connect();
    }
    const sock = window.socketInstance;
    setSocket(sock);

    sock.emit('register_user', currentUser.id);
    sock.emit('mark_delivered', { userId: currentUser.id }); // Mark waiting messages as delivered

    loadData(sock);

    sock.on('receive_message', (msg) => {
      const friendId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
      setChatHistories(prev => ({ ...prev, [friendId]: [...(prev[friendId] || []), msg] }));
      
      if (msg.text && msg.text.toLowerCase().includes('sorry')) {
        setIsSorryModalOpen(true);
      }
      
      if (msg.senderId !== currentUser.id) {
        // If we are currently in this chat, mark it as seen immediately
        if (activeChatId === msg.senderId && document.visibilityState === 'visible') {
          sock.emit('mark_seen', { senderId: msg.senderId, receiverId: currentUser.id });
        } else {
          setFriends(prev => prev.map(u => {
            if (u.id === msg.senderId) {
              return { ...u, unread: (u.unread || 0) + 1, online: true };
            }
            return u;
          }));
        }

        // 🔔 FIRE NOTIFICATION for incoming messages
        const sender = friendsRef.current.find(f => f.id === msg.senderId);
        const senderName = sender?.name || 'Someone';
        const senderAvatar = sender?.avatar;
        let messagePreview = msg.text || '';
        if (messagePreview.startsWith('{"type":')) {
          try {
            const parsed = JSON.parse(messagePreview);
            if (parsed.type === 'voice') messagePreview = '🎤 Voice Note';
            else if (parsed.type === 'photo') messagePreview = '📷 Photo';
            else if (parsed.type === 'sticker_duel') messagePreview = '⚔️ Sticker Duel Challenge';
            else if (parsed.type === 'sticker_catch') messagePreview = '🏆 Sticker Catch Challenge';
            else if (parsed.type === 'sticker_collage') messagePreview = '🎨 Meme Collage';
            else if (parsed.type === 'pet_tarot') messagePreview = '🔮 Pet Tarot';
          } catch (e) {}
        }
        // Only notify if tab not focused OR user is in a different chat
        if (document.visibilityState !== 'visible' || activeChatId !== msg.senderId) {
          fireNotification(senderName, messagePreview, senderAvatar);
        }
      }
    });

    sock.on('message_sent', (msg) => {
      const friendId = msg.receiverId;
      setChatHistories(prev => ({ ...prev, [friendId]: [...(prev[friendId] || []), msg] }));
    });

    sock.on('messages_seen', ({ readerId }) => {
      // The other person read our messages, update our local status
      setChatHistories(prev => {
        if (!prev[readerId]) return prev;
        const updated = prev[readerId].map(m => 
          m.senderId === currentUser.id && m.status !== 'seen' ? { ...m, status: 'seen' } : m
        );
        return { ...prev, [readerId]: updated };
      });
    });

    sock.on('typing', ({ senderId }) => {
      setTypingUsers(prev => ({ ...prev, [senderId]: true }));
    });

    sock.on('stop_typing', ({ senderId }) => {
      setTypingUsers(prev => ({ ...prev, [senderId]: false }));
    });

    sock.on('user_status_change', ({ userId, status, lastSeen }) => {
      setFriends(prev => prev.map(u => u.id === userId ? { ...u, online: status === 'online', lastSeen: status === 'online' ? null : (lastSeen || u.lastSeen) } : u));
    });

    sock.on('receive_friend_request', () => {
      showToast("You received a new friend request! 💖");
      fireNotification('Friend Request', 'Someone wants to connect with you! 💖', null);
      loadData(sock);
    });

    sock.on('friend_request_accepted', () => {
      showToast("Someone accepted your friend request! 🎉");
      loadData(sock);
    });

    sock.on('receive_instant', (instant) => {
      setActiveInstants(prev => [...prev, instant]);
      showToast(`${instant.senderName} sent you an Instant! 📸`);
      fireNotification(instant.senderName, 'Sent you an Instant! 📸', instant.senderAvatar);
    });

    sock.on('instant_opened', ({ instantId, receiverId }) => {
      if (activeTabRef.current === 'archive') {
        loadArchive();
      }
      const openedFriend = friendsRef.current.find(u => u.id === receiverId);
      if (openedFriend) {
        showToast(`${openedFriend.name} opened your Instant! 👀`);
      } else {
        showToast(`Your Instant was opened! 👀`);
      }
    });

    sock.on('message_updated', ({ id, text }) => {
      setChatHistories(prev => {
        const updated = {};
        for (const friendId in prev) {
          updated[friendId] = prev[friendId] ? prev[friendId].map(m => m.id === id ? { ...m, text } : m) : [];
        }
        return updated;
      });
    });

    return () => {
      sock.off('receive_message');
      sock.off('message_sent');
      sock.off('messages_seen');
      sock.off('typing');
      sock.off('stop_typing');
      sock.off('user_status_change');
      sock.off('receive_friend_request');
      sock.off('friend_request_accepted');
      sock.off('receive_instant');
      sock.off('instant_opened');
      sock.off('message_updated');
    };
  }, [currentUser, activeChatId]); // re-bind when activeChatId changes to handle active chat seen logic

  useEffect(() => {
    if (!currentUser || !activeChatId) return;
    setFriends(prev => prev.map(u => u.id === activeChatId ? { ...u, unread: 0 } : u));
    
    const activeSocket = socket || window.socketInstance;
    if (activeSocket) {
      activeSocket.emit('mark_seen', { senderId: activeChatId, receiverId: currentUser.id });

      activeSocket.emit('check_online', [activeChatId], (statuses) => {
        setFriends(prev => prev.map(u => {
          const res = statuses[u.id];
          if (res) {
            return { ...u, online: res.online, lastSeen: res.online ? null : res.lastSeen };
          }
          return u;
        }));
      });
    }

    if (!chatHistories[activeChatId]) {
      fetch(`${API_URL}/messages/${currentUser.id}/${activeChatId}`)
        .then(res => res.json())
        .then(data => setChatHistories(prev => ({ ...prev, [activeChatId]: data })))
        .catch(err => console.error("Error fetching messages:", err));
    }
  }, [activeChatId, currentUser]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [chatHistories, activeChatId, activeTab, typingUsers]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!socket || !activeChatId) return;

    socket.emit('typing', { senderId: currentUser.id, receiverId: activeChatId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { senderId: currentUser.id, receiverId: activeChatId });
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChatId || !socket) return;
    
    if (messageText.toLowerCase().includes('sorry')) {
      setIsSorryModalOpen(true);
      return;
    }
    
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    socket.emit('send_message', { senderId: currentUser.id, receiverId: activeChatId, text: messageText, time: timeString });
    socket.emit('stop_typing', { senderId: currentUser.id, receiverId: activeChatId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setMessageText('');
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      const res = await fetch(`${API_URL}/requests/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, receiverId })
      });
      if (res.ok) {
        showToast("Friend request sent! 💌");
        socket.emit('send_friend_request', { senderId: currentUser.id, receiverId });
        setDiscoverUsers(prev => prev.filter(u => u.id !== receiverId));
      }
    } catch (err) { console.error(err); }
  };

  const acceptRequest = async (requestId, senderId) => {
    try {
      const res = await fetch(`${API_URL}/requests/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      if (res.ok) {
        showToast("Friend request accepted! 💕");
        socket.emit('accept_friend_request', { senderId, receiverId: currentUser.id });
        loadData();
      }
    } catch (err) { console.error(err); }
  };

  const declineRequest = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/requests/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      if (res.ok) {
        setFriendRequests(prev => prev.filter(r => r.requestId !== requestId));
        showToast("Friend request declined.");
      }
    } catch (err) { console.error(err); }
  };

  const renderMessageStatus = (status) => {
    if (status === 'seen') return <CheckCheck size={14} className="status-seen" />;
    if (status === 'delivered') return <CheckCheck size={14} className="status-delivered" />;
    return <Check size={14} className="status-sent" />;
  };

  if (!currentUser) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="auth-card">
          <div className="auth-header">
            <Heart size={40} className="heart-icon" />
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p>Connect with your loved ones instantly</p>
          </div>
          {authError && <div className="auth-error">{authError}</div>}
          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === 'register' && (
              <>
                <div className="form-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 10px', borderRadius: '50%', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => document.getElementById('avatar-upload').click()}
                  >
                    {authForm.avatar ? (
                      <img src={authForm.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} color="var(--text-muted)" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onloadend = () => setAuthForm({ ...authForm, avatar: reader.result });
                      }
                    }} 
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose Profile Picture</div>
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} />
                    <input type="text" placeholder="Enter your name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required={authMode === 'register'} />
                  </div>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} />
                <input type="text" placeholder="Choose a username" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Settings size={18} />
                <input type="password" placeholder="Enter your password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
              </div>
            </div>
            <button type="submit" className="auth-submit-btn">{authMode === 'login' ? 'Login' : 'Register'}</button>
            <div className="auth-toggle">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>
                {authMode === 'login' ? 'Register here' : 'Login here'}
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const filteredFriends = friends.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderingChatId = activeChatId || closingChatId;
  const activeChatData = friends.find(u => u.id === renderingChatId);
  const activeMessages = chatHistories[renderingChatId] || [];
  const isTyping = renderingChatId ? typingUsers[renderingChatId] : false;

  const renderMessageBubble = (msg) => {
    let gameData = null;
    let isGame = false;
    if (msg.text && msg.text.startsWith('{"type":')) {
      try {
        gameData = JSON.parse(msg.text);
        isGame = !!gameData.type;
      } catch (e) {
        isGame = false;
      }
    }

    if (!isGame) {
      return <div className="message-bubble">{msg.text}</div>;
    }

    if (gameData.type === 'voice') {
      const isMe = msg.senderId === currentUser.id;
      return <VoiceBubble url={gameData.url} duration={gameData.duration} isMe={isMe} />;
    }

    if (gameData.type === 'photo') {
      return (
        <div className="message-bubble photo-bubble" style={{ padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', maxWidth: '250px' }}>
          <img src={gameData.url} alt="Shared photo" style={{ width: '100%', height: 'auto', borderRadius: '10px', display: 'block', maxHeight: '300px', objectFit: 'cover' }} />
          {gameData.caption && (
            <div style={{ padding: '8px 10px', fontSize: '13px', color: 'var(--text-main)', wordBreak: 'break-word' }}>
              {gameData.caption}
            </div>
          )}
        </div>
      );
    }

    if (gameData.type === 'pet_tarot') {
      const isCompleted = gameData.status === 'completed';
      return (
        <div className="message-bubble game-bubble tarot" style={{
          background: 'linear-gradient(180deg, #2a0b4e 0%, #0d041a 100%)',
          border: isCompleted ? '2px solid #ffd700' : '2px dashed #9b5de5',
          borderRadius: '20px', padding: '15px', color: 'white', minWidth: '220px', maxWidth: '300px',
          boxShadow: '0 8px 25px rgba(255, 215, 0, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
            <Sparkles size={16} color="#ffd700" />
            <span>Pet Tarot Horoscope 🔮</span>
          </div>

          {!isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isMe ? "Sent a Tarot fortune! Waiting for Match..." : `${gameData.senderName} sent a Tarot Vibe check!`}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <img src={gameData.senderCard.url} alt="card" style={{ width: '55px', height: '55px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold', color: '#ffd700' }}>{gameData.senderCard.sign}</div>
                  <div style={{ fontStyle: 'italic', color: '#ffd700', fontSize: '10px', marginTop: '2px', lineHeight: '1.2' }}>"{gameData.senderCard.reading}"</div>
                </div>
              </div>
              {!isMe && (
                <button 
                  onClick={() => {
                    setStickerGameMode('respond');
                    setStickerGameData(gameData);
                    setStickerGameMessageId(msg.id);
                    setIsStickerGameOpen(true);
                  }}
                  style={{
                    background: 'var(--gradient-romantic)', border: 'none', color: 'white',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                    boxShadow: '0 4px 10px rgba(241, 91, 181, 0.3)'
                  }}
                >
                  Get Counter Tarot & Match! ✨
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Sender card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameData.senderName}</span>
                  <img src={gameData.senderCard.url} alt="card" style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '8px', color: '#ffd700', fontWeight: 'bold', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameData.senderCard.sign}</span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-pink)' }}>❤️</div>

                {/* Receiver card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Opponent</span>
                  <img src={gameData.receiverCard.url} alt="card" style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '8px', color: '#ffd700', fontWeight: 'bold', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameData.receiverCard.sign}</span>
                </div>
              </div>

              <div style={{
                width: '100%', textAlign: 'center', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.2)', padding: '8px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 'bold', color: '#ffd700'
              }}>
                🌟 Friendship Vibe Score: {gameData.soulmateScore}% 🌟
              </div>
            </div>
          )}
        </div>
      );
    }

    const isMe = msg.senderId === currentUser.id;

    if (gameData.type === 'sticker_duel') {
      const isCompleted = gameData.status === 'completed';
      return (
        <div className="message-bubble game-bubble duel" style={{
          background: 'linear-gradient(135deg, #1c102b, #0e0517)',
          border: isCompleted ? '2px solid var(--accent-purple)' : '2px dashed var(--accent-pink)',
          borderRadius: '20px', padding: '15px', color: 'white', minWidth: '220px', maxWidth: '300px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
            <Swords size={16} color="var(--accent-pink)" />
            <span>Sticker Card Duel ⚔️</span>
          </div>

          {!isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isMe ? "Challenged to a duel! Waiting for opponent..." : `${gameData.senderName} challenged you!`}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '10px' }}>
                <img src={gameData.senderCard.url} alt="card" style={{ width: '45px', height: '45px', borderRadius: '5px', objectFit: 'cover' }} />
                <div style={{ fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold' }}>{gameData.senderCard.name}</div>
                  <div style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>Power: {gameData.senderCard.stats.total} 💥</div>
                </div>
              </div>
              {!isMe && (
                <button 
                  onClick={() => {
                    setStickerGameMode('respond');
                    setStickerGameData(gameData);
                    setStickerGameMessageId(msg.id);
                    setIsStickerGameOpen(true);
                  }}
                  style={{
                    background: 'var(--gradient-romantic)', border: 'none', color: 'white',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                    boxShadow: '0 4px 10px rgba(241, 91, 181, 0.3)'
                  }}
                >
                  Choose Card & Duel! ⚔️
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameData.senderName}</span>
                  <img src={gameData.senderCard.url} alt="card" style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: gameData.winnerId === gameData.senderId ? '2px solid #ffd700' : 'none' }} />
                  <span style={{ fontSize: '9px', fontWeight: 'bold', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameData.senderCard.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--accent-blue)', fontWeight: 'bold' }}>{gameData.senderCard.stats.total}</span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-pink)' }}>VS</div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Opponent</span>
                  <img src={gameData.receiverCard.url} alt="card" style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: gameData.winnerId === currentUser.id ? '2px solid #ffd700' : 'none' }} />
                  <span style={{ fontSize: '9px', fontWeight: 'bold', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameData.receiverCard.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--accent-blue)', fontWeight: 'bold' }}>{gameData.receiverCard.stats.total}</span>
                </div>
              </div>

              <div style={{
                width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.06)', padding: '6px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)',
                color: gameData.winnerId === 'tie' ? '#fff' : (gameData.winnerId === currentUser.id ? '#4caf50' : '#ffd700')
              }}>
                {gameData.winnerId === 'tie' ? "👔 It's a Tie Duel!" : (gameData.winnerId === currentUser.id ? "🎉 You Won the Duel! 🎉" : `👑 ${gameData.winnerName} Wins!`)}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (gameData.type === 'sticker_catch') {
      const isCompleted = gameData.status === 'completed';
      return (
        <div className="message-bubble game-bubble catch" style={{
          background: 'linear-gradient(135deg, #0f1c1e, #060d0e)',
          border: isCompleted ? '2px solid #5390f5' : '2px dashed #ff9f43',
          borderRadius: '20px', padding: '15px', color: 'white', minWidth: '220px', maxWidth: '300px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
            <Trophy size={16} color="#ffd700" />
            <span>Sticker Catch Challenge 🏆</span>
          </div>

          {!isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isMe ? "Challenged to catch stickers! Waiting for response..." : `${gameData.senderName} challenged you!`}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffd700', textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '8px' }}>
                Score: {gameData.senderScore} pts 🐱🐶
              </div>
              {!isMe && (
                <button 
                  onClick={() => {
                    setStickerGameMode('respond');
                    setStickerGameData(gameData);
                    setStickerGameMessageId(msg.id);
                    setIsStickerGameOpen(true);
                  }}
                  style={{
                    background: 'var(--gradient-primary)', border: 'none', color: 'white',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                    boxShadow: '0 4px 10px rgba(83, 144, 245, 0.3)'
                  }}
                >
                  Play Challenge! 🚀
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{gameData.senderName}</div>
                  <div style={{ fontWeight: 'bold', color: '#ffd700' }}>{gameData.senderScore} pts</div>
                </div>
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Opponent</div>
                  <div style={{ fontWeight: 'bold', color: '#ffd700' }}>{gameData.receiverScore} pts</div>
                </div>
              </div>

              <div style={{
                width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.06)', padding: '6px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 'bold',
                color: gameData.winnerId === 'tie' ? '#fff' : (gameData.winnerId === currentUser.id ? '#4caf50' : '#ffd700')
              }}>
                {gameData.winnerId === 'tie' ? "👔 It's a Score Tie!" : (gameData.winnerId === currentUser.id ? "🎉 You Won the Duel! 🥇" : `👑 ${gameData.winnerName} Wins!`)}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (gameData.type === 'sticker_collage') {
      const scaleFactor = 200 / 350;
      return (
        <div className="message-bubble game-bubble collage" style={{
          background: 'linear-gradient(135deg, #18122b, #0d081b)',
          border: '2px solid var(--accent-purple)',
          borderRadius: '20px', padding: '12px', color: 'white', minWidth: '220px', maxWidth: '240px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
            <Smile size={14} color="var(--accent-pink)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Meme Collage {gameData.lastEditor ? `(by ${gameData.lastEditor})` : ''}</span>
          </div>

          <div style={{
            width: '200px', height: '200px', borderRadius: '10px', overflow: 'hidden', position: 'relative',
            background: gameData.background === 'gradient-romantic' ? 'var(--gradient-romantic)' :
                        gameData.background === 'gradient-primary' ? 'var(--gradient-primary)' :
                        gameData.background === 'cozy-pet' ? 'radial-gradient(circle, #2a1b40 0%, #0d081b 100%)' :
                        gameData.background === 'neon-green' ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : '#140f24'
          }}>
            {gameData.elements && gameData.elements.map((el, i) => {
              const scaledX = el.x * scaleFactor;
              const scaledY = el.y * scaleFactor;
              const scaledScale = (el.scale || 1) * scaleFactor;
              return (
                <div 
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${scaledX}px`,
                    top: `${scaledY}px`,
                    transform: `scale(${scaledScale}) rotate(${el.rotation || 0}deg)`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none'
                  }}
                >
                  {el.type === 'sticker' ? (
                    <img src={el.url} alt="sticker" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: el.color, fontSize: `${el.size || 20}px`, fontWeight: 'bold', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                      {el.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => {
              setStickerGameMode('respond');
              setStickerGameData(gameData);
              setStickerGameMessageId(msg.id);
              setIsStickerGameOpen(true);
            }}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white',
              padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px',
              textAlign: 'center', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <Plus size={12} /> Add Stickers & Co-op!
          </button>
        </div>
      );
    }

    return <div className="message-bubble">{msg.text}</div>;
  };

  const formatLastSeen = (lastSeenTime) => {
    if (!lastSeenTime) return 'Offline';
    try {
      const diffMs = new Date() - new Date(lastSeenTime);
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Last seen just now';
      return `Last seen ${diffMins} minutes ago`;
    } catch (e) {
      return 'Offline';
    }
  };

  const formatLastMessage = (text) => {
    if (!text) return 'Start chatting...';
    if (text.startsWith('{"type":')) {
      try {
        const gameData = JSON.parse(text);
        if (gameData.type === 'sticker_duel') {
          return '⚔️ Sticker Duel Challenge';
        }
        if (gameData.type === 'sticker_catch') {
          return '🏆 Sticker Catch Challenge';
        }
        if (gameData.type === 'sticker_collage') {
          return '🎨 Meme Collage';
        }
        if (gameData.type === 'pet_tarot') {
          return '🔮 Pet Tarot Horoscope';
        }
        if (gameData.type === 'photo') {
          return '📷 Photo';
        }
        if (gameData.type === 'voice') {
          return '🎤 Voice Note';
        }
      } catch (e) {
        // Fallback to text
      }
    }
    return text;
  };

  return (
    <div className="app-container">
      {toast && <div className="toast-notification">{toast}</div>}

      <nav className="sidebar">
        <div className="sidebar-profile" style={{ marginBottom: '20px', cursor: 'pointer' }} onClick={() => showToast(`Logged in as ${currentUser.name}`)}>
          <img src={currentUser.avatar} alt="Me" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-purple)' }} />
        </div>
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home className="icon" />
        </div>
        <div className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
          <div className="nav-icon-container">
            <MessageCircle className="icon" />
            {friends.reduce((acc, u) => acc + (u.unread || 0), 0) > 0 && <span className="global-badge"></span>}
          </div>
        </div>
        <div className={`nav-item ${activeTab === 'compass' ? 'active' : ''}`} onClick={() => setActiveTab('compass')}>
          <div className="nav-icon-container">
            <Compass className="icon" />
          </div>
        </div>
        <div className={`nav-item ${activeTab === 'heart' ? 'active' : ''}`} onClick={() => setActiveTab('heart')}>
          <div className="nav-icon-container">
            <Heart className="icon" />
            {friendRequests.length > 0 && <span className="global-badge" style={{ backgroundColor: 'var(--accent-blue)' }}></span>}
          </div>
        </div>
        {/* Settings tab — visible on mobile as last main nav item */}
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <div className="nav-icon-container">
            <Settings className="icon" />
          </div>
        </div>
        {/* Desktop-only items below */}
        <div className="nav-item desktop-only" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ color: 'var(--accent-purple)', cursor: 'pointer' }} title="Toggle Theme">
          {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
        </div>
        {/* Notification Toggle - desktop only */}
        <div 
          className="nav-item desktop-only" 
          onClick={() => {
            const next = !notificationsEnabled;
            setNotificationsEnabled(next);
            if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
              Notification.requestPermission().then(perm => setNotifPermission(perm));
            }
            showToast(next ? 'Notifications ON 🔔' : 'Notifications OFF 🔕');
          }} 
          style={{ cursor: 'pointer', position: 'relative' }} 
          title={notificationsEnabled ? 'Notifications ON — Click to disable' : 'Notifications OFF — Click to enable'}
        >
          <div className="nav-icon-container">
            {notificationsEnabled ? (
              <Bell className="icon" style={{ color: 'var(--accent-blue)' }} />
            ) : (
              <BellOff className="icon" style={{ color: 'var(--text-muted)' }} />
            )}
            {notificationsEnabled && (
              <span style={{
                position: 'absolute', top: '-1px', right: '-3px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: '#00ff00', border: '1.5px solid var(--bg-panel)',
                animation: 'voice-pulse 2s infinite'
              }}></span>
            )}
          </div>
        </div>
        <div className="desktop-only" style={{ flex: 1 }}></div>
        <div className="nav-item desktop-only" onClick={handleLogout} style={{ color: 'var(--accent-pink)' }}>
          <LogOut className="icon" />
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'messages' ? (
          <>
            <div className="messages-list">
              <div className="messages-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div className="messages-title" style={{ margin: 0 }}>Chats ✨</div>
                  <button className="action-btn" title="Send Instant" onClick={() => setIsCreatingInstant(true)}>
                    <Camera size={20} color="var(--accent-pink)" />
                  </button>
                </div>
                <div className="search-bar">
                  <Search size={18} />
                  <input type="text" placeholder="Search friends..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
              <div className="chats-container">
                {/* Instants Tray */}
                <div className="instants-tray">
                  {/* Current User add button */}
                  <div className="tray-item" onClick={() => setIsCreatingInstant(true)}>
                    <div className="tray-avatar-container no-unread">
                      <img src={currentUser.avatar} alt="Me" className="tray-avatar" />
                      <div className="tray-add-button">+</div>
                    </div>
                    <span className="tray-label">Your Instant</span>
                  </div>

                  {/* Friends with active instants or all online friends */}
                  {friends.map(friend => {
                    const friendInstants = activeInstants.filter(i => i.senderId === friend.id);
                    const hasUnread = friendInstants.length > 0;
                    
                    // Show in tray if they have unread instants OR if they are online to quickly send them one
                    if (!hasUnread && !friend.online) return null;

                    return (
                      <div 
                        key={friend.id} 
                        className={`tray-item ${hasUnread ? 'has-unread' : ''}`}
                        onClick={() => {
                          if (hasUnread) {
                            setViewingInstant(friendInstants[0]);
                          } else {
                            setIsCreatingInstant(friend.id); 
                          }
                        }}
                      >
                        <div className={`tray-avatar-container ${hasUnread ? 'has-unread' : 'no-unread'}`}>
                          <img src={friend.avatar} alt={friend.name} className="tray-avatar" />
                        </div>
                        <span className="tray-label">{friend.name}</span>
                      </div>
                    );
                  })}
                </div>
                {filteredFriends.length > 0 ? filteredFriends.map(user => {
                  const userMessages = chatHistories[user.id] || [];
                  const rawLastMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].text : '';
                  const lastMsg = formatLastMessage(rawLastMsg);
                  const userTyping = typingUsers[user.id];
                  return (
                    <div key={user.id} className={`chat-item ${activeChatId === user.id ? 'active' : ''}`} onClick={() => setActiveChatId(user.id)}>
                      <div className="avatar-container">
                        <div className={user.unread > 0 ? "story-ring" : ""}><img src={user.avatar} alt={user.name} className="avatar" /></div>
                        {user.online && <div className="online-indicator"></div>}
                      </div>
                      <div className="chat-info">
                        <div className="chat-header-row">
                          <span className="chat-name">{user.name}</span>
                          {userMessages.length > 0 && <span className="chat-time">{userMessages[userMessages.length - 1].time}</span>}
                        </div>
                        <div className="chat-header-row">
                          {userTyping ? (
                            <span className="chat-preview typing-text" style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>typing...</span>
                          ) : (
                            <span className="chat-preview" style={{ fontWeight: user.unread > 0 ? '700' : '400', color: user.unread > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>{lastMsg}</span>
                          )}
                          {user.unread > 0 && <span className="unread-badge">{user.unread}</span>}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No friends found 😢</div>
                )}
              </div>
            </div>

            <div className={`chat-area ${activeChatId ? 'active' : ''}`}>
              {activeChatData ? (
                <>
                  <div className="chat-top-bar">
                    <div className="chat-user-info">
                      <button className="mobile-back-btn" onClick={() => { 
                        setClosingChatId(activeChatId); 
                        setActiveChatId(null); 
                        if (prevTabRef.current && prevTabRef.current !== 'messages') { 
                          setActiveTab(prevTabRef.current); 
                          prevTabRef.current = null; 
                        }
                        setTimeout(() => setClosingChatId(null), 300);
                      }}>
                        <ArrowLeft size={24} />
                      </button>
                      <img src={activeChatData.avatar} alt={activeChatData.name} className="avatar" />
                      <div className="chat-user-details">
                        <div className="chat-user-name">{activeChatData.name}</div>
                        <div className="chat-user-status" style={{ color: isTyping ? 'var(--accent-pink)' : (activeChatData.online ? '#00ff00' : 'var(--text-muted)') }}>
                          {isTyping ? 'typing...' : (activeChatData.online ? 'Online' : formatLastSeen(activeChatData.lastSeen))}
                        </div>
                      </div>
                    </div>
                    <div className="top-bar-actions">
                      <button className="action-btn" title="Send Instant" onClick={() => { setCameraSendToChat(false); setIsCreatingInstant(activeChatData.id); }}><Camera size={20} /></button>
                      <button className="action-btn" onClick={() => showToast(`Viewing profile... ℹ️`)}><Info size={20} /></button>
                    </div>
                  </div>
                  <div className="messages-view">
                    {activeMessages.map((msg, idx) => {
                      const isMe = msg.senderId === currentUser.id;
                      const showAvatar = !isMe && (idx === activeMessages.length - 1 || activeMessages[idx + 1]?.senderId === currentUser.id);
                      return (
                        <div key={msg.id} className={`message-wrapper ${isMe ? 'sent' : 'received'}`} style={{ marginBottom: showAvatar ? '15px' : '2px' }}>
                          {!isMe && <div className="message-avatar-container" style={{ width: '30px', margin: '0 10px' }}>{showAvatar && <img src={activeChatData.avatar} alt="Avatar" className="message-avatar" style={{ margin: 0 }} />}</div>}
                          <div style={{ maxWidth: '80%' }}>
                            {renderMessageBubble(msg)}
                            <div className="message-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '5px' }}>
                              {(idx === activeMessages.length - 1 || activeMessages[idx + 1]?.senderId !== msg.senderId) && <span className="message-time">{msg.time}</span>}
                              {isMe && renderMessageStatus(msg.status)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="message-wrapper received" style={{ marginBottom: '15px' }}>
                         <div className="message-avatar-container" style={{ width: '30px', margin: '0 10px' }}>
                           <img src={activeChatData.avatar} alt="Avatar" className="message-avatar" style={{ margin: 0 }} />
                         </div>
                         <div className="message-bubble typing-bubble">
                           <span className="dot"></span>
                           <span className="dot"></span>
                           <span className="dot"></span>
                         </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="input-area">
                    <form className="input-container" onSubmit={handleSendMessage} style={{ position: 'relative', overflow: 'visible' }}>
                      {isRecording ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '2px 0', position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="voice-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4b4b' }}></div>
                            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                              {formatDuration(recordingDuration)}
                            </span>
                          </div>

                          {!isLockedBySwipe ? (
                            <div 
                              style={{ 
                                flex: 1, 
                                textAlign: 'right', 
                                paddingRight: '20px', 
                                fontSize: '12px', 
                                color: 'var(--text-muted)',
                                transform: `translateX(${slideOffset}px)`,
                                transition: slideOffset === 0 ? 'transform 0.2s' : 'none',
                                pointerEvents: 'none',
                                userSelect: 'none'
                              }}
                            >
                              ◀ Slide to cancel
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4b4b', fontSize: '11px', fontWeight: 'bold' }}>
                              🔒 LOCKED RECORDING
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isLockedBySwipe && (
                              <button type="button" className="input-btn" onClick={() => { stopRecording(false); showToast("Cancelled 🗑️"); }} title="Cancel recording" style={{ color: 'var(--accent-pink)', padding: '4px' }}>
                                <X size={18} />
                              </button>
                            )}
                            
                            {!isLockedBySwipe ? (
                              <div className="voice-pulse-dot" style={{
                                width: '32px', height: '32px', borderRadius: '50%', background: '#ff4b4b',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                              }}>
                                <Mic size={16} />
                              </div>
                            ) : (
                              <button type="button" className="send-btn" onClick={() => stopRecording(true)} title="Send Voice Note" style={{ background: 'var(--gradient-primary)', width: '32px', height: '32px' }}>
                                <Send size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <button type="button" className="input-btn" onClick={() => { setCameraSendToChat(true); setIsCreatingInstant(activeChatId); }} title="Take a Photo"><Camera size={20} /></button>
                          <button type="button" className="input-btn" onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (ev) => {
                              const file = ev.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onloadend = () => {
                                const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const payload = { type: 'photo', url: reader.result, caption: '' };
                                socket.emit('send_message', {
                                  senderId: currentUser.id,
                                  receiverId: activeChatId,
                                  text: JSON.stringify(payload),
                                  time: timeString
                                });
                                showToast("Photo sent! 📸");
                              };
                            };
                            input.click();
                          }} title="Send Image"><ImageIcon size={20} /></button>
                          
                          <button 
                            type="button" 
                            className={`input-btn mic-record-btn ${micPermission === 'denied' ? 'mic-denied' : ''}`}
                            onMouseDown={micPermission !== 'denied' ? handleRecordPress : undefined}
                            onTouchStart={micPermission !== 'denied' ? handleRecordPress : undefined}
                            onClick={micPermission === 'denied' ? () => setIsRecordOptionsOpen(true) : undefined}
                            title={micPermission === 'denied' ? 'Mic blocked — Click for options' : 'Hold to Record / Slide to Cancel'}
                            style={{ 
                              cursor: 'pointer', 
                              transition: 'all 0.2s',
                              color: micPermission === 'denied' ? 'var(--accent-pink)' : undefined,
                              position: 'relative'
                            }}
                          >
                            <Mic size={20} />
                            {micPermission === 'denied' && (
                              <span style={{
                                position: 'absolute', top: '2px', right: '2px',
                                width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: '#ff4b4b', border: '1.5px solid var(--bg-panel)'
                              }}></span>
                            )}
                          </button>

                          <input type="text" className="message-input" placeholder="Type a message..." value={messageText} onChange={handleTyping} autoFocus />
                          {messageText.length > 0 ? (
                            <button type="submit" className="send-btn"><Send size={18} /></button>
                          ) : (
                            <>
                              <button type="button" className="input-btn" onClick={() => { setStickerGameMode('create'); setStickerGameData(null); setIsStickerGameOpen(true); }} title="Play Pet Sticker Games"><Sparkles size={20} /></button>
                              <button type="button" className="input-btn" onClick={() => {
                                const hearts = ['❤️', '💕', '💖', '💗', '💝', '🥰', '😘', '💜'];
                                const randomHeart = hearts[Math.floor(Math.random() * hearts.length)];
                                const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                if (socket && activeChatId) {
                                  socket.emit('send_message', { senderId: currentUser.id, receiverId: activeChatId, text: randomHeart, time: timeString });
                                  showToast(`Sent ${randomHeart}`);
                                }
                              }} title="Send Love"><Heart size={20} /></button>
                            </>
                          )}
                        </>
                      )}
                    </form>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <MessageCircle className="empty-state-icon" />
                  <h2>Your Messages</h2>
                  <p>Wait for friends to join or select a chat to start messaging.</p>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'compass' ? (
          <div className="chat-area active" style={{ width: '100%', padding: '40px', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discover People 🌍</h2>
            <div className="discover-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {discoverUsers.length > 0 ? discoverUsers.map(u => (
                <div key={u.id} className="auth-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={u.avatar} alt={u.name} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '15px' }} />
                  <h3 style={{ marginBottom: '5px' }}>{u.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '15px' }}>@{u.username}</p>
                  <button className="auth-submit-btn" style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => sendFriendRequest(u.id)}>
                    <UserPlus size={16} /> Connect
                  </button>
                </div>
              )) : <p style={{ color: 'var(--text-muted)' }}>No new people to discover right now.</p>}
            </div>
          </div>
        ) : activeTab === 'heart' ? (
          <div className="chat-area active" style={{ width: '100%', padding: '40px', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px', background: 'var(--gradient-romantic)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Friend Requests 💌</h2>
            <div className="requests-list" style={{ maxWidth: '600px' }}>
              {friendRequests.length > 0 ? friendRequests.map(req => (
                <div key={req.requestId} className="auth-card" style={{ padding: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={req.avatar} alt={req.name} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                    <div>
                      <h4 style={{ margin: 0 }}>{req.name}</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>wants to connect</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ background: 'var(--gradient-primary)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => acceptRequest(req.requestId, req.userId)}>
                      <Check size={18} />
                    </button>
                    <button style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '10px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => declineRequest(req.requestId)}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )) : <p style={{ color: 'var(--text-muted)' }}>No pending friend requests.</p>}
            </div>
          </div>
        ) : activeTab === 'home' ? (
          <div className="chat-area active" style={{ width: '100%', padding: '40px', overflowY: 'auto' }}>
            {/* Welcome Header */}
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Hey, {currentUser.name}! ✨
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Here's what's happening in your love circle</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '30px' }}>
              {[
                { label: 'Friends', value: friends.length, icon: '💕', color: 'var(--accent-pink)' },
                { label: 'Online Now', value: friends.filter(f => f.online).length, icon: '🟢', color: '#00ff00' },
                { label: 'Unread Messages', value: friends.reduce((a, f) => a + (f.unread || 0), 0), icon: '💬', color: 'var(--accent-blue)' },
                { label: 'Active Instants', value: activeInstants.length, icon: '📸', color: 'var(--accent-purple)' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '16px',
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
                  boxShadow: 'var(--shadow-glow)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(155, 93, 229, 0.25)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
                >
                  <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                  <span style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px', color: 'var(--text-main)' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('messages')} style={{
                  padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'var(--gradient-primary)', color: 'white', fontWeight: '600', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s',
                  boxShadow: '0 4px 15px rgba(155, 93, 229, 0.3)'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                ><MessageCircle size={16} /> Open Chats</button>
                
                <button onClick={() => setIsCreatingInstant(true)} style={{
                  padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'var(--gradient-romantic)', color: 'white', fontWeight: '600', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s',
                  boxShadow: '0 4px 15px rgba(241, 91, 181, 0.3)'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                ><Camera size={16} /> Send Instant</button>
                
                <button onClick={() => setActiveTab('compass')} style={{
                  padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer',
                  background: 'var(--bg-hover)', color: 'var(--text-main)', fontWeight: '600', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                ><Compass size={16} /> Find Friends</button>
              </div>
            </div>

            {/* Online Friends */}
            {friends.filter(f => f.online).length > 0 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px', color: 'var(--text-main)' }}>Online Now 🟢</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {friends.filter(f => f.online).map(f => (
                    <div key={f.id} onClick={() => { prevTabRef.current = activeTab; setActiveChatId(f.id); setActiveTab('messages'); }} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer',
                      padding: '16px', borderRadius: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)',
                      transition: 'all 0.2s', minWidth: '100px'
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img src={f.avatar} alt={f.name} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--accent-purple)' }} />
                        <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', background: '#00ff00', borderRadius: '50%', border: '2px solid var(--bg-panel)' }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-main)', textAlign: 'center' }}>{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Settings Card */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px', color: 'var(--text-main)' }}>Notification Settings</h3>
              <div style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '16px',
                padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                boxShadow: 'var(--shadow-glow)', maxWidth: '500px'
              }}>
                {/* Toggle Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {notificationsEnabled ? <Bell size={20} color="var(--accent-blue)" /> : <BellOff size={20} color="var(--text-muted)" />}
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Push Notifications</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sound, browser alerts & title flash</div>
                    </div>
                  </div>
                  {/* Toggle Switch */}
                  <div 
                    className="notif-toggle-switch"
                    onClick={() => {
                      const next = !notificationsEnabled;
                      setNotificationsEnabled(next);
                      if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                        Notification.requestPermission().then(perm => setNotifPermission(perm));
                      }
                    }}
                    style={{
                      width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer',
                      background: notificationsEnabled ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                      border: `1px solid ${notificationsEnabled ? 'transparent' : 'var(--border-color)'}`,
                      position: 'relative', transition: 'all 0.3s ease', flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: 'white', position: 'absolute', top: '2px',
                      left: notificationsEnabled ? '25px' : '3px',
                      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}></div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '8px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                    background: notifPermission === 'granted' ? 'rgba(0, 255, 0, 0.08)' : notifPermission === 'denied' ? 'rgba(255, 75, 75, 0.08)' : 'rgba(255, 200, 0, 0.08)',
                    color: notifPermission === 'granted' ? '#00cc44' : notifPermission === 'denied' ? '#ff4b4b' : '#ffaa00',
                    border: `1px solid ${notifPermission === 'granted' ? 'rgba(0, 255, 0, 0.15)' : notifPermission === 'denied' ? 'rgba(255, 75, 75, 0.15)' : 'rgba(255, 200, 0, 0.15)'}`
                  }}>
                    {notifPermission === 'granted' ? '✅ Browser Allowed' : notifPermission === 'denied' ? '❌ Browser Blocked' : '⚠️ Not Yet Asked'}
                  </div>
                  <div style={{
                    padding: '8px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                    background: notificationsEnabled ? 'rgba(83, 144, 245, 0.08)' : 'rgba(159, 150, 170, 0.08)',
                    color: notificationsEnabled ? 'var(--accent-blue)' : 'var(--text-muted)',
                    border: `1px solid ${notificationsEnabled ? 'rgba(83, 144, 245, 0.15)' : 'rgba(159, 150, 170, 0.15)'}`
                  }}>
                    {notificationsEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
                  </div>
                  <div style={{
                    padding: '8px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                    background: wakeLockRef.current ? 'rgba(0, 255, 0, 0.08)' : 'rgba(159, 150, 170, 0.08)',
                    color: wakeLockRef.current ? '#00cc44' : 'var(--text-muted)',
                    border: `1px solid ${wakeLockRef.current ? 'rgba(0, 255, 0, 0.15)' : 'rgba(159, 150, 170, 0.15)'}`
                  }}>
                    {wakeLockRef.current ? '☀️ Wake Lock Active' : '💤 Sleep Allowed'}
                  </div>
                </div>

                {/* Permission Request Button (only if not granted) */}
                {notifPermission !== 'granted' && notificationsEnabled && (
                  <button 
                    onClick={() => {
                      if (typeof Notification !== 'undefined') {
                        Notification.requestPermission().then(perm => {
                          setNotifPermission(perm);
                          showToast(perm === 'granted' ? 'Notifications enabled! 🔔' : 'Permission denied by browser 🔕');
                        });
                      }
                    }}
                    style={{
                      padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--accent-blue)',
                      background: 'transparent', color: 'var(--accent-blue)', cursor: 'pointer',
                      fontWeight: '600', fontSize: '12px', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(83, 144, 245, 0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Bell size={14} /> Allow Browser Notifications
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="chat-area active" style={{ width: '100%', padding: '30px 20px', overflowY: 'auto' }}>
            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px', padding: '20px', background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div 
                style={{ position: 'relative', width: '56px', height: '56px', cursor: 'pointer', borderRadius: '50%', border: '2px solid var(--accent-purple)', overflow: 'hidden' }}
                onClick={() => document.getElementById('settings-avatar-upload').click()}
                onMouseOver={e => e.currentTarget.lastChild.style.opacity = 1}
                onMouseOut={e => e.currentTarget.lastChild.style.opacity = 0}
              >
                <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                  <Camera size={20} color="white" />
                </div>
              </div>
              <input 
                type="file" 
                id="settings-avatar-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleAvatarUpdate(e.target.files[0])} 
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '18px' }}>{currentUser.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>@{currentUser.username}</div>
              </div>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Settings ⚙️</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
              {/* Theme Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'var(--bg-panel)', borderRadius: '14px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {theme === 'dark' ? <Moon size={20} color="var(--accent-purple)" /> : <Sun size={20} color="var(--accent-purple)" />}
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Appearance</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                  </div>
                </div>
                <div className="notif-toggle-switch" style={{
                  width: '48px', height: '26px', borderRadius: '13px',
                  background: theme === 'dark' ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                  border: `1px solid ${theme === 'dark' ? 'transparent' : 'var(--border-color)'}`,
                  position: 'relative', flexShrink: 0
                }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: theme === 'dark' ? '25px' : '3px', transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></div>
                </div>
              </div>

              {/* Notifications Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'var(--bg-panel)', borderRadius: '14px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => {
                  const next = !notificationsEnabled;
                  setNotificationsEnabled(next);
                  if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                    Notification.requestPermission().then(perm => setNotifPermission(perm));
                  }
                  showToast(next ? 'Notifications ON 🔔' : 'Notifications OFF 🔕');
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {notificationsEnabled ? <Bell size={20} color="var(--accent-blue)" /> : <BellOff size={20} color="var(--text-muted)" />}
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Notifications</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{notificationsEnabled ? 'Sound & alerts enabled' : 'All notifications off'}</div>
                  </div>
                </div>
                <div className="notif-toggle-switch" style={{
                  width: '48px', height: '26px', borderRadius: '13px',
                  background: notificationsEnabled ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                  border: `1px solid ${notificationsEnabled ? 'transparent' : 'var(--border-color)'}`,
                  position: 'relative', flexShrink: 0
                }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: notificationsEnabled ? '25px' : '3px', transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></div>
                </div>
              </div>

              {/* Archive */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'var(--bg-panel)', borderRadius: '14px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => { setActiveTab('archive'); loadArchive(); }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <History size={20} color="var(--accent-purple)" />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Instants Archive</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View sent instants history</div>
                  </div>
                </div>
                <ArrowLeft size={16} color="var(--text-muted)" style={{ transform: 'rotate(180deg)' }} />
              </div>

              {/* Logout */}
              <div style={{ marginTop: '10px' }}>
                <button onClick={handleLogout} style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 75, 75, 0.2)',
                  background: 'rgba(255, 75, 75, 0.06)', color: '#ff4b4b', cursor: 'pointer',
                  fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 75, 75, 0.12)'; e.currentTarget.style.borderColor = 'rgba(255, 75, 75, 0.4)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 75, 75, 0.06)'; e.currentTarget.style.borderColor = 'rgba(255, 75, 75, 0.2)'; }}
                >
                  <LogOut size={18} /> Log Out
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'archive' ? (
          <div className="chat-area active" style={{ width: '100%', padding: '30px 20px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => setActiveTab('settings')} className="mobile-back-btn" style={{ display: 'flex' }}>
                <ArrowLeft size={22} />
              </button>
              <h2 style={{ margin: 0, background: 'var(--gradient-romantic)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Instants Archive 🗄️</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '13px' }}>Your sent Instants are saved here.</p>
            <div className="archive-grid">
              {archiveInstants.length > 0 ? archiveInstants.map(inst => (
                <div key={inst.id} className="archive-card">
                  <img src={inst.imageUrl} alt="archived" className="archive-image" />
                  <div className="archive-meta">
                    <span className="archive-recipient">To: {inst.receiverName}</span>
                    <span className="archive-date">{new Date(inst.timestamp).toLocaleDateString()}</span>
                    {inst.caption && <span className="archive-caption">"{inst.caption}"</span>}
                  </div>
                </div>
              )) : <p style={{ color: 'var(--text-muted)' }}>No sent Instants in your archive.</p>}
            </div>
          </div>
        ) : null}
      </main>

      {/* Instants Camera Modal */}
      {isCreatingInstant && (
        <InstantsCamera 
          onClose={() => {
            setIsCreatingInstant(false);
            setCameraSendToChat(false);
          }} 
          currentUser={currentUser} 
          friends={friends} 
          activeChatId={typeof isCreatingInstant === 'number' ? isCreatingInstant : activeChatId} 
          socket={socket} 
          showToast={showToast} 
          sendToChat={cameraSendToChat}
        />
      )}

      {/* Instants Viewer Modal */}
      {viewingInstant && (
        <InstantsViewer 
          instant={viewingInstant} 
          onClose={(openedId) => {
            setViewingInstant(null);
            // Remove from active list locally
            setActiveInstants(prev => prev.filter(i => i.id !== openedId));
          }} 
          currentUser={currentUser} 
          socket={socket} 
          showToast={showToast} 
        />
      )}

      {/* Sticker Game Center Modal */}
      {isStickerGameOpen && (
        <StickerGameCenter
          onClose={() => {
            setIsStickerGameOpen(false);
            setStickerGameData(null);
            setStickerGameMessageId(null);
          }}
          currentUser={currentUser}
          activeChatId={activeChatId}
          socket={socket}
          showToast={showToast}
          mode={stickerGameMode}
          initialGameData={stickerGameData}
          messageId={stickerGameMessageId}
        />
      )}
      {/* Record Options & File Upload Fallback Modal */}
      {isRecordOptionsOpen && (
        <div className="modal-overlay" onClick={() => setIsRecordOptionsOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          backdropFilter: 'blur(8px)', padding: '20px'
        }}>
          <div className="modal-card auth-card" onClick={e => e.stopPropagation()} style={{
            maxWidth: '420px', width: '100%', padding: '28px', border: '1px solid var(--border-color)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)', background: 'var(--bg-panel)', display: 'flex',
            flexDirection: 'column', gap: '18px', borderRadius: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={20} color="var(--accent-pink)" /> Voice Note Options
              </h3>
              <button className="action-btn" onClick={() => setIsRecordOptionsOpen(false)} style={{ padding: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            {/* Permission Status Banner */}
            <div style={{
              padding: '14px 16px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px',
              background: micPermission === 'denied' ? 'rgba(255, 75, 75, 0.08)' : 'rgba(83, 144, 245, 0.08)',
              border: `1px solid ${micPermission === 'denied' ? 'rgba(255, 75, 75, 0.2)' : 'rgba(83, 144, 245, 0.2)'}`
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: micPermission === 'denied' ? 'rgba(255, 75, 75, 0.15)' : 'rgba(83, 144, 245, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
              }}>
                {micPermission === 'denied' ? '🔒' : 'ℹ️'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {micPermission === 'denied' ? (
                  <>
                    <strong style={{ color: 'var(--accent-pink)' }}>Microphone blocked by system.</strong><br/>
                    To fix: Open <strong>Windows Settings → Privacy → Microphone</strong> and enable access for your browser. Then reload this page.
                  </>
                ) : (
                  <>
                    <strong style={{ color: 'var(--accent-blue)' }}>Microphone unavailable.</strong><br/>
                    Try the options below or check your browser permissions.
                  </>
                )}
              </div>
            </div>

            {/* Request Permission Button */}
            <button 
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  stream.getTracks().forEach(t => t.stop());
                  setMicPermission('granted');
                  setIsRecordOptionsOpen(false);
                  showToast("Microphone enabled! 🎉 Hold the mic button to record.");
                } catch (e) {
                  setMicPermission('denied');
                  showToast("Still blocked — check system settings 🔒");
                }
              }}
              style={{
                padding: '13px', borderRadius: '12px', border: '2px solid var(--accent-purple)', cursor: 'pointer', fontWeight: 'bold',
                background: 'transparent', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '14px', transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(155, 93, 229, 0.1)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Mic size={18} /> Try Again — Request Permission
            </button>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }}></div>

            {/* Upload Audio */}
            <button 
              onClick={() => audioFileRef.current?.click()}
              style={{
                padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '14px', boxShadow: '0 4px 12px rgba(83, 144, 245, 0.3)'
              }}
            >
              <FileAudio size={18} /> Upload Audio File
            </button>

            {/* Pet Sounds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fun Pet Sounds</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button 
                  onClick={() => sendSynthesizedSound('meow')}
                  style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <span style={{ fontSize: '22px' }}>🐱</span> Meow
                </button>
                <button 
                  onClick={() => sendSynthesizedSound('bark')}
                  style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <span style={{ fontSize: '22px' }}>🐶</span> Bark
                </button>
                <button 
                  onClick={() => sendSynthesizedSound('growl')}
                  style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <span style={{ fontSize: '22px' }}>👹</span> Growl
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sorry Restriction Modal */}
      {isSorryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSorryModalOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          backdropFilter: 'blur(12px)', padding: '20px'
        }}>
          <div className="modal-card auth-card sorry-restriction-card" onClick={e => e.stopPropagation()} style={{
            maxWidth: '420px', width: '100%', padding: '30px',
            border: '2px dashed var(--accent-pink)',
            boxShadow: '0 0 30px rgba(255, 20, 147, 0.4)',
            background: 'linear-gradient(135deg, #1f0b2a 0%, #0d0412 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: '22px', borderRadius: '20px',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-10px', left: '10px', fontSize: '30px', opacity: 0.3, animation: 'float 4s infinite ease-in-out' }}>💖</div>
            <div style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '35px', opacity: 0.3, animation: 'float 3s infinite ease-in-out' }}>💝</div>
            <div style={{ position: 'absolute', top: '40%', right: '10px', fontSize: '25px', opacity: 0.2, animation: 'float 5s infinite ease-in-out' }}>💕</div>

            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 75, 75, 0.1)',
              border: '2px solid var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-pink)', fontSize: '24px', animation: 'voice-pulse 1.5s infinite'
            }}>
              🚫
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--accent-pink)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                RESTRICTED WORD!
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                The word <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>"sorry"</span> is not allowed in this love zone.
              </p>
            </div>
            
            <div style={{
              padding: '20px', borderRadius: '15px', background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)', width: '100%',
              display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              <div style={{ fontSize: '16px', color: 'white', fontWeight: '500', lineHeight: '1.4' }}>
                "Unga sorry ah neengalae vachikonga, sariya? 💖"
              </div>
              <div style={{ fontSize: '14px', color: 'var(--accent-purple)', fontWeight: 'bold', fontStyle: 'italic' }}>
                (Unga anbu matum podhum enaku)
              </div>
            </div>

            <button 
              onClick={() => setIsSorryModalOpen(false)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                fontWeight: 'bold', background: 'var(--gradient-romantic)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 4px 15px rgba(255, 20, 147, 0.4)', fontSize: '14px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Uradhi, Anbu Mattum Podhum! ❤️
            </button>
          </div>
        </div>
      )}

      <input type="file" ref={audioFileRef} accept="audio/*" onChange={handleAudioFileUpload} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
