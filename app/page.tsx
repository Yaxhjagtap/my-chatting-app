"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, CheckCheck, ChevronLeft, LogOut, Lock, User as UserIcon, Search, Edit2, Trash2, Smile, Settings, Reply, Moon, Sun, Palette, Image as ImageIcon, Sparkles } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface ReactionType { emoji: string; userName: string; }
interface MessageType {
  _id?: string; id: string; senderName: string; recipientName: string;
  text: string; time: string; status?: 'sent' | 'delivered' | 'seen';
  reactions?: ReactionType[]; isEdited?: boolean;
  replyTo?: { id: string; senderName: string; text: string; };
}
interface UserType {
  _id: string; name: string; avatar?: string; isOnline?: boolean; lastSeen?: string | null; chatBackgrounds?: Record<string, string>;
}

let socket: Socket;

const SPECIAL_EMOJIS = ['❤️', '🌸', '😂', '🔥', '✨', '😡', '🫂'];

const BACKGROUND_OPTIONS = [
  { id: 'default', name: 'Default', lightClass: 'bg-[#f4f4f5]', darkClass: 'bg-[#0a0a0a]', pattern: 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1.5\' fill=\'%23737373\' fill-opacity=\'0.25\'/%3E%3C/svg%3E")' },
  { id: 'love', name: 'Love', lightClass: 'bg-gradient-to-br from-rose-100 via-pink-50 to-red-50', darkClass: 'bg-gradient-to-br from-rose-950 via-pink-900/40 to-slate-950', pattern: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 50 50\'%3E%3Cpath fill=\'%23f43f5e\' fill-opacity=\'0.2\' d=\'M25 39.7l-.6-.5C11.5 28.7 8 25 8 19c0-5 4-9 9-9 4.1 0 6.4 2.3 8 4.1 1.6-1.8 3.9-4.1 8-4.1 5 0 9 4 9 9 0 6-3.5 9.7-16.4 20.2l-.6.5zM17 12c-3.9 0-7 3.1-7 7 0 5.1 3.2 8.5 15 18.1 11.8-9.6 15-13 15-18.1 0-3.9-3.1-7-7-7-3.5 0-5.4 2.1-6.9 3.8L25 17.1l-1.1-1.3C22.4 14.1 20.5 12 17 12z\'/%3E%3C/svg%3E")' },
  { id: 'space', name: 'Space', lightClass: 'bg-gradient-to-b from-indigo-100 via-purple-50 to-white', darkClass: 'bg-gradient-to-b from-indigo-950 via-slate-900 to-[#0a0a0a]', pattern: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1.5\' fill=\'%23a5b4fc\' fill-opacity=\'0.6\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'2\' fill=\'%23a5b4fc\' fill-opacity=\'0.8\'/%3E%3Ccircle cx=\'90\' cy=\'20\' r=\'1\' fill=\'%23a5b4fc\' fill-opacity=\'0.5\'/%3E%3Ccircle cx=\'30\' cy=\'80\' r=\'2.5\' fill=\'%23a5b4fc\' fill-opacity=\'0.4\'/%3E%3Ccircle cx=\'80\' cy=\'70\' r=\'1\' fill=\'%23a5b4fc\' fill-opacity=\'0.7\'/%3E%3C/svg%3E")' },
  { id: 'sunset', name: 'Sunset', lightClass: 'bg-gradient-to-b from-orange-100 via-red-50 to-rose-100', darkClass: 'bg-gradient-to-b from-orange-950/60 via-rose-950/40 to-[#0a0a0a]', pattern: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23f97316\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' },
  { id: 'cool', name: 'Cool Ice', lightClass: 'bg-gradient-to-tr from-cyan-50 via-blue-50 to-indigo-50', darkClass: 'bg-gradient-to-tr from-cyan-950/50 via-blue-950/30 to-[#0a0a0a]', pattern: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0V0zm10 17L3 10l1.5-1.5L10 14l5.5-5.5L17 10l-7 7z\' fill=\'%2306b6d4\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' },
  { id: 'travel', name: 'Travel', lightClass: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50', darkClass: 'bg-gradient-to-br from-emerald-950/40 via-teal-950/30 to-[#0a0a0a]', pattern: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\' viewBox=\'0 0 60 60\'%3E%3Cpath fill=\'%2310b981\' fill-opacity=\'0.15\' d=\'M54.6 0l.8.8v58.4h-58.4l-.8-.8L0 54.6V0h54.6zm-2.5 2.5H4.1v49.6l48-48zM55.9 55.9L8 8v48h47.9z\'/%3E%3C/svg%3E")' },
  { id: 'custom', name: 'Custom Image', lightClass: 'bg-neutral-100', darkClass: 'bg-neutral-900', pattern: 'url("/chat-bg.png")' }
];

const FullScreenEmojiAnimation = ({ emoji }: { emoji: string }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const getAnimationElements = () => {
    switch (emoji) {
      case '❤️': 
        return <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.5, 1.2, 1.8, 1], opacity: [0, 1, 1, 1, 0] }} transition={{ duration: 2.2, ease: "easeInOut" }} className="text-[180px] drop-shadow-2xl will-change-transform">❤️</motion.div>;
      case '😡': 
        return <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 2, 2.5, 2.5, 0], x: [0, -20, 20, -20, 20, 0], opacity: [0, 1, 1, 1, 0] }} transition={{ duration: 2.2, ease: "easeInOut" }} className="text-[180px] drop-shadow-[0_0_60px_rgba(255,0,0,0.8)] will-change-transform">😡</motion.div>;
      case '🫂': 
        return <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 2, 1.7, 2.2, 0], opacity: [0, 1, 1, 1, 0] }} transition={{ duration: 2.5, ease: "easeInOut" }} className="text-[180px] drop-shadow-[0_0_80px_rgba(251,113,133,0.8)] will-change-transform">🫂</motion.div>;
      case '🌸': 
        return [...Array(15)].map((_, i) => (
          <motion.div key={i} initial={{ y: '-10vh', x: `${Math.random() * 100}vw`, opacity: 0, rotate: 0 }} animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360 }} transition={{ duration: 1.5 + Math.random() * 1.5, ease: "linear" }} className="absolute text-5xl drop-shadow-md will-change-transform">🌸</motion.div>
        ));
      case '😂': 
        return [...Array(15)].map((_, i) => (
          <motion.div key={i} initial={{ y: '110vh', x: `${40 + Math.random() * 20}vw`, opacity: 0, scale: 0.5 }} animate={{ y: '-10vh', x: `${10 + Math.random() * 80}vw`, opacity: [0, 1, 1, 0], scale: Math.random() * 1 + 1 }} transition={{ duration: 1.5 + Math.random() * 1, ease: "easeOut" }} className="absolute text-6xl drop-shadow-lg will-change-transform">😂</motion.div>
        ));
      case '🔥': 
        return <motion.div initial={{ y: '20vh', scale: 0.5, opacity: 0 }} animate={{ y: '0vh', scale: [0.5, 2.5, 2, 3, 2], opacity: [0, 1, 1, 1, 0] }} transition={{ duration: 2.2, ease: "easeOut" }} className="text-[200px] drop-shadow-[0_0_50px_rgba(255,100,0,0.8)] will-change-transform">🔥</motion.div>;
      case '✨': 
        return <motion.div initial={{ scale: 0, rotate: -180, opacity: 0 }} animate={{ scale: [0, 2, 1.5, 3, 2], rotate: 0, opacity: [0, 1, 1, 1, 0] }} transition={{ duration: 2.2, ease: "easeInOut" }} className="text-[180px] drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] will-change-transform">✨</motion.div>;
      default: return null;
    }
  };

  return <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">{getAnimationElements()}</div>;
};

