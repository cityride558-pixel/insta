import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, Sparkles, Trophy, Play, RotateCcw, 
  Trash2, Plus, ArrowUp, ArrowDown, Type, Image as ImageIcon,
  Check, Swords, Zap, Heart, Smile
} from 'lucide-react';

// Help functions to calculate funny deterministic stats for any GIF/Image
export const getGifStats = (url, customName = '') => {
  let hash = 0;
  const str = url || 'sticker';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const getVal = (seed, min = 60, max = 100) => {
    return Math.abs((hash + seed) % (max - min + 1)) + min;
  };
  
  const cuteness = getVal(13, 65, 99);
  const derpiness = getVal(42, 60, 99);
  const zoomies = getVal(77, 50, 99);
  const attitude = getVal(104, 55, 99);
  const total = cuteness + derpiness + zoomies + attitude;
  
  const funnyTitles = [
    "Floofy Avenger", "Sofa Destroyer", "Zoomie Champ", 
    "Silly Derpface", "Drama Monarch", "Bacon Sniffer",
    "Snuggle Monster", "Chaos Catalyst", "Treat Stealer",
    "Derpy Overlord", "Couch Potato", "Bork Master"
  ];
  
  const title = customName || funnyTitles[Math.abs(hash % funnyTitles.length)];
  return { cuteness, derpiness, zoomies, attitude, total, title };
};

export const generateTarotReading = (url, sign, userName) => {
  let hash = 0;
  const str = (url || 'sticker') + sign + userName;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const getVal = (seed, min, max) => {
    return Math.abs((hash + seed) % (max - min + 1)) + min;
  };

  const matchScore = getVal(5, 50, 100);
  const chaosLevel = getVal(11, 40, 100);
  const treatBribe = getVal(23, 1, 10);

  const fortunes = [
    "Beware of sudden couch cushion explosions. Your pet companion is plotting supreme chaos.",
    "A massive treat heist is in your near future. Hide the bacon at all costs!",
    "The stars predict a 3:00 AM zoomie run across your forehead. Prepare your face.",
    "Your relationship with cardboxes will reach an all-time peak of structural damage.",
    "A side-eye of epic proportions is heading your way. Apologize in advance with cheese.",
    "The floof levels today are extremely high. Sudden shedding onto your black clothes is guaranteed.",
    "A deep philosophical nap is recommended. The sofa calls for you.",
    "You will attempt to bark/meow at the mailman, but fail to deliver the same passion."
  ];

  const reading = fortunes[Math.abs(hash % fortunes.length)];
  return { matchScore, chaosLevel, treatBribe, reading };
};

export const TAROT_SIGNS = [
  'Nap Lover 💤',
  'Sofa Destroyer 🛋️',
  'Zoomie Queen/King ⚡',
  'Drama Monarch 👑',
  'Bacon Sniffer 🥓',
  'Floofy Overlord ☁️'
];

