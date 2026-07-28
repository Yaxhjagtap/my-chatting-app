"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, CheckCheck, ChevronLeft, LogOut, Lock, User as UserIcon, Search, Edit2, Trash2, Smile, Settings, Reply } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface ReactionType {
  emoji: string;
  userName: string;
}

interface MessageType {
  _id?: string;
  id: string; 
  senderName: string;
  recipientName: string;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'seen';
  reactions?: ReactionType[];
  isEdited?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

interface UserType {
  _id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
}

let socket: Socket;

const MessageBubble = ({ 
  msg, 
  isMe, 
  socketInstance,
  currentUser,
  onEdit,
  onDelete,
  onReact,
  onReply
}: { 
  msg: MessageType; 
  isMe: boolean; 
  socketInstance: Socket | null;
  currentUser: string;
  onEdit: (msg: MessageType) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (msg: MessageType) => void;
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  useEffect(() => {
    if (isMe || msg.status === 'seen' || !socketInstance) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const actualId = msg._id || msg.id;
          socketInstance.emit('mark_seen', { messageId: actualId, reader: currentUser });
          
          if (msg._id) {
            fetch('/api/messages/seen', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageId: msg._id })
            }).catch(console.error);
          }
          observer.disconnect(); 
        }
      },
      { threshold: 0.5 } 
    );

    if (bubbleRef.current) observer.observe(bubbleRef.current);
    return () => observer.disconnect();
  }, [msg, isMe, socketInstance, currentUser]);

  const emojis = ['❤️', '😂', '👍', '🔥', '😢', '🙏'];

  return (
    <motion.div 
      ref={bubbleRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col relative group mb-4 ${isMe ? 'items-end' : 'items-start'}`}
    >
      <div className={`relative flex items-center gap-2 max-w-[75%] md:max-w-[65%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`absolute top-0 ${isMe ? '-left-24' : '-right-24'} hidden group-hover:flex items-center gap-1 bg-neutral-800/90 backdrop-blur-md rounded-full px-2 py-1 z-20 shadow-lg`}>
          <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="text-neutral-300 hover:text-white p-1 transition" title="React">
            <Smile size={14} />
          </button>
          <button onClick={() => onReply(msg)} className="text-neutral-300 hover:text-white p-1 transition" title="Reply">
            <Reply size={14} />
          </button>
          {isMe && msg.text && (
            <button onClick={() => onEdit(msg)} className="text-neutral-300 hover:text-white p-1 transition" title="Edit">
              <Edit2 size={13} />
            </button>
          )}
          {isMe && (
            <button onClick={() => onDelete(msg._id || msg.id)} className="text-neutral-300 hover:text-rose-400 p-1 transition" title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {showReactionPicker && (
          <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1.5 rounded-full shadow-2xl z-30`}>
            {emojis.map((emoji) => (
              <button 
                key={emoji} 
                onClick={() => { onReact(msg._id || msg.id, emoji); setShowReactionPicker(false); }}
                className="hover:scale-125 transition transform text-sm p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className={`relative px-4 py-2.5 text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
            isMe 
              ? 'bg-gradient-to-br from-pink-500 to-blue-500 text-white rounded-2xl rounded-br-sm' 
              : 'bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-100 rounded-2xl rounded-bl-sm border border-neutral-200/50 dark:border-neutral-800'
          }`}>
          
          {msg.replyTo && (
            <div className={`text-xs mb-2 p-2 rounded-lg border-l-4 opacity-90 ${isMe ? 'bg-black/20 border-white/50 text-white' : 'bg-neutral-200/50 dark:bg-black/20 border-pink-500 dark:text-neutral-300'}`}>
              <span className="font-semibold block text-[11px] mb-0.5">
                {msg.replyTo.senderName === currentUser ? 'You' : msg.replyTo.senderName}
              </span>
              <span className="line-clamp-1">{msg.replyTo.text}</span>
            </div>
          )}

          {msg.text && <span>{msg.text}</span>}
          {msg.isEdited && <span className="text-[10px] opacity-70 ml-1.5 font-normal">(edited)</span>}
          
          {msg.reactions && msg.reactions.length > 0 && (
            <div className={`absolute -bottom-3 ${isMe ? 'right-3' : 'left-3'} flex flex-wrap gap-1 z-10`}>
              {Object.entries(
                msg.reactions.reduce((acc: any, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]: [string, any]) => (
                <span key={emoji} className="inline-flex items-center gap-0.5 bg-neutral-900/95 border border-neutral-700/60 px-1.5 py-0.5 rounded-full text-xs shadow-md text-white">
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-[10px] text-neutral-300 font-medium">{count}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-1 mt-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <span className="text-[10px] font-medium text-neutral-400">{msg.time}</span>
        {isMe && (
          msg.status === 'seen' 
            ? <CheckCheck size={14} className="text-blue-500" />
            : <Check size={14} className="text-neutral-400" />
        )}
      </div>
    </motion.div>
  );
};

export default function ChatApp() {
  const [user, setUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [activePartner, setActivePartner] = useState<UserType | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [selectedEmojiAvatar, setSelectedEmojiAvatar] = useState('😎');
  const [searchQuery, setSearchQuery] = useState('');

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<MessageType | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const avatarEmojis = ['🦊', '🐼', '🐯', '🦁', '🦄', '🚀', '⭐', '💻', '😎', '🔥', '🌸', '⚡', '👑', '🍀'];

  // 👇 FIX: Use refs to access latest user data in sockets without triggering infinite loops
  const activePartnerRef = useRef(activePartner);
  const userRef = useRef(user);

  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('chat_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setEditNameInput(parsed.name);
      if (parsed.avatar) setSelectedEmojiAvatar(parsed.avatar);
    }
  }, []);

  const formatLastSeen = (dateString?: string | null) => {
    if (!dateString) return 'Offline';
    const date = new Date(dateString);
    return `Last seen at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
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
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    fetchUsers();

    socket = io({ transports: ['websocket', 'polling'] });
    socket.emit('user_connected', user.name);

    socket.on('initial_statuses', (statuses: [string, { isOnline: boolean, lastSeen: string | null }][]) => {
      const statusMap = new Map(statuses);
      setUsersList((prev) => prev.map(u => {
        const status = statusMap.get(u.name);
        return status ? { ...u, isOnline: status.isOnline, lastSeen: status.lastSeen } : u;
      }));
    });

    socket.on('user_status_update', (data: { username: string, isOnline: boolean, lastSeen: string | null }) => {
      setUsersList((prev) => prev.map(u => 
        u.name === data.username ? { ...u, isOnline: data.isOnline, lastSeen: data.lastSeen } : u
      ));
      
      setActivePartner((prev) => {
        if (prev && prev.name === data.username) {
          return { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen };
        }
        return prev;
      });
    });

    socket.on('receive_message', (data: MessageType) => {
      // 👇 FIX: Use refs here instead of state objects
      const currentPartner = activePartnerRef.current;
      const currentUser = userRef.current;

      if (currentPartner && currentUser) {
        const isExactCurrentChat = 
          (data.senderName === currentUser.name && data.recipientName === currentPartner.name) ||
          (data.senderName === currentPartner.name && data.recipientName === currentUser.name);

        if (isExactCurrentChat) {
          setMessages((prev) => {
            const exists = prev.some(m => (data._id && m._id === data._id) || m.id === data.id);
            if (exists) return prev;
            return [...prev, data];
          });
          setPartnerTyping(false);
        }
      }
    });

    socket.on('message_edited', (updatedMsg: MessageType) => {
      setMessages((prev) => prev.map(m => (m._id === updatedMsg._id || m.id === updatedMsg.id) ? { ...m, text: updatedMsg.text, isEdited: true } : m));
    });

    socket.on('message_deleted', (deletedId: string) => {
      setMessages((prev) => prev.filter(m => m._id !== deletedId && m.id !== deletedId));
    });

    socket.on('reaction_added', (updatedMsg: MessageType) => {
      setMessages((prev) => prev.map(m => (m._id === updatedMsg._id || m.id === updatedMsg.id) ? { ...m, reactions: updatedMsg.reactions } : m));
    });

    socket.on('user_typing', (data: { sender: string; isTyping: boolean }) => {
      // 👇 FIX: Use refs here too
      const currentPartner = activePartnerRef.current;
      if (currentPartner && data.sender === currentPartner.name) {
        setPartnerTyping(data.isTyping);
      }
    });

    socket.on('message_seen_update', (data: { messageId: string, reader: string }) => {
      setMessages((prev) => 
        prev.map((msg) => 
          (msg._id === data.messageId || msg.id === data.messageId) ? { ...msg, status: 'seen' } : msg
        )
      );
    });

    return () => {
      if (socket) socket.disconnect();
    };
  // 👇 FIX: Strictly limit this useEffect to user.name so it connects only ONCE
  }, [user?.name]);

  useEffect(() => {
    if (!user || !activePartner) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages?user1=${user.name}&user2=${activePartner.name}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  // 👇 FIX: Only run this fetch when the NAMES change, not when the status updates
  }, [activePartner?.name, user?.name]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, partnerTyping, replyingToMessage, isLoadingMessages]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !passwordInput.trim()) {
      setAuthError('Please fill in all fields.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRegistering ? 'register' : 'login',
          name: nameInput.trim(),
          password: passwordInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setUser(data.user);
      setEditNameInput(data.user.name);
      if (data.user.avatar) setSelectedEmojiAvatar(data.user.avatar);
      localStorage.setItem('chat_user', JSON.stringify(data.user));
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
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
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_user');
    setUser(null);
    setActivePartner(null);
    if (socket) socket.disconnect();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !activePartner) return;

    if (editingMessageId) {
      try {
        const res = await fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: editingMessageId, action: 'edit', text: inputText })
        });
        const data = await res.json();
        if (data.success) {
          socket.emit('edit_message', data.message);
          setMessages(prev => prev.map(m => (m._id === editingMessageId || m.id === editingMessageId) ? { ...m, text: inputText, isEdited: true } : m));
        }
      } catch (err) {
        console.error("Failed to edit message", err);
      }
      setInputText('');
      setEditingMessageId(null);
      return;
    }

    const tempId = Date.now().toString();
    const newMessage: MessageType = {
      id: tempId,
      senderName: user.name,
      recipientName: activePartner.name,
      text: inputText,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }), 
      status: 'sent',
      reactions: [],
      replyTo: replyingToMessage ? {
        id: replyingToMessage._id || replyingToMessage.id,
        senderName: replyingToMessage.senderName,
        text: replyingToMessage.text
      } : undefined
    };

    setMessages((prev) => [...prev, newMessage]);
    socket.emit('send_message', newMessage);
    setInputText('');
    setReplyingToMessage(null); 
    socket.emit('typing', { sender: user.name, isTyping: false });

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
      });
      const dbData = await res.json();
      if (dbData.success) {
        setMessages((prev) => 
          prev.map((msg) => msg.id === tempId ? { ...msg, _id: dbData.message._id } : msg)
        );
      }
    } catch (error) {
      console.error("Failed to save message", error);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        socket.emit('delete_message', id);
        setMessages(prev => prev.filter(m => m._id !== id && m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const handleStartEdit = (msg: MessageType) => {
    setInputText(msg.text);
    setEditingMessageId(msg._id || msg.id);
    setReplyingToMessage(null); 
  };

  const handleStartReply = (msg: MessageType) => {
    setReplyingToMessage(msg);
    setEditingMessageId(null); 
  };

  const handleAddReaction = async (id: string, emoji: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id, action: 'react', emoji, userName: user.name })
      });
      const data = await res.json();
      if (data.success) {
        socket.emit('add_reaction', data.message);
        setMessages(prev => prev.map(m => (m._id === id || m.id === id) ? { ...m, reactions: data.message.reactions } : m));
      }
    } catch (err) {
      console.error("Failed to react", err);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (user && activePartner) {
      socket.emit('typing', { sender: user.name, isTyping: e.target.value.length > 0 });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[100svh] bg-[#0a0a0a] text-neutral-50 px-4 font-sans">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="text-xs text-neutral-400">{isRegistering ? 'Register to start messaging' : 'Log in to your account'}</p>
          </div>

          {authError && (
            <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400 px-1">Username</label>
              <div className="relative flex items-center">
                <UserIcon size={16} className="absolute left-3 text-neutral-500 z-10" />
                <input 
                  type="text" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name" 
                  className="w-full bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-pink-500 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400 px-1">Password</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3 text-neutral-500 z-10" />
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-pink-500 transition"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={authLoading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-medium text-sm shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {authLoading ? 'Please wait...' : isRegistering ? 'Register' : 'Log In'}
            </button>
          </form>

          <div className="text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} className="text-xs text-neutral-400 hover:text-neutral-200 transition">
              {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Register"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!activePartner) {
    return (
      <div className="flex flex-col h-[100svh] bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-50 font-sans relative">
        <header className="flex items-center justify-between px-4 py-4 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-100 dark:border-neutral-900 shadow-sm">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfileModal(true)}>
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-neutral-100 dark:bg-black overflow-hidden flex items-center justify-center text-xl">
                  {user.avatar || '😎'}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0a0a0a] rounded-full"></div>
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight flex items-center gap-1.5">
                {user.name} <Settings size={14} className="text-neutral-400" />
              </h1>
              <p className="text-xs text-emerald-500 font-medium">Online</p>
            </div>
          </div>
          <button onClick={handleLogout} title="Log Out" className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition">
            <LogOut size={20} />
          </button>
        </header>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 px-3.5 py-2.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800">
            <Search size={18} className="text-neutral-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..." 
              className="bg-transparent w-full text-sm outline-none text-neutral-900 dark:text-white placeholder:text-neutral-500" 
            />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Chats</div>
          {usersList.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-sm">No other users found. Register another account in a separate tab to chat!</div>
          ) : (
            usersList
              .filter(partner => partner.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((partner) => (
                <div 
                  key={partner._id}
                  onClick={() => {
                    setActivePartner(partner);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-900/60 cursor-pointer transition"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 to-blue-400 p-[2px]">
                      <div className="w-full h-full rounded-full bg-neutral-100 dark:bg-black flex items-center justify-center text-xl">
                        {partner.avatar || '😎'}
                      </div>
                    </div>
                    {partner.isOnline ? (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0a0a0a] rounded-full"></div>
                    ) : (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-neutral-500 border-2 border-white dark:border-[#0a0a0a] rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 border-b border-neutral-100 dark:border-neutral-900 pb-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-base">{partner.name}</h2>
                      {partner.isOnline ? (
                        <span className="text-[11px] text-emerald-500">Online</span>
                      ) : (
                        <span className="text-[11px] text-neutral-500">Offline</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">Tap to open conversation</p>
                  </div>
                </div>
            ))
          )}
          {usersList.length > 0 && usersList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="text-center py-12 text-neutral-500 text-sm">No chats match "{searchQuery}"</div>
          )}
        </main>

        {showProfileModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Edit Profile</h2>
                <button onClick={() => setShowProfileModal(false)} className="text-neutral-400 hover:text-white">✕</button>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 p-[3px] shadow-lg">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-3xl">
                    {selectedEmojiAvatar}
                  </div>
                </div>
                <span className="text-xs text-neutral-400">Choose your avatar emoji</span>
                
                <div className="grid grid-cols-7 gap-2 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                  {avatarEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmojiAvatar(emoji)}
                      className={`text-xl p-2 rounded-xl transition ${selectedEmojiAvatar === emoji ? 'bg-pink-500/20 border border-pink-500 scale-110' : 'hover:bg-neutral-800'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400 px-1">Display Name</label>
                  <input 
                    type="text" 
                    value={editNameInput} 
                    onChange={(e) => setEditNameInput(e.target.value)} 
                    style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}
                    className="w-full border border-neutral-800 rounded-2xl py-3 px-4 text-sm outline-none focus:border-pink-500 transition"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3 rounded-2xl bg-neutral-800 text-neutral-300 font-medium text-sm hover:bg-neutral-700 transition">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-medium text-sm shadow-lg hover:opacity-90 transition">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100svh] bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-50 font-sans">
      <header className="flex items-center justify-between px-3 py-3 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-100 dark:border-neutral-900 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setActivePartner(null)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            <ChevronLeft size={24} className="text-neutral-600 dark:text-neutral-300" />
          </button>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-400 to-blue-400 p-[2px]">
              <div className="w-full h-full rounded-full bg-neutral-100 dark:bg-black flex items-center justify-center text-sm">
                {activePartner.avatar || '😎'}
              </div>
            </div>
            {activePartner.isOnline ? (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0a0a0a] rounded-full"></div>
            ) : (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neutral-500 border-2 border-white dark:border-[#0a0a0a] rounded-full"></div>
            )}
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight">{activePartner.name}</h1>
            <p className={`text-[11px] font-medium ${activePartner.isOnline ? 'text-emerald-500' : 'text-neutral-400'}`}>
              {partnerTyping ? 'typing...' : (activePartner.isOnline ? 'Online' : formatLastSeen(activePartner.lastSeen))}
            </p>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {isLoadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-neutral-500 text-sm font-medium animate-pulse">Loading chats...</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages
              .filter(msg => 
                (msg.senderName === user.name && msg.recipientName === activePartner.name) ||
                (msg.senderName === activePartner.name && msg.recipientName === user.name)
              )
              .map((msg, index) => (
              <MessageBubble 
                key={msg._id ? `db-${msg._id}` : `temp-${msg.id}-${index}`} 
                msg={msg} 
                isMe={msg.senderName === user.name} 
                socketInstance={socket} 
                currentUser={user.name}
                onEdit={handleStartEdit}
                onDelete={handleDeleteMessage}
                onReact={handleAddReaction}
                onReply={handleStartReply}
              />
            ))}
          </AnimatePresence>
        )}
      </main>

      <footer className="p-3 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-neutral-100 dark:border-neutral-900 sticky bottom-0 z-40 pb-safe">
        {replyingToMessage && (
          <div className="flex items-center justify-between px-3 py-2 mb-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl text-sm border-l-4 border-pink-500 transition-all">
            <div className="flex flex-col truncate pr-2">
              <span className="font-semibold text-pink-500 text-[11px] uppercase tracking-wider mb-0.5">
                Replying to {replyingToMessage.senderName === user.name ? 'Yourself' : replyingToMessage.senderName}
              </span>
              <span className="text-neutral-600 dark:text-neutral-400 text-xs truncate">{replyingToMessage.text}</span>
            </div>
            <button onClick={() => setReplyingToMessage(null)} className="text-neutral-400 hover:text-white p-1 transition">✕</button>
          </div>
        )}

        {editingMessageId && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-neutral-800/50 rounded-xl text-xs text-neutral-300">
            <span>Editing message...</span>
            <button onClick={() => { setEditingMessageId(null); setInputText(''); }} className="text-rose-400 hover:underline">Cancel</button>
          </div>
        )}
        
        <div className="flex items-end gap-2 bg-neutral-100 dark:bg-neutral-900 rounded-3xl p-1.5 pr-3 focus-within:ring-2 focus-within:ring-pink-500/20 transition-all">
          <textarea 
            value={inputText} 
            onChange={handleTyping}
            onFocus={() => {
              setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }, 200);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-3 text-[15px] text-neutral-900 dark:text-white placeholder:text-neutral-500 scrollbar-hide" 
            rows={1}
          />

          <motion.button 
            onClick={handleSendMessage} 
            disabled={!inputText.trim()}
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className={`p-3 mb-0.5 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-md transition ${!inputText.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            <Send size={18} className="ml-0.5" />
          </motion.button>
        </div>
      </footer>
    </div>
  );
}