const MessageBubble = ({ msg, isMe, socketInstance, currentUser, onEdit, onDelete, onReact, onReply }: any) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  useEffect(() => {
    if (isMe || msg.status === 'seen' || !socketInstance) return;
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        socketInstance.emit('mark_seen', { messageId: msg._id || msg.id, reader: currentUser });
        if (msg._id) fetch('/api/messages/seen', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: msg._id }) }).catch(console.error);
        observer.disconnect(); 
      }
    }, { threshold: 0.5 });
    if (bubbleRef.current) observer.observe(bubbleRef.current);
    return () => observer.disconnect();
  }, [msg, isMe, socketInstance, currentUser]);

  const emojis = ['❤️', '😂', '👍', '🔥', '😢', '🙏'];

  return (
    <motion.div ref={bubbleRef} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex flex-col relative group mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`relative flex items-center gap-2 max-w-[75%] md:max-w-[65%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`absolute top-0 ${isMe ? '-left-24' : '-right-24'} hidden group-hover:flex items-center gap-1 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md rounded-full px-2 py-1 z-20 shadow-sm border border-neutral-200 dark:border-neutral-700`}>
          <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="text-neutral-500 hover:text-pink-500 dark:text-neutral-400 dark:hover:text-pink-400 p-1 transition"><Smile size={14} /></button>
          <button onClick={() => onReply(msg)} className="text-neutral-500 hover:text-blue-500 dark:text-neutral-400 dark:hover:text-blue-400 p-1 transition"><Reply size={14} /></button>
          {isMe && msg.text && <button onClick={() => onEdit(msg)} className="text-neutral-500 hover:text-amber-500 dark:text-neutral-400 dark:hover:text-amber-400 p-1 transition"><Edit2 size={13} /></button>}
          {isMe && <button onClick={() => onDelete(msg._id || msg.id)} className="text-neutral-500 hover:text-rose-500 dark:text-neutral-400 dark:hover:text-rose-400 p-1 transition"><Trash2 size={13} /></button>}
        </div>

        {showReactionPicker && (
          <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1.5 rounded-full shadow-xl z-30`}>
            {emojis.map((emoji) => (
              <button key={emoji} onClick={() => { onReact(msg._id || msg.id, emoji); setShowReactionPicker(false); }} className="hover:scale-125 transition transform text-sm p-1">{emoji}</button>
            ))}
          </div>
        )}

        <div className={`relative px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap ${
            isMe 
              ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white rounded-2xl rounded-br-sm shadow-md' 
              : 'bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-bl-sm border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm'
          }`}>
          
          {msg.replyTo && (
            <div className={`text-xs mb-2 p-2 rounded-lg border-l-4 opacity-90 ${isMe ? 'bg-black/20 border-white/50 text-white' : 'bg-neutral-100 dark:bg-black/40 border-pink-500 dark:text-neutral-300'}`}>
              <span className="font-semibold block text-[11px] mb-0.5">{msg.replyTo.senderName === currentUser ? 'You' : msg.replyTo.senderName}</span>
              <span className="line-clamp-1">{msg.replyTo.text}</span>
            </div>
          )}

          {msg.text && (
            <span className={SPECIAL_EMOJIS.includes(msg.text.trim()) ? "text-4xl" : ""}>{msg.text}</span>
          )}
          
          {msg.isEdited && <span className="text-[10px] opacity-70 ml-1.5 font-normal">(edited)</span>}
          
          {msg.reactions && msg.reactions.length > 0 && (
            <div className={`absolute -bottom-3 ${isMe ? 'right-3' : 'left-3'} flex flex-wrap gap-1 z-10`}>
              {Object.entries(msg.reactions.reduce((acc: any, r: any) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]: any) => (
                <span key={emoji} className="inline-flex items-center gap-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded-full text-xs shadow-sm text-neutral-700 dark:text-white">
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-[10px] text-pink-500 font-bold ml-0.5">{count}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-1 mt-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <span className="text-[10px] font-medium text-neutral-500/80 dark:text-neutral-400/80">{msg.time}</span>
        {isMe && (msg.status === 'seen' ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} className="text-neutral-400" />)}
      </div>
    </motion.div>
  );
};

export default function ChatApp() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [user, setUser] = useState<UserType | null>(null);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [activePartner, setActivePartner] = useState<UserType | null>(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false); 
  const [showSpecialEmojis, setShowSpecialEmojis] = useState(false); 
  
  const [editNameInput, setEditNameInput] = useState('');
  const [selectedEmojiAvatar, setSelectedEmojiAvatar] = useState('😎');
  const [searchQuery, setSearchQuery] = useState('');

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<MessageType | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const avatarEmojis = ['🦊', '🐼', '🐯', '🦁', '🦄', '🚀', '⭐', '💻', '😎', '🔥', '🌸', '⚡', '👑', '🍀'];

  const activePartnerRef = useRef(activePartner);
  const userRef = useRef(user);

  const triggerAnimationRef = useRef((emoji: string) => {});

  useEffect(() => { activePartnerRef.current = activePartner; }, [activePartner]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    triggerAnimationRef.current = (emoji: string) => {
      setActiveAnimation(emoji);
      setTimeout(() => setActiveAnimation(null), 2500); 
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      savedTheme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const savedUser = localStorage.getItem('chat_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setEditNameInput(parsed.name);
      if (parsed.avatar) setSelectedEmojiAvatar(parsed.avatar);
    }

    const savedPartner = localStorage.getItem('chat_active_partner');
    if (savedPartner) {
      setActivePartner(JSON.parse(savedPartner));
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
    newTheme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  };

  const getActiveBg = () => {
    if (!activePartner || !user?.chatBackgrounds) return BACKGROUND_OPTIONS[0];
    const activeBgId = user.chatBackgrounds[activePartner.name] || 'default';
    return BACKGROUND_OPTIONS.find(bg => bg.id === activeBgId) || BACKGROUND_OPTIONS[0];
  };

  const formatLastSeen = (dateString?: string | null) => {
    if (!dateString) return 'Offline';
    return `Last seen at ${new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  };

  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsersList(data.filter((u: UserType) => u.name.toLowerCase() !== user.name.toLowerCase()));
        }
      } catch (err) { console.error("Failed to load users", err); }
    };
    fetchUsers();

    socket = io({ transports: ['websocket', 'polling'] });
    socket.emit('user_connected', user.name);

    socket.on('initial_statuses', (statuses: any) => {
      const statusMap = new Map(statuses);
      setUsersList((prev) => prev.map(u => {
        const status = statusMap.get(u.name);
        return status ? { ...u, isOnline: status.isOnline, lastSeen: status.lastSeen } : u;
      }));
      
      setActivePartner((prev) => {
        if (prev) {
          const status = statusMap.get(prev.name);
          if (status) return { ...prev, isOnline: status.isOnline, lastSeen: status.lastSeen };
        }
        return prev;
      });
    });

    socket.on('user_status_update', (data: any) => {
      setUsersList((prev) => prev.map(u => u.name === data.username ? { ...u, isOnline: data.isOnline, lastSeen: data.lastSeen } : u));
      setActivePartner((prev) => (prev && prev.name === data.username) ? { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen } : prev);
    });

    socket.on('receive_message', (data: MessageType) => {
      const currentPartner = activePartnerRef.current;
      const currentUser = userRef.current;
      if (currentPartner && currentUser) {
        const isExactChat = (data.senderName === currentUser.name && data.recipientName === currentPartner.name) ||
                            (data.senderName === currentPartner.name && data.recipientName === currentUser.name);
        if (isExactChat) {
          setMessages((prev) => prev.some(m => (data._id && m._id === data._id) || m.id === data.id) ? prev : [...prev, data]);
          setPartnerTyping(false);

          const cleanText = data.text.trim();
          if (SPECIAL_EMOJIS.includes(cleanText)) {
            triggerAnimationRef.current(cleanText);
          }
        } else {
          // If message is received for a chat that isn't currently active, update local messages list so the preview updates
          setMessages((prev) => prev.some(m => (data._id && m._id === data._id) || m.id === data.id) ? prev : [...prev, data]);
        }
      } else {
        setMessages((prev) => prev.some(m => (data._id && m._id === data._id) || m.id === data.id) ? prev : [...prev, data]);
      }
    });

    socket.on('message_edited', (updatedMsg: MessageType) => { setMessages((prev) => prev.map(m => (m._id === updatedMsg._id || m.id === updatedMsg.id) ? { ...m, text: updatedMsg.text, isEdited: true } : m)); });
    socket.on('message_deleted', (deletedId: string) => { setMessages((prev) => prev.filter(m => m._id !== deletedId && m.id !== deletedId)); });
    socket.on('reaction_added', (updatedMsg: MessageType) => { setMessages((prev) => prev.map(m => (m._id === updatedMsg._id || m.id === updatedMsg.id) ? { ...m, reactions: updatedMsg.reactions } : m)); });
    socket.on('user_typing', (data: any) => { if (activePartnerRef.current && data.sender === activePartnerRef.current.name) setPartnerTyping(data.isTyping); });
    socket.on('message_seen_update', (data: any) => { setMessages((prev) => prev.map((msg) => (msg._id === data.messageId || msg.id === data.messageId) ? { ...msg, status: 'seen' } : msg)); });

    return () => { if (socket) socket.disconnect(); };
  }, [user?.name]);

  // Fetch all messages for the current user initially so we can calculate previews and unread counts for all chats
  useEffect(() => {
    if (!user) return;
    const fetchAllMessages = async () => {
      try {
        // Fetch users first to iterate and get message history or fetch a general messages route if available.
        // Since our backend has /api/messages?user1=...&user2=..., we can fetch for each partner or fetch all. 
        // Let's fetch messages for all users in the list:
      } catch (err) { console.error(err); }
    };
    fetchAllMessages();
  }, [user?.name]);

  // To make sure previews update dynamically, let's fetch messages for active partner or all partners when user is logged in
  useEffect(() => {
    if (!user) return;
    const fetchAllChatsMessages = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          const otherUsers = data.filter((u: UserType) => u.name.toLowerCase() !== user.name.toLowerCase());
          setUsersList(otherUsers);

          // Fetch messages for each user to populate initial message previews
          for (const partner of otherUsers) {
            const msgRes = await fetch(`/api/messages?user1=${user.name}&user2=${partner.name}`);
            if (msgRes.ok) {
              const partnerMsgs = await msgRes.json();
              setMessages(prev => {
                const existingIds = new Set(prev.map(m => m._id || m.id));
                const newMsgs = partnerMsgs.filter((m: MessageType) => !existingIds.has(m._id || m.id));
                return [...prev, ...newMsgs];
              });
            }
          }
        }
      } catch (err) { console.error(err); }
    };
    fetchAllChatsMessages();
  }, [user?.name]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, partnerTyping, replyingToMessage, isLoadingMessages]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !passwordInput.trim()) { setAuthError('Please fill in all fields.'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: isRegistering ? 'register' : 'login', name: nameInput.trim(), password: passwordInput.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      setUser(data.user); 
      setEditNameInput(data.user.name);
      if (data.user.avatar) setSelectedEmojiAvatar(data.user.avatar);
      
      localStorage.setItem('chat_user', JSON.stringify(data.user));
    } catch (err: any) { setAuthError(err.message); } finally { setAuthLoading(false); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editNameInput.trim()) return;
    try {
      const res = await fetch('/api/users', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userId: user.id, name: editNameInput.trim(), avatar: selectedEmojiAvatar }) 
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user); 
        localStorage.setItem('chat_user', JSON.stringify(data.user)); 
        setShowProfileModal(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateBackground = async (bgId: string) => {
    if (!user || !activePartner) return;
    const updatedBackgrounds = { ...(user.chatBackgrounds || {}), [activePartner.name]: bgId };
    
    const updatedUser = { ...user, chatBackgrounds: updatedBackgrounds };
    setUser(updatedUser);
    localStorage.setItem('chat_user', JSON.stringify(updatedUser));

    try {
      await fetch('/api/users', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userId: user.id, chatBackgrounds: updatedBackgrounds }) 
      });
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { 
    localStorage.removeItem('chat_user'); 
    localStorage.removeItem('chat_active_partner');
    setUser(null); 
    setActivePartner(null); 
    if (socket) socket.disconnect(); 
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !activePartner) return;
    if (editingMessageId) {
      try {
        const res = await fetch('/api/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: editingMessageId, action: 'edit', text: inputText }) });
        const data = await res.json();
        if (data.success) {
          socket.emit('edit_message', data.message);
          setMessages(prev => prev.map(m => (m._id === editingMessageId || m.id === editingMessageId) ? { ...m, text: inputText, isEdited: true } : m));
        }
      } catch (err) { console.error(err); }
      setInputText(''); setEditingMessageId(null); return;
    }

    const tempId = Date.now().toString();
    const cleanText = inputText.trim();

    if (SPECIAL_EMOJIS.includes(cleanText)) {
      triggerAnimationRef.current(cleanText);
    }

    const newMessage: MessageType = {
      id: tempId, senderName: user.name, recipientName: activePartner.name, text: cleanText,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }), 
      status: 'sent', reactions: [],
      replyTo: replyingToMessage ? { id: replyingToMessage._id || replyingToMessage.id, senderName: replyingToMessage.senderName, text: replyingToMessage.text } : undefined
    };

    setMessages((prev) => [...prev, newMessage]);
    socket.emit('send_message', newMessage);
    setInputText(''); setReplyingToMessage(null); 
    socket.emit('typing', { sender: user.name, isTyping: false });

    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMessage) });
      const dbData = await res.json();
      if (dbData.success) setMessages((prev) => prev.map((msg) => msg.id === tempId ? { ...msg, _id: dbData.message._id } : msg));
    } catch (error) { console.error(error); }
  };

  const handleSendSpecialEmoji = async (emoji: string) => {
    if (!user || !activePartner) return;
    
    const tempId = Date.now().toString();
    triggerAnimationRef.current(emoji);

    const newMessage: MessageType = {
      id: tempId, senderName: user.name, recipientName: activePartner.name, text: emoji,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }), 
      status: 'sent', reactions: [],
      replyTo: replyingToMessage ? { id: replyingToMessage._id || replyingToMessage.id, senderName: replyingToMessage.senderName, text: replyingToMessage.text } : undefined
    };

    setMessages((prev) => [...prev, newMessage]);
    socket.emit('send_message', newMessage);
    setReplyingToMessage(null); 
    setShowSpecialEmojis(false);
    socket.emit('typing', { sender: user.name, isTyping: false });

    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMessage) });
      const dbData = await res.json();
      if (dbData.success) setMessages((prev) => prev.map((msg) => msg.id === tempId ? { ...msg, _id: dbData.message._id } : msg));
    } catch (error) { console.error(error); }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' });
      if (res.ok) { socket.emit('delete_message', id); setMessages(prev => prev.filter(m => m._id !== id && m.id !== id)); }
    } catch (err) { console.error(err); }
  };

  const handleStartEdit = (msg: MessageType) => { setInputText(msg.text); setEditingMessageId(msg._id || msg.id); setReplyingToMessage(null); };
  const handleStartReply = (msg: MessageType) => { setReplyingToMessage(msg); setEditingMessageId(null); };
  const handleAddReaction = async (id: string, emoji: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: id, action: 'react', emoji, userName: user.name }) });
      const data = await res.json();
      if (data.success) { socket.emit('add_reaction', data.message); setMessages(prev => prev.map(m => (m._id === id || m.id === id) ? { ...m, reactions: data.message.reactions } : m)); }
    } catch (err) { console.error(err); }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (user && activePartner) socket.emit('typing', { sender: user.name, isTyping: e.target.value.length > 0 });
  };

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 dark:from-[#0a0a0a] dark:to-[#121212] px-4 font-sans overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-pink-500/20 blur-[140px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-500/20 blur-[140px] rounded-full pointer-events-none"></div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white/90 dark:bg-[#141414]/95 backdrop-blur-2xl border border-white/20 dark:border-neutral-800 p-8 rounded-[32px] shadow-2xl space-y-6 relative z-10">
          <button onClick={toggleTheme} className="absolute top-6 right-6 p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition hover:scale-105"><Sun size={18} className="hidden dark:block" /><Moon size={18} className="block dark:hidden" /></button>
          <div className="text-center space-y-2 pt-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{isRegistering ? 'Sign up to start chatting' : 'Log in to your account'}</p>
          </div>
          {authError && <div className="p-3 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-center">{authError}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 px-1 uppercase tracking-wider">Username</label>
              <div className="relative flex items-center">
                <UserIcon size={18} className="absolute left-4 text-neutral-400 z-10" />
                <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Enter your name" className="w-full bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-3.5 pl-12 pr-4 text-[15px] outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all shadow-inner" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 px-1 uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-4 text-neutral-400 z-10" />
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" className="w-full bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-3.5 pl-12 pr-4 text-[15px] outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all shadow-inner" required />
              </div>
            </div>
            <button type="submit" disabled={authLoading} className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-[15px] shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50">{authLoading ? 'Please wait...' : isRegistering ? 'Register' : 'Log In'}</button>
          </form>
          <div className="text-center pt-2">
            <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} className="text-sm font-semibold text-pink-500 hover:underline">{isRegistering ? 'Already have an account? Log in' : "Don't have an account? Register"}</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!activePartner) {
    return (
      <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-neutral-50 via-pink-50/20 to-blue-50/20 dark:from-[#0a0a0a] dark:via-[#120f18] dark:to-[#0a0a0a] text-neutral-900 dark:text-neutral-50 font-sans overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-[#141414]/70 backdrop-blur-2xl z-50 border-b border-neutral-200/60 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setShowProfileModal(true)}>
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 p-[2.5px] shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#141414] overflow-hidden flex items-center justify-center text-2xl">{user.avatar || '😎'}</div>
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#141414] rounded-full"></div>
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight flex items-center gap-1.5 text-neutral-900 dark:text-white">{user.name} <Settings size={14} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" /></h1>
              <p className="text-xs text-emerald-500 font-semibold tracking-wide">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 shadow-sm hover:scale-105 transition-all"><Sun size={18} className="hidden dark:block" /><Moon size={18} className="block dark:hidden" /></button>
            <button onClick={handleLogout} title="Log Out" className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-rose-500 shadow-sm hover:scale-105 transition-all"><LogOut size={18} /></button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-6 py-4 shrink-0 max-w-2xl w-full mx-auto">
          <div className="flex items-center gap-3 bg-white/80 dark:bg-[#141414]/80 backdrop-blur-xl px-5 py-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm focus-within:ring-2 focus-within:ring-pink-500/30 focus-within:border-pink-500 transition-all">
            <Search size={18} className="text-pink-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search chats..." className="bg-transparent w-full text-[15px] outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 font-medium" />
          </div>
        </div>

        {/* WhatsApp-Style Chat List */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 max-w-2xl w-full mx-auto space-y-2 pb-6 scrollbar-hide">
          <div className="px-2 py-1 text-xs font-extrabold uppercase tracking-widest text-pink-500/80">Recent Conversations</div>
          {usersList.length === 0 ? (
            <div className="text-center py-16 text-neutral-400 text-sm bg-white/40 dark:bg-[#141414]/40 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">No other users found. Register another account in a separate tab to chat!</div>
          ) : (
            usersList.filter(partner => partner.name.toLowerCase().includes(searchQuery.toLowerCase())).map((partner) => {
              // Calculate last message & unread count for this partner
              const partnerMessages = messages.filter(m => 
                (m.senderName === user.name && m.recipientName === partner.name) || 
                (m.senderName === partner.name && m.recipientName === user.name)
              );
              const lastMsg = partnerMessages[partnerMessages.length - 1];
              const unreadCount = partnerMessages.filter(m => m.senderName === partner.name && m.status !== 'seen').length;

              return (
                <motion.div 
                  key={partner._id} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { 
                    setActivePartner(partner); 
                    localStorage.setItem('chat_active_partner', JSON.stringify(partner));
                    setSearchQuery(''); 
                  }} 
                  className="flex items-center gap-4 p-4 rounded-3xl bg-white/70 dark:bg-[#141414]/70 backdrop-blur-xl hover:bg-white dark:hover:bg-[#1a1a1a] shadow-sm hover:shadow-md cursor-pointer transition-all border border-neutral-200/60 dark:border-neutral-800/80 group"
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 p-[2.5px] shadow-sm">
                      <div className="w-full h-full rounded-full bg-white dark:bg-[#141414] flex items-center justify-center text-2xl">{partner.avatar || '😎'}</div>
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-[#141414] rounded-full transition-colors ${partner.isOnline ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-600'}`}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="font-bold text-base text-neutral-900 dark:text-white truncate group-hover:text-pink-500 transition-colors">{partner.name}</h2>
                      <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 shrink-0 ml-2">{lastMsg ? lastMsg.time : ''}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-neutral-500 dark:text-neutral-400 truncate pr-2 font-medium">
                        {lastMsg ? (lastMsg.senderName === user.name ? `You: ${lastMsg.text}` : lastMsg.text) : 'Tap to start chatting'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="shrink-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">{unreadCount}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </main>

        {showProfileModal && (
          <div className="fixed inset-0 bg-neutral-900/50 dark:bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="w-full sm:max-w-md bg-white dark:bg-[#141414] border-t sm:border border-neutral-200 dark:border-neutral-800 p-8 rounded-t-[36px] sm:rounded-[32px] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Profile Settings</h2>
                <button onClick={() => setShowProfileModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">✕</button>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 p-[3px] shadow-lg">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#141414] flex items-center justify-center text-4xl">{selectedEmojiAvatar}</div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 mt-2">
                  {avatarEmojis.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => setSelectedEmojiAvatar(emoji)} className={`text-2xl p-2.5 rounded-xl transition-all ${selectedEmojiAvatar === emoji ? 'bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-700 shadow-sm scale-110' : 'hover:bg-neutral-200/50 dark:hover:bg-neutral-800 border border-transparent'}`}>{emoji}</button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 border-t border-neutral-100 dark:border-neutral-800/80 pt-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 px-1 uppercase tracking-wider">Display Name</label>
                  <input type="text" value={editNameInput} onChange={(e) => setEditNameInput(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-2xl py-3.5 px-4 text-[15px] outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all shadow-inner font-medium" required />
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-[15px] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">Close</button>
                  <button type="submit" className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-bold text-[15px] shadow-lg shadow-pink-500/25 hover:opacity-90 active:scale-[0.98] transition-all">Save Profile</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  const activeBg = getActiveBg();

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-50 font-sans transition-colors duration-300 overflow-hidden">
      <header className="shrink-0 flex items-center justify-between px-3 py-3 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl z-50 border-b border-neutral-200 dark:border-neutral-900 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { 
              setActivePartner(null); 
              localStorage.removeItem('chat_active_partner'); 
            }} 
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft size={24} className="text-neutral-600 dark:text-neutral-400" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-blue-400 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#141414] flex items-center justify-center text-base">{activePartner.avatar || '😎'}</div>
            </div>
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-[#0a0a0a] rounded-full ${activePartner.isOnline ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-600'}`}></div>
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-neutral-900 dark:text-white">{activePartner.name}</h1>
            <p className={`text-[11px] font-medium mt-0.5 ${activePartner.isOnline ? 'text-emerald-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {partnerTyping ? 'typing...' : (activePartner.isOnline ? 'Online' : formatLastSeen(activePartner.lastSeen))}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <button onClick={() => setShowBgModal(true)} className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors" title="Chat Settings">
            <Palette size={20} />
          </button>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto relative scrollbar-hide transition-colors duration-500 ${theme === 'dark' ? activeBg.darkClass : activeBg.lightClass}`}>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: activeBg.pattern, backgroundSize: activeBg.id === 'custom' ? 'cover' : 'auto', backgroundPosition: 'center', backgroundAttachment: 'fixed', opacity: theme === 'dark' && activeBg.id !== 'custom' ? 0.6 : 1 }} />

        <div ref={scrollRef} className="relative z-10 px-4 py-6 space-y-4 h-full overflow-y-auto scrollbar-hide">
          {isLoadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <div className="px-4 py-2 bg-white/60 dark:bg-black/50 backdrop-blur-md rounded-full border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
                <p className="text-neutral-600 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider animate-pulse">Syncing chat...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.filter(msg => (msg.senderName === user.name && msg.recipientName === activePartner.name) || (msg.senderName === activePartner.name && msg.recipientName === user.name)).map((msg, index) => (
                <MessageBubble key={msg._id ? `db-${msg._id}` : `temp-${msg.id}-${index}`} msg={msg} isMe={msg.senderName === user.name} socketInstance={socket} currentUser={user.name} onEdit={handleStartEdit} onDelete={handleDeleteMessage} onReact={handleAddReaction} onReply={handleStartReply} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      {activeAnimation && <FullScreenEmojiAnimation emoji={activeAnimation} />}

      {showBgModal && (
        <div className="fixed inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="w-full sm:max-w-md bg-white dark:bg-[#141414] border-t sm:border border-neutral-200 dark:border-neutral-800 p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Chat Background</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">For your chat with {activePartner.name}</p>
              </div>
              <button onClick={() => setShowBgModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {BACKGROUND_OPTIONS.map((bg) => {
                const isActive = (user.chatBackgrounds?.[activePartner.name] || 'default') === bg.id;
                return (
                  <button key={bg.id} onClick={() => handleUpdateBackground(bg.id)} className={`relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${isActive ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 scale-105 shadow-md' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'}`}>
                    <div className={`w-full h-14 rounded-lg shadow-inner relative overflow-hidden ${theme === 'dark' ? bg.darkClass : bg.lightClass} border border-black/5 dark:border-white/5 flex items-center justify-center`}>
                      <div className="absolute inset-0" style={{ backgroundImage: bg.pattern, backgroundSize: bg.id === 'custom' ? 'cover' : 'auto', backgroundPosition: 'center', opacity: theme === 'dark' && bg.id !== 'custom' ? 0.6 : 1 }} />
                      {bg.id === 'custom' && <ImageIcon size={18} className="text-neutral-500 z-10 opacity-70 drop-shadow-md" />}
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">{bg.name}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowBgModal(false)} className="w-full py-3.5 mt-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-[15px] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">Apply Background</button>
          </motion.div>
        </div>
      )}

      <footer className="shrink-0 p-3 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-900 z-40 pb-safe">
        {replyingToMessage && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-2 bg-neutral-50 dark:bg-[#141414] rounded-2xl text-[13px] border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-pink-500 shadow-sm transition-all">
            <div className="flex flex-col truncate pr-2">
              <span className="font-bold text-pink-500 text-[11px] uppercase tracking-wider mb-0.5">Replying to {replyingToMessage.senderName === user.name ? 'Yourself' : replyingToMessage.senderName}</span>
              <span className="text-neutral-700 dark:text-neutral-300 truncate">{replyingToMessage.text}</span>
            </div>
            <button onClick={() => setReplyingToMessage(null)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 transition-colors">✕</button>
          </div>
        )}

        {editingMessageId && (
          <div className="flex items-center justify-between px-4 py-2 mb-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl text-[13px] text-amber-700 dark:text-amber-300">
            <span className="font-medium">Editing message...</span>
            <button onClick={() => { setEditingMessageId(null); setInputText(''); }} className="font-bold hover:underline">Cancel</button>
          </div>
        )}
        
        <div className="relative flex items-end gap-2 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 rounded-[28px] p-1.5 pl-3 pr-1.5 shadow-sm focus-within:ring-2 focus-within:ring-pink-500/20 focus-within:border-pink-500 transition-all">
          
          <AnimatePresence>
            {showSpecialEmojis && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-14 left-0 bg-white/90 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-2.5 rounded-2xl shadow-xl flex gap-1.5 z-50 flex-wrap sm:flex-nowrap"
              >
                {SPECIAL_EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => handleSendSpecialEmoji(emoji)} className="text-2xl sm:text-3xl hover:scale-125 transition-transform p-1.5" title={`Send Magic ${emoji}`}>
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={() => setShowSpecialEmojis(!showSpecialEmojis)} className={`p-2.5 mb-0.5 rounded-full transition-all ${showSpecialEmojis ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-500' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-pink-500'}`} title="Magic Emojis">
            <Sparkles size={20} />
          </button>

          <textarea value={inputText} onChange={handleTyping} onFocus={() => setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 200)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={editingMessageId ? "Edit message..." : "Type a message..."} className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-[15px] text-neutral-900 dark:text-white placeholder:text-neutral-400 scrollbar-hide" rows={1} />
          <motion.button onClick={handleSendMessage} disabled={!inputText.trim()} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-3.5 mb-0.5 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-md transition-all ${!inputText.trim() ? 'opacity-40 cursor-not-allowed shadow-none' : 'hover:opacity-90 active:scale-95'}`}><Send size={18} className="ml-0.5" /></motion.button>
        </div>
      </footer>
    </div>
  );
}