const PRESETS = {
  cats: [
    { id: 'cat_preset_1', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1eXRnaThkM2VjY3J4OTlnaTJnM2xpd2xtNGsyN3l4ZWZ3cmN0YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/12PA1eI8FBqEUM/giphy.gif', name: 'Keyboard Cat' },
    { id: 'cat_preset_2', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwZHpxNThxODNnaGg1eHBxMXV4MGpqcms4aDMyZXdqNmxuYWptNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JIX9t2j0ZTN9S/giphy.gif', name: 'Nyan Cat' },
    { id: 'cat_preset_3', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVtc2lreTlhNDQxejZibmVyMDhxMmdqdjh6dHpvamJtNHA2ZHQ2NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8vQSQ3cNXuDGo/giphy.gif', name: 'Grumpy Cat' },
    { id: 'cat_preset_4', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGx5cGQzZHFocHl1YWtpa3F1bThtamoxc244bHNuNTRqam91dHpqOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mlvseq9yvZhba/giphy.gif', name: 'Surprised Cat' }
  ],
  dogs: [
    { id: 'dog_preset_1', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTN5dDRiMHk1MHhiY3RxbG51OHJmNWZtOHppOW4zZWQ0c2N1YWV6byZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4Hx51LAf50UrqK87Vg/giphy.gif', name: 'Doge Shiba' },
    { id: 'dog_preset_2', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG13a2N2cHAxejI5MGdqZXdnb3d4NnZtN2l5cDF3dGM0cnZ5MTQ5eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/143v0Z4767T15e/giphy.gif', name: 'Dancing Pug' },
    { id: 'dog_preset_3', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmlrdDRoN3psMXZ4dmF6aHNzdnhiMTMyNHI1ZHcxbnY0NmlyamVwcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/9G0AdIGKnZG4E/giphy.gif', name: 'Happy Golden' },
    { id: 'dog_preset_4', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXV0OGVjZzVvdmxhNmE3NHkxaG8wOGdqbmJrcW12MnIxbG5lNWtyYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/11uoNyauueZRqo/giphy.gif', name: 'Derpy Husky' }
  ]
};

export default function StickerGameCenter({ 
  onClose, 
  currentUser, 
  activeChatId, 
  socket, 
  showToast,
  mode = 'create', 
  initialGameData = null, 
  messageId = null 
}) {
  const [activeTab, setActiveTab] = useState(() => {
    if (initialGameData && initialGameData.type) {
      return initialGameData.type; // Force same game if responding
    }
    return 'sticker_duel';
  });

  const [animalType, setAnimalType] = useState('cat');
  const [mediaType, setMediaType] = useState('gif');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // 1. Sticker Duel States
  const [duelCardName, setDuelCardName] = useState('');

  // 2. Sticker Catch States
  const [gamePlaying, setGamePlaying] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(20);
  const [fallingStickers, setFallingStickers] = useState([]);
  const gameIntervalRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const catchContainerRef = useRef(null);

  // 3. Meme Maker States
  const [canvasBg, setCanvasBg] = useState('gradient-romantic');
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [memeTextVal, setMemeTextVal] = useState('');
  const [memeTextColor, setMemeTextColor] = useState('#ffffff');
  const [memeTextSize, setMemeTextSize] = useState(20);

  // 4. Pet Tarot States
  const [tarotSign, setTarotSign] = useState('Nap Lover 💤');

  // Load presets/fetch default items on start
  useEffect(() => {
    handleSearch();
  }, [animalType, mediaType]);

  // Handle Search Fetching from Cat / Dog APIs
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      let url = '';
      if (animalType === 'cat') {
        url = `https://api.thecatapi.com/v1/images/search?limit=15&mime_types=${mediaType}`;
        if (searchQuery) {
          // If searching, see if breed list matches
          const breedRes = await fetch('https://api.thecatapi.com/v1/breeds');
          const breeds = await breedRes.json();
          const matchedBreed = breeds.find(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
          if (matchedBreed) {
            url = `https://api.thecatapi.com/v1/images/search?limit=15&breed_ids=${matchedBreed.id}&mime_types=${mediaType}`;
          }
        }
      } else {
        url = `https://api.thedogapi.com/v1/images/search?limit=15&mime_types=${mediaType}`;
        if (searchQuery) {
          const breedRes = await fetch('https://api.thedogapi.com/v1/breeds');
          const breeds = await breedRes.json();
          const matchedBreed = breeds.find(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
          if (matchedBreed) {
            url = `https://api.thedogapi.com/v1/images/search?limit=15&breed_ids=${matchedBreed.id}&mime_types=${mediaType}`;
          }
        }
      }

      const response = await fetch(url);
      const data = await response.json();
      
      let items = data.map((item, idx) => ({
        id: item.id || idx,
        url: item.url,
        name: searchQuery ? `${searchQuery} ${idx+1}` : `${animalType === 'cat' ? 'Cute Cat' : 'Happy Dog'} ${idx+1}`
      }));

      // Combine with local high-quality presets for stability
      const presets = PRESETS[animalType + 's'] || [];
      if (mediaType === 'gif') {
        items = [...presets, ...items];
      }

      // Deduplicate
      const uniqueUrls = new Set();
      const deduped = items.filter(item => {
        if (uniqueUrls.has(item.url)) return false;
        uniqueUrls.add(item.url);
        return true;
      });

      setMediaItems(deduped);
    } catch (err) {
      console.error("Error fetching animal stickers:", err);
      // Fallback to presets
      setMediaItems(PRESETS[animalType + 's'] || []);
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-load Canvas if editing an existing collage
  useEffect(() => {
    if (activeTab === 'sticker_collage' && initialGameData && initialGameData.elements) {
      setCanvasElements(initialGameData.elements);
      setCanvasBg(initialGameData.background || 'gradient-romantic');
    }
  }, [activeTab, initialGameData]);

  // ==================== STICKER DUEL GAMEPLAY ====================
  const handleSendDuel = () => {
    if (!selectedMedia) {
      showToast("Please select a Sticker/GIF card first! 🐾");
      return;
    }

    const cardStats = getGifStats(selectedMedia.url, duelCardName || selectedMedia.name);
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (mode === 'create') {
      const gamePayload = {
        type: 'sticker_duel',
        status: 'pending',
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderCard: {
          url: selectedMedia.url,
          name: duelCardName || selectedMedia.name,
          stats: cardStats
        },
        receiverCard: null,
        winnerId: null,
        winnerName: null
      };

      socket.emit('send_message', {
        senderId: currentUser.id,
        receiverId: activeChatId,
        text: JSON.stringify(gamePayload),
        time: timeString
      });
      
      showToast("Sticker Duel Challenge sent! ⚔️");
      onClose();
    } else {
      // Respond Mode
      const receiverCard = {
        url: selectedMedia.url,
        name: duelCardName || selectedMedia.name,
        stats: cardStats
      };

      const senderCard = initialGameData.senderCard;
      let winnerId = 'tie';
      let winnerName = 'Tie';

      if (senderCard.stats.total > receiverCard.stats.total) {
        winnerId = initialGameData.senderId;
        winnerName = initialGameData.senderName;
      } else if (senderCard.stats.total < receiverCard.stats.total) {
        winnerId = currentUser.id;
        winnerName = currentUser.name;
      }

      const updatedPayload = {
        ...initialGameData,
        status: 'completed',
        receiverCard,
        winnerId,
        winnerName
      };

      socket.emit('update_message', {
        id: messageId,
        text: JSON.stringify(updatedPayload),
        senderId: initialGameData.senderId,
        receiverId: currentUser.id
      });

      showToast(`Battle completed! Winner: ${winnerName} 🎉`);
      onClose();
    }
  };

  // ==================== STICKER CATCH GAMEPLAY ====================
  const startCatchGame = async () => {
    setGameScore(0);
    setGameTimeLeft(20);
    setGamePlaying(true);
    setFallingStickers([]);

    // Fetch active gifs for the game
    let gameGifs = [];
    try {
      const catRes = await fetch('https://api.thecatapi.com/v1/images/search?limit=10&mime_types=gif');
      const dogRes = await fetch('https://api.thedogapi.com/v1/images/search?limit=10&mime_types=gif');
      const cats = await catRes.json();
      const dogs = await dogRes.json();
      gameGifs = [...cats.map(c => c.url), ...dogs.map(d => d.url)];
    } catch (e) {
      console.error(e);
    }
    
    if (gameGifs.length === 0) {
      // Fallback
      gameGifs = [
        ...PRESETS.cats.map(c => c.url),
        ...PRESETS.dogs.map(d => d.url)
      ];
    }

    // Timer Interval
    gameIntervalRef.current = setInterval(() => {
      setGameTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameIntervalRef.current);
          clearInterval(spawnIntervalRef.current);
          setGamePlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawner Interval
    spawnIntervalRef.current = setInterval(() => {
      if (!catchContainerRef.current) return;
      const rect = catchContainerRef.current.getBoundingClientRect();
      const randomX = Math.random() * (rect.width - 70);
      const isObstacle = Math.random() < 0.2; // 20% obstacles
      const isGolden = !isObstacle && Math.random() < 0.25; // 25% golden
      const randomGif = gameGifs[Math.floor(Math.random() * gameGifs.length)];

      const newSticker = {
        id: Date.now() + Math.random(),
        url: isObstacle ? 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVtc2lreTlhNDQxejZibmVyMDhxMmdqdjh6dHpvamJtNHA2ZHQ2NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8vQSQ3cNXuDGo/giphy.gif' : randomGif, // Angry cat obstacle
        x: randomX,
        y: -80,
        type: isObstacle ? 'obstacle' : (isGolden ? 'golden' : 'normal'),
        speed: 3 + Math.random() * 4,
        scale: 0.8 + Math.random() * 0.4
      };

      setFallingStickers(prev => [...prev, newSticker]);
    }, 600);

    // Game loop for movement
    const movementLoop = () => {
      setFallingStickers(prev => {
        if (prev.length === 0) return prev;
        return prev
          .map(s => ({ ...s, y: s.y + s.speed }))
          .filter(s => s.y < 400); // Filter out below boundary
      });
      if (gameTimeLeft > 0 || gamePlaying) {
        requestAnimationFrame(movementLoop);
      }
    };
    requestAnimationFrame(movementLoop);
  };

  useEffect(() => {
    return () => {
      clearInterval(gameIntervalRef.current);
      clearInterval(spawnIntervalRef.current);
    };
  }, []);

  const handleCatchSticker = (id, type) => {
    // Add points
    if (type === 'obstacle') {
      setGameScore(prev => Math.max(0, prev - 25));
      showToast("Ouch! Tap obstacle -25 pts! 😾");
    } else if (type === 'golden') {
      setGameScore(prev => prev + 50);
      showToast("Golden Zoomie! +50 pts! ✨🏆");
    } else {
      setGameScore(prev => prev + 10);
    }
    setFallingStickers(prev => prev.filter(s => s.id !== id));
  };

  const handleSendCatchChallenge = () => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (mode === 'create') {
      const payload = {
        type: 'sticker_catch',
        status: 'pending',
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderScore: gameScore,
        receiverScore: null,
        winnerId: null,
        winnerName: null
      };

      socket.emit('send_message', {
        senderId: currentUser.id,
        receiverId: activeChatId,
        text: JSON.stringify(payload),
        time: timeString
      });
      showToast("Sticker Catch Challenge sent! 🏆");
      onClose();
    } else {
      // Respond Challenge
      let winnerId = 'tie';
      let winnerName = 'Tie';

      if (initialGameData.senderScore > gameScore) {
        winnerId = initialGameData.senderId;
        winnerName = initialGameData.senderName;
      } else if (initialGameData.senderScore < gameScore) {
        winnerId = currentUser.id;
        winnerName = currentUser.name;
      }

      const updatedPayload = {
        ...initialGameData,
        status: 'completed',
        receiverScore: gameScore,
        winnerId,
        winnerName
      };

      socket.emit('update_message', {
        id: messageId,
        text: JSON.stringify(updatedPayload),
        senderId: initialGameData.senderId,
        receiverId: currentUser.id
      });

      showToast(`Challenge completed! Winner: ${winnerName} 🥇`);
      onClose();
    }
  };

  // ==================== MEME CANVAS MAKER ====================
  const handleAddStickerToCanvas = (url) => {
    const newEl = {
      id: Date.now(),
      type: 'sticker',
      url: url,
      x: 100,
      y: 100,
      scale: 1,
      rotation: 0
    };
    setCanvasElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleAddTextToCanvas = () => {
    if (!memeTextVal.trim()) return;
    const newEl = {
      id: Date.now(),
      type: 'text',
      text: memeTextVal,
      color: memeTextColor,
      size: memeTextSize,
      x: 120,
      y: 150,
      scale: 1,
      rotation: 0
    };
    setCanvasElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setMemeTextVal('');
  };

  const updateSelectedElement = (property, value) => {
    if (!selectedElementId) return;
    setCanvasElements(prev => prev.map(el => {
      if (el.id === selectedElementId) {
        return { ...el, [property]: value };
      }
      return el;
    }));
  };

  const handleCanvasElementMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedElementId(id);

    const el = canvasElements.find(item => item.id === id);
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialElX = el.x;
    const initialElY = el.y;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      setCanvasElements(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            x: Math.max(0, Math.min(300, initialElX + deltaX)),
            y: Math.max(0, Math.min(300, initialElY + deltaY))
          };
        }
        return item;
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSendCollage = () => {
    if (canvasElements.length === 0) {
      showToast("Add some funny stickers or text first! 🎨");
      return;
    }

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      type: 'sticker_collage',
      background: canvasBg,
      elements: canvasElements,
      lastEditor: currentUser.name
    };

    if (mode === 'create') {
      socket.emit('send_message', {
        senderId: currentUser.id,
        receiverId: activeChatId,
        text: JSON.stringify(payload),
        time: timeString
      });
      showToast("Funny Collage sent to chat! 🎨");
    } else {
      // Co-op update
      socket.emit('send_message', {
        senderId: currentUser.id,
        receiverId: activeChatId,
        text: JSON.stringify(payload),
        time: timeString
      });
      showToast("Responded with updated Collage! 🎨");
    }
    onClose();
  };

  // ==================== PET TAROT GAMEPLAY ====================
  const handleSendTarot = () => {
    if (!selectedMedia) {
      showToast("Please select a Sticker/GIF card first! 🔮");
      return;
    }

    const { matchScore, chaosLevel, treatBribe, reading } = generateTarotReading(selectedMedia.url, tarotSign, currentUser.name);
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (mode === 'create') {
      const gamePayload = {
        type: 'pet_tarot',
        status: 'pending',
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderCard: {
          url: selectedMedia.url,
          name: selectedMedia.name,
          sign: tarotSign,
          matchScore,
          chaosLevel,
          treatBribe,
          reading
        },
        receiverCard: null,
        winnerId: null,
        winnerName: null
      };

      socket.emit('send_message', {
        senderId: currentUser.id,
        receiverId: activeChatId,
        text: JSON.stringify(gamePayload),
        time: timeString
      });
      
      showToast("Pet Tarot reading sent! 🔮");
      onClose();
    } else {
      // Counter response tarot
      const receiverCard = {
        url: selectedMedia.url,
        name: selectedMedia.name,
        sign: tarotSign,
        matchScore,
        chaosLevel,
        treatBribe,
        reading
      };

      const senderCard = initialGameData.senderCard;
      // Calculate overall Soulmate Score
      const soulmateScore = Math.round((senderCard.matchScore + matchScore) / 2);

      const updatedPayload = {
        ...initialGameData,
        status: 'completed',
        receiverCard,
        soulmateScore
      };

      socket.emit('update_message', {
        id: messageId,
        text: JSON.stringify(updatedPayload),
        senderId: initialGameData.senderId,
        receiverId: currentUser.id
      });

      showToast(`Tarot Reading Matched! Soulmate Score: ${soulmateScore}% ❤️`);
      onClose();
    }
  };

  const selectedEl = canvasElements.find(el => el.id === selectedElementId);

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(8px)', padding: '20px'
    }}>
      <div className="modal-card auth-card" onClick={e => e.stopPropagation()} style={{
        maxWidth: '700px', width: '100%', maxHeight: '90vh', display: 'flex',
        flexDirection: 'column', padding: '25px', overflowY: 'auto', border: '1px solid var(--border-color)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', background: 'var(--bg-panel)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Swords className="heart-icon" size={28} style={{ color: 'var(--accent-pink)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', background: 'var(--gradient-romantic)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sticker Game Hub 🎮</h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Funny cat & dog stickers directly from internet</p>
            </div>
          </div>
          <button className="action-btn" onClick={onClose} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        {mode === 'create' && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <button 
              onClick={() => setActiveTab('sticker_duel')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: activeTab === 'sticker_duel' ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                color: 'white'
              }}
            >
              <Zap size={16} /> Sticker Duel
            </button>
            <button 
              onClick={() => setActiveTab('sticker_catch')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: activeTab === 'sticker_catch' ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                color: 'white'
              }}
            >
              <Trophy size={16} /> Catch Game
            </button>
            <button 
              onClick={() => setActiveTab('sticker_collage')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: activeTab === 'sticker_collage' ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                color: 'white'
              }}
            >
              <ImageIcon size={16} /> Meme Maker
            </button>
            <button 
              onClick={() => setActiveTab('pet_tarot')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: activeTab === 'pet_tarot' ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                color: 'white'
              }}
            >
              <Sparkles size={16} /> Pet Tarot 🔮
            </button>
          </div>
        )}

        {/* Content Tabs */}
        
        {/* ============================== TAB 1: DUEL ============================== */}
        {activeTab === 'sticker_duel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {mode === 'respond' && initialGameData && (
              <div style={{ background: 'var(--bg-hover)', padding: '15px', borderRadius: '15px', border: '1px solid var(--accent-pink)' }}>
                <div style={{ fontSize: '13px', color: 'var(--accent-pink)', fontWeight: 'bold', marginBottom: '10px' }}>⚔️ THE CHALLENGER'S CARD:</div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img src={initialGameData.senderCard.url} alt="challenger" style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--accent-purple)' }} />
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>{initialGameData.senderCard.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Class: {initialGameData.senderCard.stats.title}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>Power Score: {initialGameData.senderCard.stats.total} 💥</p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px' }}>
              {/* Media Picker List */}
              <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select 
                    value={animalType} 
                    onChange={e => setAnimalType(e.target.value)}
                    style={{ background: 'var(--bg-hover)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}
                  >
                    <option value="cat">Cats 🐱</option>
                    <option value="dog">Dogs 🐶</option>
                  </select>
                  <select 
                    value={mediaType} 
                    onChange={e => setMediaType(e.target.value)}
                    style={{ background: 'var(--bg-hover)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}
                  >
                    <option value="gif">GIFs 🎬</option>
                    <option value="png,jpg">Photos 📸</option>
                  </select>
                  <div style={{ flex: 1, display: 'flex', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <input 
                      type="text" 
                      placeholder="Breed (e.g. Shiba, Corgi, Bengal)..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', padding: '8px', width: '100%' }}
                    />
                    <button onClick={handleSearch} style={{ border: 'none', background: 'transparent', padding: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <Search size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', 
                  maxHeight: '260px', overflowY: 'auto', padding: '5px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' 
                }}>
                  {isLoading ? (
                    <div style={{ gridColumn: 'span 3', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Fetching funny cards... ⚡</div>
                  ) : mediaItems.length > 0 ? (
                    mediaItems.map(item => (
                      <div 
                        key={item.url || item.id} 
                        onClick={() => setSelectedMedia(item)}
                        style={{
                          aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                          border: selectedMedia?.url === item.url ? '3px solid var(--accent-pink)' : '2px solid transparent',
                          transform: selectedMedia?.url === item.url ? 'scale(0.96)' : 'scale(1)',
                          transition: 'all 0.2s', position: 'relative'
                        }}
                      >
                        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {selectedMedia?.url === item.url && (
                          <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--accent-pink)', borderRadius: '50%', padding: '2px', color: 'white' }}>
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: 'span 3', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No items found. Try searching another breed!</div>
                  )}
                </div>
              </div>

              {/* Card Preview Column */}
              <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>CARD PREVIEW:</div>
                {selectedMedia ? (
                  (() => {
                    const stats = getGifStats(selectedMedia.url, duelCardName || selectedMedia.name);
                    return (
                      <div style={{
                        width: '100%', maxWidth: '210px', borderRadius: '15px', overflow: 'hidden',
                        background: 'linear-gradient(180deg, #1c152a 0%, #0c0817 100%)',
                        border: '3px solid var(--accent-purple)', boxShadow: '0 8px 20px rgba(155, 93, 229, 0.4)',
                        display: 'flex', flexDirection: 'column', position: 'relative', animation: 'float 4s ease-in-out infinite'
                      }}>
                        {/* Title and Class */}
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', tracking: '1px', color: 'var(--accent-pink)', fontWeight: 'bold' }}>{stats.title}</span>
                        </div>
                        {/* Image */}
                        <div style={{ width: '100%', aspectRatio: '1.2', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={selectedMedia.url} alt="card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {/* Stats Panel */}
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>🌸 Floofiness:</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{stats.cuteness}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>🤪 Derpiness:</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{stats.derpiness}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>⚡ Zoomies:</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{stats.zoomies}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>💅 Attitude:</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{stats.attitude}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '5px', marginTop: '3px', fontSize: '12px' }}>
                            <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>💥 Power Score:</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.total}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={{
                    width: '100%', height: '260px', borderRadius: '15px', border: '2px dashed var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px'
                  }}>
                    Select a funny dog/cat GIF to generate your stats card! 🐶🐱
                  </div>
                )}
              </div>
            </div>

            {selectedMedia && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Rename your card (e.g. Borkinator 3000)..." 
                  value={duelCardName} 
                  onChange={e => setDuelCardName(e.target.value)}
                  style={{ background: 'var(--bg-hover)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', outline: 'none' }}
                />
                <button 
                  onClick={handleSendDuel}
                  style={{ 
                    padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
                    background: 'var(--gradient-romantic)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
                  }}
                >
                  <Swords size={18} /> {mode === 'create' ? "Send Battle Challenge! ⚔️" : "COUNTER ATTACK! 💥"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================== TAB 2: CATCH ============================== */}
        {activeTab === 'sticker_catch' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {mode === 'respond' && initialGameData && (
              <div style={{ background: 'var(--bg-hover)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--accent-pink)', textAlign: 'center' }}>
                🎯 Target Score to Beat: <strong style={{ color: 'var(--accent-pink)', fontSize: '18px' }}>{initialGameData.senderScore} pts</strong> set by <strong style={{ color: 'white' }}>{initialGameData.senderName}</strong>!
              </div>
            )}

            {!gamePlaying ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px 10px', textAlign: 'center' }}>
                <Trophy size={48} style={{ color: 'var(--accent-pink)', animation: 'float 3s infinite' }} />
                <h3>Cat & Dog Sticker Catch! 🐱🐶🏃‍♂️</h3>
                <p style={{ maxWidth: '400px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                  Stickers will fall from the sky. Click/Tap them to catch! <br/>
                  ⭐ <strong>Normal</strong>: +10 pts <br/>
                  🌈 <strong>Golden Zoomies</strong>: +50 pts <br/>
                  👹 <strong>Angry Cat Obstacles</strong>: -25 pts!
                </p>

                {gameScore > 0 && (
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-blue)', background: 'var(--bg-hover)', padding: '10px 20px', borderRadius: '10px' }}>
                    Final Score: {gameScore} pts! 🎉
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={startCatchGame}
                    style={{ 
                      padding: '12px 30px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold',
                      background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' 
                    }}
                  >
                    <Play size={18} /> {gameScore > 0 ? "Play Again" : "Start Game!"}
                  </button>

                  {gameScore > 0 && (
                    <button 
                      onClick={handleSendCatchChallenge}
                      style={{ 
                        padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold',
                        background: 'var(--gradient-romantic)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' 
                      }}
                    >
                      <Check size={18} /> {mode === 'create' ? "Send Challenge to Chat" : "Submit Score"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Active Catch Arena
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', padding: '0 5px' }}>
                  <span style={{ color: 'var(--accent-blue)' }}>Score: {gameScore} pts</span>
                  <span style={{ color: 'var(--accent-pink)' }}>Time Left: {gameTimeLeft}s</span>
                </div>
                
                <div 
                  ref={catchContainerRef}
                  style={{
                    height: '350px', background: 'linear-gradient(180deg, #07050a 0%, #150e26 100%)',
                    borderRadius: '15px', position: 'relative', overflow: 'hidden', border: '2px solid var(--border-color)',
                    backgroundImage: 'radial-gradient(circle at center, rgba(155, 93, 229, 0.05) 0%, transparent 70%)'
                  }}
                >
                  {fallingStickers.map(sticker => (
                    <div 
                      key={sticker.id}
                      onClick={() => handleCatchSticker(sticker.id, sticker.type)}
                      style={{
                        position: 'absolute', left: `${sticker.x}px`, top: `${sticker.y}px`,
                        width: '65px', height: '65px', cursor: 'pointer', borderRadius: '10px',
                        overflow: 'hidden', transform: `scale(${sticker.scale})`,
                        border: sticker.type === 'obstacle' ? '3px solid #ff4b4b' : (sticker.type === 'golden' ? '3px dashed #ffd700' : 'none'),
                        boxShadow: sticker.type === 'obstacle' ? '0 0 10px rgba(255, 75, 75, 0.5)' : (sticker.type === 'golden' ? '0 0 10px rgba(255, 215, 0, 0.7)' : 'none'),
                        animation: sticker.type === 'golden' ? 'bounce 0.5s infinite alternate' : 'none',
                        zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)', pointerEvents: 'auto'
                      }}
                    >
                      <img src={sticker.url} alt="target" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    </div>
                  ))}
                  {fallingStickers.length === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Get ready! Catch the pet stickers... 🐶🐱💨
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    clearInterval(gameIntervalRef.current);
                    clearInterval(spawnIntervalRef.current);
                    setGamePlaying(false);
                  }}
                  style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                >
                  Quit Game
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================== TAB 3: MEME COLLAGE ============================== */}
        {activeTab === 'sticker_collage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              
              {/* Canvas Work Area */}
              <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>MEME CANVAS:</div>
                
                <div 
                  onClick={() => setSelectedElementId(null)}
                  style={{
                    height: '350px', borderRadius: '15px', position: 'relative', overflow: 'hidden',
                    border: '2px solid var(--border-color)',
                    background: canvasBg === 'gradient-romantic' ? 'var(--gradient-romantic)' :
                                canvasBg === 'gradient-primary' ? 'var(--gradient-primary)' :
                                canvasBg === 'cozy-pet' ? 'radial-gradient(circle, #2a1b40 0%, #0d081b 100%)' :
                                canvasBg === 'neon-green' ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : '#140f24'
                  }}
                >
                  {canvasElements.map(el => {
                    const isSelected = el.id === selectedElementId;
                    return (
                      <div 
                        key={el.id}
                        onMouseDown={e => handleCanvasElementMouseDown(e, el.id)}
                        onTouchStart={e => {
                          const touch = e.touches[0];
                          handleCanvasElementMouseDown({
                            stopPropagation: () => e.stopPropagation(),
                            clientX: touch.clientX,
                            clientY: touch.clientY
                          }, el.id);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${el.x}px`,
                          top: `${el.y}px`,
                          cursor: 'move',
                          transform: `scale(${el.scale || 1}) rotate(${el.rotation || 0}deg)`,
                          border: isSelected ? '2px solid var(--accent-pink)' : '1px dashed transparent',
                          padding: isSelected ? '4px' : '0',
                          borderRadius: '8px',
                          display: 'inline-block',
                          userSelect: 'none',
                          zIndex: isSelected ? 50 : (el.type === 'text' ? 40 : 10),
                          background: el.type === 'text' ? 'rgba(0,0,0,0.4)' : 'transparent',
                          backdropFilter: el.type === 'text' ? 'blur(4px)' : 'none'
                        }}
                      >
                        {el.type === 'sticker' ? (
                          <img src={el.url} alt="meme sticker" style={{ width: '80px', height: '80px', objectFit: 'contain', pointerEvents: 'none' }} />
                        ) : (
                          <div style={{ color: el.color, fontSize: `${el.size}px`, fontWeight: 'bold', padding: '5px 10px', borderRadius: '5px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                            {el.text}
                          </div>
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--accent-pink)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }} onClick={() => setCanvasElements(prev => prev.filter(item => item.id !== el.id))}>
                            <X size={10} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {canvasElements.length === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                      Canvas is empty! Search and click funny animal stickers on the right, or add meme text bubbles. 🎨
                    </div>
                  )}
                </div>

                {/* Canvas Toolbar Controls */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Background:</div>
                  <select 
                    value={canvasBg} 
                    onChange={e => setCanvasBg(e.target.value)}
                    style={{ background: 'var(--bg-hover)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px' }}
                  >
                    <option value="gradient-romantic">Romantic Pink 🌸</option>
                    <option value="gradient-primary">Cool Purple 🔮</option>
                    <option value="cozy-pet">Cozy Room 🏠</option>
                    <option value="neon-green">Neon Sky 🌌</option>
                    <option value="dark">Solid Charcoal 🖤</option>
                  </select>
                  
                  {selectedEl && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-hover)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Size:</span>
                      <button onClick={() => updateSelectedElement('scale', Math.max(0.3, (selectedEl.scale || 1) - 0.1))} style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '2px' }}><ArrowDown size={14} /></button>
                      <button onClick={() => updateSelectedElement('scale', Math.min(3, (selectedEl.scale || 1) + 0.1))} style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '2px' }}><ArrowUp size={14} /></button>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rotate:</span>
                      <button onClick={() => updateSelectedElement('rotation', (selectedEl.rotation || 0) - 15)} style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '2px' }}><RotateCcw size={14} /></button>
                      <button onClick={() => updateSelectedElement('rotation', (selectedEl.rotation || 0) + 15)} style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '2px' }}><Play size={14} style={{ transform: 'rotate(90deg)' }} /></button>
                      <button onClick={() => setCanvasElements(prev => prev.filter(item => item.id !== selectedElementId))} style={{ border: 'none', background: 'transparent', color: 'var(--accent-pink)', cursor: 'pointer', padding: '2px' }}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stickers Selector */}
              <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>ADD STICKERS/TEXT:</div>
                
                {/* Text Adder */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-hover)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input 
                      type="text" 
                      placeholder="Type meme caption..." 
                      value={memeTextVal}
                      onChange={e => setMemeTextVal(e.target.value)}
                      style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px', color: 'white', flex: 1, fontSize: '12px', outline: 'none' }}
                    />
                    <button onClick={handleAddTextToCanvas} style={{ background: 'var(--gradient-primary)', border: 'none', borderRadius: '6px', padding: '6px', color: 'white', cursor: 'pointer' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={memeTextColor} 
                      onChange={e => setMemeTextColor(e.target.value)} 
                      style={{ border: 'none', background: 'transparent', width: '30px', height: '24px', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Size:</span>
                      <input 
                        type="range" min="12" max="36" 
                        value={memeTextSize} 
                        onChange={e => setMemeTextSize(Number(e.target.value))}
                        style={{ width: '60px' }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Stickers search / Grid */}
                <div style={{ display: 'flex', gap: '5px' }}>
                  <select 
                    value={animalType} 
                    onChange={e => setAnimalType(e.target.value)}
                    style={{ background: 'var(--bg-hover)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px', fontSize: '12px' }}
                  >
                    <option value="cat">Cats 🐱</option>
                    <option value="dog">Dogs 🐶</option>
                  </select>
                  <div style={{ flex: 1, display: 'flex', background: 'var(--bg-hover)', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <input 
                      type="text" 
                      placeholder="Breed..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', padding: '4px 6px', width: '100%', fontSize: '12px' }}
                    />
                  </div>
                  <button onClick={handleSearch} style={{ border: 'none', background: 'var(--bg-hover)', padding: '6px', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                    <Search size={14} />
                  </button>
                </div>

                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', 
                  maxHeight: '190px', overflowY: 'auto', padding: '5px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' 
                }}>
                  {isLoading ? (
                    <div style={{ gridColumn: 'span 2', padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Fetching stickers...</div>
                  ) : mediaItems.length > 0 ? (
                    mediaItems.map(item => (
                      <div 
                        key={item.url || item.id} 
                        onClick={() => handleAddStickerToCanvas(item.url)}
                        style={{
                          aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
                          border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: 'span 2', padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No items.</div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={handleSendCollage}
              style={{ 
                padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
                background: 'var(--gradient-romantic)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' 
              }}
            >
              <Check size={18} /> {mode === 'create' ? "Send Collage to Chat! 🎨" : "Reply with Updated Collage! 🎨"}
            </button>
          </div>
        )}

        {/* ============================== TAB 4: PET TAROT ============================== */}
        {activeTab === 'pet_tarot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {mode === 'respond' && initialGameData && (
              <div style={{ background: 'var(--bg-hover)', padding: '15px', borderRadius: '15px', border: '1px solid var(--accent-pink)' }}>
                <div style={{ fontSize: '13px', color: 'var(--accent-pink)', fontWeight: 'bold', marginBottom: '10px' }}>🔮 THE CHALLENGER'S TAROT CARD:</div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img src={initialGameData.senderCard.url} alt="challenger" style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--accent-purple)' }} />
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>{initialGameData.senderName}'s Card</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Vibe: {initialGameData.senderCard.sign}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', fontStyle: 'italic', color: 'var(--accent-pink)' }}>"{initialGameData.senderCard.reading}"</p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px' }}>
              {/* Selector Column */}
              <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-hover)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Select Your Friendship Vibe / Horoscope Sign:</span>
                  <select 
                    value={tarotSign} 
                    onChange={e => setTarotSign(e.target.value)}
                    style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', fontSize: '14px', outline: 'none' }}
                  >
                    {TAROT_SIGNS.map(sign => (
                      <option key={sign} value={sign}>{sign}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select 
                    value={animalType} 
                    onChange={e => setAnimalType(e.target.value)}
                    style={{ background: 'var(--bg-hover)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}
                  >
                    <option value="cat">Cats 🐱</option>
                    <option value="dog">Dogs 🐶</option>
                  </select>
                  <div style={{ flex: 1, display: 'flex', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <input 
                      type="text" 
                      placeholder="Breed (e.g. Corgi, Siamese)..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', padding: '8px', width: '100%' }}
                    />
                    <button onClick={handleSearch} style={{ border: 'none', background: 'transparent', padding: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <Search size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', 
                  maxHeight: '180px', overflowY: 'auto', padding: '5px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' 
                }}>
                  {isLoading ? (
                    <div style={{ gridColumn: 'span 3', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Summoning cosmic templates... 🔮</div>
                  ) : mediaItems.length > 0 ? (
                    mediaItems.map(item => (
                      <div 
                        key={item.url || item.id} 
                        onClick={() => setSelectedMedia(item)}
                        style={{
                          aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                          border: selectedMedia?.url === item.url ? '3px solid var(--accent-pink)' : '2px solid transparent',
                          transform: selectedMedia?.url === item.url ? 'scale(0.96)' : 'scale(1)',
                          transition: 'all 0.2s', position: 'relative'
                        }}
                      >
                        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {selectedMedia?.url === item.url && (
                          <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--accent-pink)', borderRadius: '50%', padding: '2px', color: 'white' }}>
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: 'span 3', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No items. Try another breed search!</div>
                  )}
                </div>
              </div>

              {/* Preview Column */}
              <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>TAROT PREVIEW:</div>
                {selectedMedia ? (
                  (() => {
                    const stats = generateTarotReading(selectedMedia.url, tarotSign, currentUser.name);
                    return (
                      <div style={{
                        width: '100%', maxWidth: '210px', borderRadius: '15px', overflow: 'hidden',
                        background: 'linear-gradient(180deg, #2a0b4e 0%, #0d041a 100%)',
                        border: '3px solid #ffd700', boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)',
                        display: 'flex', flexDirection: 'column', position: 'relative', animation: 'float 4.5s ease-in-out infinite'
                      }}>
                        <div style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', background: 'rgba(255, 215, 0, 0.1)' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', tracking: '1px', color: '#ffd700', fontWeight: 'bold' }}>🔮 PET Horoscope</span>
                        </div>
                        <div style={{ width: '100%', aspectRatio: '1.2', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={selectedMedia.url} alt="card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                          <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '12px' }}>{tarotSign}</div>
                          <div style={{ color: 'var(--text-main)', fontSize: '10px', fontStyle: 'italic', lineHeight: '1.3', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                            "{stats.reading}"
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span style={{ color: 'var(--text-muted)' }}> Match Score:</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)' }}>{stats.matchScore}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}> Chaos Level:</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{stats.chaosLevel}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}> Treat Bribe:</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.treatBribe} treats</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={{
                    width: '100%', height: '250px', borderRadius: '15px', border: '2px dashed var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px'
                  }}>
                    Select a pet sticker/GIF to generate your mystical fortune tarot! 🔮✨
                  </div>
                )}
              </div>
            </div>

            {selectedMedia && (
              <button 
                onClick={handleSendTarot}
                style={{ 
                  padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
                  background: 'var(--gradient-romantic)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' 
                }}
              >
                <Sparkles size={18} /> {mode === 'create' ? "Send Tarot Fortune! 🔮" : "GENERATE COUNTER TAROT! ✨"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
