import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Bell, User, Send, ArrowLeft, LogOut, UserPlus, Users, Smile, Paperclip, Sun, Moon, UserCheck } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import {
  getChats,
  getMessages,
  sendMessage,
  getUsers,
  createChat,
  createGroupChat,
  getUserProfile,
  markMessagesAsRead,
  searchUsers,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
} from '../api/chatApi';
import { getCommunities, createCommunity, joinCommunity, leaveCommunity } from '../api/communityApi';
import { getEvents, createEvent, rsvpEvent } from '../api/eventApi';
import { updateUserProfile, completeOnboarding } from '../api/userApi';
import { getUpdates, createUpdate } from '../api/updateApi';
import { sendAiMessage } from '../api/aiApi';
import { connectSocket, disconnectSocket, joinChat, sendMessageSocket, onReceiveMessage, offReceiveMessage, emitUserOnline, onUserStatusChange, offUserStatusChange, emitTypingStart, emitTypingStop, onUserTyping, offUserTyping, emitMessagesRead, onMessagesRead, offMessagesRead } from '../api/socket';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorSize, setCursorSize] = useState(40);

  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Chat state
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // New chat modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] });
  const [activeChatModalTab, setActiveChatModalTab] = useState('friends');
  const [friendActionLoading, setFriendActionLoading] = useState('');
  const [chatActionError, setChatActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  // Online status
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState({});

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageInputRef = useRef(null);
  const chatSearchInputRef = useRef(null);

  // Typing timeout
  const typingTimeoutRef = useRef(null);

  // Communities & Events State
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // New Community Form State
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newCommunityCategory, setNewCommunityCategory] = useState('general');

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('Online');

  // AI & Updates State
  const [aiMessages, setAiMessages] = useState([{ role: 'ai', content: 'Hello! I am your AI assistant. How can I help you today?' }]);
  const [aiInput, setAiInput] = useState('');
  const [updates, setUpdates] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiAllowChatAccess, setAiAllowChatAccess] = useState(false);
  const [aiTargetLanguage, setAiTargetLanguage] = useState('Hindi');
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [messageTranslationLoadingId, setMessageTranslationLoadingId] = useState('');
  const [aiError, setAiError] = useState('');

  // Settings State
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState(''); // New State
  const [previewImage, setPreviewImage] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('cohortTheme') || 'dark');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    name: '',
    whoAmI: '',
    aboutInfo: '',
    education: '',
    interests: ''
  });

  // Load chats on component mount
  useEffect(() => {
    loadChats();
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const savedChatAccess = localStorage.getItem('aiAllowChatAccess');
    const savedLanguage = localStorage.getItem('aiTargetLanguage');

    if (savedChatAccess !== null) {
      setAiAllowChatAccess(savedChatAccess === 'true');
    }
    if (savedLanguage) {
      setAiTargetLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aiAllowChatAccess', String(aiAllowChatAccess));
  }, [aiAllowChatAccess]);

  useEffect(() => {
    localStorage.setItem('aiTargetLanguage', aiTargetLanguage);
  }, [aiTargetLanguage]);

  useEffect(() => {
    localStorage.setItem('cohortTheme', theme);
    document.body.dataset.theme = theme;
  }, [theme]);

  // Listen for real-time messages
  useEffect(() => {
    onReceiveMessage((message) => {
      if (selectedChat && message.chat === selectedChat._id) {
        setMessages(prev => [...prev, message]);
      }
      // Update chat list to show new message
      loadChats();
    });

    return () => {
      offReceiveMessage();
    };
  }, [selectedChat]);

  // Load messages when chat is selected and mark as read
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
      joinChat(selectedChat._id);

      // Mark messages as read
      markMessagesAsRead(selectedChat._id);
      const userId = localStorage.getItem('userId');
      emitMessagesRead(selectedChat._id, userId);
    }
  }, [selectedChat]);



  // Load Communities & Events & Updates
  useEffect(() => {
    if (activeTab === 'communities') {
      loadCommunities();
    } else if (activeTab === 'events') {
      loadEvents();
    } else if (activeTab === 'updates') {
      loadUpdates();
    }
  }, [activeTab]);

  const loadUpdates = async () => {
    try {
      const data = await getUpdates();
      setUpdates(data);
    } catch (error) {
      console.error('Failed to load updates', error);
    }
  };

  const getLastAiUserMessage = () => {
    const lastUserMsg = [...aiMessages].reverse().find(msg => msg.role === 'user');
    return lastUserMsg?.content || '';
  };

  const sendAiRequest = async ({ content, mode = 'chat', targetLanguage }) => {
    setAiError('');
    setIsAiTyping(true);
    try {
      const res = await sendAiMessage(content, {
        includeChats: aiAllowChatAccess,
        mode,
        targetLanguage
      });
      setIsAiTyping(false);
      setAiMessages(prev => [...prev, { role: 'ai', content: res.reply }]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Sorry, I encountered an error.';
      setIsAiTyping(false);
      setAiError(errorMessage);
      setAiMessages(prev => [...prev, { role: 'ai', content: `Sorry, I encountered an error: ${errorMessage}` }]);
    }
  };

  const handleAiSend = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');

    await sendAiRequest({ content: userMsg.content, mode: 'chat' });
  };

  const handleAiTranslate = async () => {
    const sourceText = aiInput.trim() || getLastAiUserMessage();
    if (!sourceText) {
      setAiMessages(prev => [...prev, { role: 'ai', content: 'Add text to translate, or send a message first.' }]);
      return;
    }

    const userMsg = { role: 'user', content: `Translate to ${aiTargetLanguage}: ${sourceText}` };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');

    await sendAiRequest({
      content: sourceText,
      mode: 'translate',
      targetLanguage: aiTargetLanguage
    });
  };

  const handleAiQuickAction = async (prompt, requiresChatAccess = false) => {
    if (requiresChatAccess && !aiAllowChatAccess) {
      setAiMessages(prev => [...prev, { role: 'ai', content: 'Enable chat access to use this feature.' }]);
      return;
    }

    const userMsg = { role: 'user', content: prompt };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');

    await sendAiRequest({ content: prompt, mode: 'chat' });
  };

  const handleTranslateChatMessage = async (msg) => {
    if (!msg?.content || messageTranslationLoadingId) return;

    setMessageTranslationLoadingId(msg._id);
    try {
      const res = await sendAiMessage(msg.content, {
        includeChats: false,
        mode: 'translate',
        targetLanguage: aiTargetLanguage
      });

      setTranslatedMessages(prev => ({
        ...prev,
        [msg._id]: {
          language: aiTargetLanguage,
          text: res.reply
        }
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Translation failed';
      setTranslatedMessages(prev => ({
        ...prev,
        [msg._id]: {
          language: aiTargetLanguage,
          text: `Translation failed: ${errorMessage}`
        }
      }));
    } finally {
      setMessageTranslationLoadingId('');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editName || currentUser.name);
      formData.append('username', editUsername || currentUser.username); // Append Username
      formData.append('bio', editBio);
      if (profileFile) {
        formData.append('profilePic', profileFile);
      }

      const updatedUser = await updateUserProfile(formData);
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowSettings(false);
      // Optional: Show success notification
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  const handleCreateUpdate = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('content', 'New update'); // Simple content for now
        await createUpdate(formData);
        loadUpdates();
      } catch (error) {
        console.error('Failed to create update', error);
      }
    };
    input.click();
  };

  const loadCommunities = async () => {
    try {
      const data = await getCommunities();
      setCommunities(data);
    } catch (error) {
      console.error('Failed to load communities', error);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events', error);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      await createCommunity({
        name: newCommunityName,
        description: newCommunityDesc,
        category: newCommunityCategory
      });
      setShowCommunityModal(false);
      setNewCommunityName('');
      setNewCommunityDesc('');
      loadCommunities();
    } catch (error) {
      console.error('Failed to create community', error);
    }
  };

  const handleJoinCommunity = async (id) => {
    try {
      await joinCommunity(id);
      loadCommunities();
    } catch (error) {
      console.error('Failed to join community', error);
    }
  };

  const handleLeaveCommunity = async (id) => {
    try {
      await leaveCommunity(id);
      loadCommunities();
    } catch (error) {
      console.error('Failed to leave community', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await createEvent({
        title: newEventTitle,
        description: newEventDesc,
        date: newEventDate,
        location: newEventLocation
      });
      setShowEventModal(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventDate('');
      loadEvents();
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  const handleRsvpEvent = async (id) => {
    try {
      await rsvpEvent(id);
      loadEvents();
    } catch (error) {
      console.error('Failed to RSVP', error);
    }
  };

  // Listen for read receipts
  useEffect(() => {
    onMessagesRead(({ chatId, userId }) => {
      // If we are in this chat, update message statuses
      if (selectedChat && selectedChat._id === chatId) {
        setMessages(prev => prev.map(msg => {
          // If message is ours and not read, mark as read
          if (msg.sender._id === localStorage.getItem('userId') && msg.status !== 'read') {
            return { ...msg, status: 'read' };
          }
          return msg;
        }));
      }
    });

    return () => {
      offMessagesRead();
    };
  }, [selectedChat]);

  // Emit user online status on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      emitUserOnline(userId);
    }
  }, []);

  // Listen for online status changes
  useEffect(() => {
    onUserStatusChange(({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    return () => {
      offUserStatusChange();
    };
  }, []);

  // Listen for typing indicators
  useEffect(() => {
    onUserTyping(({ userId, userName, isTyping }) => {
      if (selectedChat) {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping ? userName : null
        }));
      }
    });

    return () => {
      offUserTyping();
    };
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      const data = await getChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const data = await getMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const message = await sendMessage(selectedChat._id, newMessage);
      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Send via socket for real-time delivery
      sendMessageSocket(selectedChat._id, message);

      // Refresh chat list
      loadChats();

      // Stop typing indicator
      const userId = localStorage.getItem('userId');
      emitTypingStop(selectedChat._id, userId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle typing with debounce
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedChat) return;

    const userId = localStorage.getItem('userId');
    const userName = currentUser?.name || 'User';

    // Emit typing start
    emitTypingStart(selectedChat._id, userId, userName);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to emit typing stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(selectedChat._id, userId);
    }, 3000);
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.name;
    const currentUserId = localStorage.getItem('userId');
    const otherUser = chat.participants.find(p => p._id !== currentUserId);
    return otherUser?.name || 'Unknown';
  };

  const getChatAvatar = (chat) => {
    if (!chat?.isGroup) {
      const currentUserId = localStorage.getItem('userId');
      const otherUser = chat.participants.find((p) => p._id !== currentUserId);
      if (otherUser?.profilePic) {
        return <img src={getAvatarUrl(otherUser.profilePic)} alt={otherUser.name} className="avatar-img" />;
      }
    }
    const name = getChatName(chat);
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleGlobalSearchClick = () => {
    setActiveTab('chats');
    setTimeout(() => {
      chatSearchInputRef.current?.focus();
    }, 50);
  };

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { user } = await getUserProfile();
        setCurrentUser(user);
        setOnboardingForm({
          name: user.name || '',
          whoAmI: user.whoAmI || '',
          aboutInfo: user.aboutInfo || '',
          education: user.education || '',
          interests: (user.interests || []).join(', ')
        });
        setShowOnboarding(!user.onboardingCompleted);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };
    loadUserProfile();
  }, []);

  const getAvatarUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    disconnectSocket();
    navigate('/login');
  };

  const loadFriendsAndRequests = async () => {
    try {
      const users = await getUsers();
      setAllUsers(users);
      const requests = await getFriendRequests();
      setFriendRequests(requests);
    } catch (error) {
      console.error('Failed to load users/requests:', error);
    }
  };

  const loadDiscoverUsers = async (query = '') => {
    try {
      const users = await searchUsers(query);
      setDiscoverUsers(users);
    } catch (error) {
      console.error('Failed to discover users:', error);
    }
  };

  const handleSendFriendRequest = async (username) => {
    setChatActionError('');
    setFriendActionLoading(username);
    try {
      await sendFriendRequest(username);
      await loadFriendsAndRequests();
      await loadDiscoverUsers(searchQuery);
    } catch (error) {
      setChatActionError(error.response?.data?.message || 'Could not send friend request.');
    } finally {
      setFriendActionLoading('');
    }
  };

  const handleAcceptRequest = async (userId) => {
    setFriendActionLoading(userId);
    try {
      await acceptFriendRequest(userId);
      await loadFriendsAndRequests();
      await loadDiscoverUsers(searchQuery);
    } catch (error) {
      setChatActionError(error.response?.data?.message || 'Could not accept request.');
    } finally {
      setFriendActionLoading('');
    }
  };

  const handleRejectRequest = async (userId) => {
    setFriendActionLoading(userId);
    try {
      await rejectFriendRequest(userId);
      await loadFriendsAndRequests();
      await loadDiscoverUsers(searchQuery);
    } catch (error) {
      setChatActionError(error.response?.data?.message || 'Could not reject request.');
    } finally {
      setFriendActionLoading('');
    }
  };

  const handleSaveOnboarding = async (e) => {
    e.preventDefault();
    try {
      await completeOnboarding({
        ...onboardingForm,
        interests: onboardingForm.interests
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      });
      const { user } = await getUserProfile();
      setCurrentUser(user);
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to save onboarding:', error);
    }
  };

  // Open new chat modal
  const handleNewChat = async () => {
    await loadFriendsAndRequests();
    await loadDiscoverUsers('');
    setActiveChatModalTab('friends');
    setChatActionError('');
    setShowNewChatModal(true);
  };

  // Create 1-on-1 chat
  const handleCreateChat = async (userId) => {
    try {
      const chat = await createChat(userId);
      setShowNewChatModal(false);
      setSearchQuery('');
      await loadChats();
      setSelectedChat(chat);
    } catch (error) {
      setChatActionError(error.response?.data?.message || 'Failed to create chat.');
      console.error('Failed to create chat:', error);
    }
  };

  // Open group chat modal
  const handleNewGroupChat = async () => {
    await loadFriendsAndRequests();
    setShowGroupChatModal(true);
  };

  // Toggle user selection for group
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Create group chat
  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) {
      alert('Please enter a group name and select at least 2 users');
      return;
    }
    try {
      const chat = await createGroupChat(groupName, selectedUsers);
      setShowGroupChatModal(false);
      setGroupName('');
      setSelectedUsers([]);
      setSearchQuery('');
      await loadChats();
      setSelectedChat(chat);
    } catch (error) {
      console.error('Failed to create group chat:', error);
    }
  };

  // Filter users based on search with smart prioritization
  const filteredUsers = allUsers
    .filter(user =>
      user.relationship === 'friend' &&
      (
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    .sort((a, b) => {
      const query = searchQuery.toLowerCase();

      // Prioritize exact username matches
      const aUsernameMatch = a.username.toLowerCase() === query;
      const bUsernameMatch = b.username.toLowerCase() === query;
      if (aUsernameMatch && !bUsernameMatch) return -1;
      if (!aUsernameMatch && bUsernameMatch) return 1;

      // Then prioritize username starts with
      const aUsernameStarts = a.username.toLowerCase().startsWith(query);
      const bUsernameStarts = b.username.toLowerCase().startsWith(query);
      if (aUsernameStarts && !bUsernameStarts) return -1;
      if (!aUsernameStarts && bUsernameStarts) return 1;

      // Then prioritize name starts with
      const aNameStarts = a.name.toLowerCase().startsWith(query);
      const bNameStarts = b.name.toLowerCase().startsWith(query);
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;

      // Finally alphabetical by username
      return a.username.localeCompare(b.username);
    });

  const filteredChats = chats.filter((chat) => {
    const query = chatSearchQuery.trim().toLowerCase();
    if (!query) return true;
    const chatName = getChatName(chat).toLowerCase();
    const lastMessage = (chat.lastMessage?.content || '').toLowerCase();
    return chatName.includes(query) || lastMessage.includes(query);
  });

  const filteredDiscoverUsers = discoverUsers
    .filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  useEffect(() => {
    if (!showNewChatModal || activeChatModalTab !== 'discover') return;
    const timer = setTimeout(() => {
      loadDiscoverUsers(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, showNewChatModal, activeChatModalTab]);

  // Helper to highlight matching text
  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
      <>
        {before}
        <span style={{ fontWeight: '700', color: 'rgba(255, 255, 255, 0.95)' }}>{match}</span>
        {after}
      </>
    );
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    const input = messageInputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = newMessage;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + emojiObject.emoji + after;

      setNewMessage(newText);
      setShowEmojiPicker(false);

      // Set cursor position after emoji
      setTimeout(() => {
        input.focus();
        const newPosition = start + emojiObject.emoji.length;
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };


  return (
    <div className={`home-page ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-container">
          <div className="nav-left">
            <h1 className="app-logo">cohort</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-center">
            {['chats', 'ai', 'communities', 'updates', 'events'].map(tab => (
              <button
                key={tab}
                className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="nav-right">
            <button
              className="icon-btn"
              onClick={handleGlobalSearchClick}
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
              title="Search chats"
            >
              <Search size={20} />
            </button>
            <button
              className="icon-btn"
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
            >
              <Bell size={20} />
            </button>
            <button
              className="icon-btn"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="profile-btn"
              onClick={() => setShowSettings(!showSettings)}
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
            >
              <User size={18} />
              <span>profile</span>
            </button>
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          {['chats', 'ai', 'communities', 'updates', 'events'].map(tab => (
            <button
              key={tab}
              className={`mobile-nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">

        {/* Chats Section */}
        {activeTab === 'chats' && (
          <div className="section-content">
            <div className="section-header">
              <h2>chats</h2>
              <button
                className="action-btn"
                onClick={handleNewChat}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                new chat
              </button>
            </div>

            <div className="search-bar">
              <input
                ref={chatSearchInputRef}
                type="text"
                placeholder="search conversations..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="chat-list">
              {filteredChats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' }}>
                  <p>{chatSearchQuery ? 'No chats match your search.' : 'No chats yet. Start a new conversation!'}</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat._id}
                    className="chat-item"
                    onClick={() => setSelectedChat(chat)}
                    onMouseEnter={() => setCursorSize(70)}
                    onMouseLeave={() => setCursorSize(40)}
                  >
                    <div className="chat-avatar">
                      {getChatAvatar(chat)}
                    </div>
                    <div className="chat-info">
                      <div className="chat-top">
                        <h3>{getChatName(chat)}</h3>
                        <span className="chat-time">
                          {chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <div className="chat-bottom">
                        <p className="chat-message">
                          {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                        </p>
                        {chat.unreadCount > 0 && (
                          <div className="unread-badge">{chat.unreadCount}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Window */}
            {selectedChat && (
              <div className="chat-window">
                <div className="chat-window-header">
                  <button
                    className="back-btn"
                    onClick={() => setSelectedChat(null)}
                    onMouseEnter={() => setCursorSize(60)}
                    onMouseLeave={() => setCursorSize(40)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="chat-window-info">
                    <div className="chat-avatar-small">
                      {getChatAvatar(selectedChat)}
                      {/* Online status indicator */}
                      {!selectedChat.isGroupChat && selectedChat.participants && (
                        (() => {
                          const otherUser = selectedChat.participants.find(p => p._id !== localStorage.getItem('userId'));
                          return otherUser && onlineUsers.has(otherUser._id) && (
                            <div className="online-indicator"></div>
                          );
                        })()
                      )}
                    </div>
                    <div>
                      <h3>{getChatName(selectedChat)}</h3>
                      {!selectedChat.isGroupChat && selectedChat.participants && (
                        (() => {
                          const otherUser = selectedChat.participants.find(p => p._id !== localStorage.getItem('userId'));
                          return otherUser && onlineUsers.has(otherUser._id) && (
                            <span className="online-status-text">online</span>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>

                <div className="messages-container">
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const currentUserId = localStorage.getItem('userId');
                      const isOwn = msg.sender._id === currentUserId;
                      return (
                        <div
                          key={msg._id}
                          className={`message ${isOwn ? 'own' : 'other'}`}
                        >
                          <div className="message-content">
                            {!isOwn && <span className="message-sender">{msg.sender.name}</span>}
                            <p>{msg.content}</p>
                            <div className="message-tools">
                              <button
                                type="button"
                                className="message-translate-btn"
                                onClick={() => handleTranslateChatMessage(msg)}
                                disabled={messageTranslationLoadingId === msg._id}
                              >
                                {messageTranslationLoadingId === msg._id ? 'translating...' : `translate to ${aiTargetLanguage.toLowerCase()}`}
                              </button>
                            </div>
                            {translatedMessages[msg._id] && (
                              <div className="translated-message">
                                <span className="translated-label">{translatedMessages[msg._id].language}:</span>
                                <p>{translatedMessages[msg._id].text}</p>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <span className="message-time">{formatTime(msg.createdAt)}</span>
                              {isOwn && (
                                <span className={`message-status ${msg.status === 'read' ? 'status-read' : msg.status === 'delivered' ? 'status-delivered' : 'status-sent'}`}>
                                  {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {Object.values(typingUsers).filter(Boolean).length > 0 && (
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="typing-text">
                        {Object.values(typingUsers).filter(Boolean).join(', ')} {Object.values(typingUsers).filter(Boolean).length === 1 ? 'is' : 'are'} typing...
                      </span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="message-input-form">
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="emoji-picker-container">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme="dark"
                        width="100%"
                        height="350px"
                      />
                    </div>
                  )}

                  <div className="input-actions-left">
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => document.getElementById('file-upload').click()}
                      onMouseEnter={() => setCursorSize(60)}
                      onMouseLeave={() => setCursorSize(40)}
                      title="Attach file"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      type="file"
                      id="file-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => console.log('File selected:', e.target.files[0])}
                    />
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      onMouseEnter={() => setCursorSize(60)}
                      onMouseLeave={() => setCursorSize(40)}
                      title="Add emoji"
                    >
                      <Smile size={20} />
                    </button>
                  </div>

                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="message-input"
                    onMouseEnter={() => setCursorSize(60)}
                    onMouseLeave={() => setCursorSize(40)}
                  />
                  <button
                    type="submit"
                    className="send-message-btn"
                    onMouseEnter={() => setCursorSize(60)}
                    onMouseLeave={() => setCursorSize(40)}
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* AI Section */}
        {activeTab === 'ai' && (
          <div className="section-content">
            <div className="section-header ai-header">
              <div>
                <h2>ai assistant</h2>
                <p className="ai-subtitle">chat, translate, and summarize with your permission</p>
              </div>
              <div className="ai-header-controls">
                <label className={`ai-toggle ${aiAllowChatAccess ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={aiAllowChatAccess}
                    onChange={(e) => setAiAllowChatAccess(e.target.checked)}
                  />
                  <span className="ai-toggle-slider"></span>
                  <span className="ai-toggle-label">allow chat access</span>
                </label>
                <button
                  type="button"
                  className="ai-reset-btn"
                  onClick={() => {
                    setAiMessages([{ role: 'ai', content: 'Hello! I am your AI assistant. How can I help you today?' }]);
                    setAiError('');
                  }}
                  disabled={isAiTyping}
                >
                  clear chat
                </button>
              </div>
            </div>
            <div className="ai-status-row">
              <span className={`ai-status-pill ${aiAllowChatAccess ? 'open' : 'closed'}`}>
                chat context: {aiAllowChatAccess ? 'enabled' : 'disabled'}
              </span>
              <span className="ai-status-pill">translation: {aiTargetLanguage}</span>
              <span className="ai-status-pill">provider: Gemini</span>
            </div>
            {aiError && (
              <div className="ai-error-banner">
                {aiError}
              </div>
            )}

            <div className="ai-quick-actions">
              <button
                className="quick-action-btn"
                onClick={() => handleAiQuickAction('Summarize my recent chats and highlight anything I missed.', true)}
                disabled={!aiAllowChatAccess || isAiTyping}
              >
                <div className="action-label">summarize recent chats</div>
              </button>
              <button
                className="quick-action-btn"
                onClick={() => handleAiQuickAction('Draft a friendly reply to the latest chat message.', true)}
                disabled={!aiAllowChatAccess || isAiTyping}
              >
                <div className="action-label">draft a reply</div>
              </button>
              <button
                className="quick-action-btn"
                onClick={() => handleAiQuickAction('Give me a concise to-do list from my recent chats.', true)}
                disabled={!aiAllowChatAccess || isAiTyping}
              >
                <div className="action-label">extract action items</div>
              </button>
              <button
                className="quick-action-btn"
                onClick={() => handleAiQuickAction('Suggest three thoughtful questions I can ask next.', false)}
                disabled={isAiTyping}
              >
                <div className="action-label">suggest next questions</div>
              </button>
            </div>

            <div className="aichat-container">
              <div className="ai-translate-bar">
                <div className="ai-translate-left">
                  <span className="ai-translate-label">translate</span>
                  <select
                    className="ai-language-select"
                    value={aiTargetLanguage}
                    onChange={(e) => setAiTargetLanguage(e.target.value)}
                  >
                    <option>Hindi</option>
                    <option>Gujarati</option>
                    <option>Bengali</option>
                    <option>Marathi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                    <option>Kannada</option>
                    <option>Malayalam</option>
                    <option>Punjabi</option>
                    <option>Urdu</option>
                    <option>Odia</option>
                    <option>Assamese</option>
                    <option>Konkani</option>
                    <option>Maithili</option>
                    <option>Sanskrit</option>
                  </select>
                </div>
                <button
                  className="ai-mini-btn"
                  onClick={handleAiTranslate}
                  disabled={isAiTyping}
                >
                  translate
                </button>
              </div>

              <div className="aichat-messages">
                {aiMessages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role === 'user' ? 'own' : 'other'}`}>
                    <div className="message-content">
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="message other">
                    <div className="message-content">
                      <div className="ai-typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="aichat-input-container">
                <form onSubmit={handleAiSend} className="ai-input-area">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask AI anything, or translate using the bar above..."
                    className="ai-input"
                  />
                  <button type="submit" className="send-btn" disabled={isAiTyping}>
                    <Send size={20} />
                  </button>
                </form>
                {!aiAllowChatAccess && (
                  <div className="ai-privacy-note">
                    Chat access is off. Enable it to let AI reference your recent chats.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Communities Section */}
        {activeTab === 'communities' && (
          <div className="section-content">
            <div className="section-header">
              <h2>communities</h2>
              <button
                className="action-btn"
                onClick={() => setShowCommunityModal(true)}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                create
              </button>
            </div>

            <div className="search-bar">
              <input
                type="text"
                placeholder="search communities..."
                className="search-input"
              />
            </div>

            <div className="communities-grid">
              {communities.length === 0 ? (
                <div style={{ colSpan: 'full', textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' }}>
                  No communities found. Create the first one!
                </div>
              ) : (
                communities.map((community) => (
                  <div
                    key={community._id}
                    className="community-card"
                    onMouseEnter={() => setCursorSize(70)}
                    onMouseLeave={() => setCursorSize(40)}
                  >
                    <div className="community-header">
                      <div className="community-avatar-large">
                        {community.icon || community.name.charAt(0).toUpperCase()}
                      </div>
                      {/* <span className="active-badge">active</span> */}
                    </div>
                    <h3>{community.name}</h3>
                    <p className="community-category">{community.category}</p>
                    <p className="community-members">{community.members.length} members</p>
                    {community.members.some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId')) ? (
                      <button
                        className="join-btn"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
                        onClick={() => handleLeaveCommunity(community._id)}
                        onMouseEnter={() => setCursorSize(60)}
                        onMouseLeave={() => setCursorSize(40)}
                      >
                        leave
                      </button>
                    ) : (
                      <button
                        className="join-btn"
                        onClick={() => handleJoinCommunity(community._id)}
                        onMouseEnter={() => setCursorSize(60)}
                        onMouseLeave={() => setCursorSize(40)}
                      >
                        join
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Updates Section */}
        {activeTab === 'updates' && (
          <div className="section-content">
            <div className="section-header">
              <h2>updates</h2>
              <button
                className="action-btn"
                onClick={handleCreateUpdate}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                post update
              </button>
            </div>

            <div className="updates-stories">
              <div
                className="story-item add-story"
                onClick={handleCreateUpdate}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                <div className="story-ring">
                  <div className="story-content">
                    <span>+</span>
                  </div>
                </div>
                <span>your update</span>
              </div>

              {updates.map((update) => (
                <div key={update._id} className="story-item">
                  <div className="story-ring active">
                    <div className="story-content">
                      {/* Show user avatar or update image */}
                      {update.author.profilePic ? (
                        <img src={getAvatarUrl(update.author.profilePic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        update.author.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                  <span>{update.author.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>

            <div className="updates-feed" style={{ marginTop: '40px' }}>
              {updates.map(update => (
                <div key={update._id} className="feed-item" style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                  <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                      {update.author.profilePic ? (
                        <img src={getAvatarUrl(update.author.profilePic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        update.author.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem' }}>{update.author.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(update.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {update.image && (
                    <div className="feed-image" style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
                      <img src={getAvatarUrl(update.image)} alt="Update" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}
                  <p>{update.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Events Section */}
        {
          activeTab === 'events' && (
            <div className="section-content">
              <div className="section-header">
                <h2>events</h2>
                <button
                  className="action-btn"
                  onClick={() => setShowEventModal(true)}
                  onMouseEnter={() => setCursorSize(60)}
                  onMouseLeave={() => setCursorSize(40)}
                >
                  create
                </button>
              </div>

              <div className="events-tabs">
                <button className="event-tab active">upcoming</button>
                <button className="event-tab">past</button>
                <button className="event-tab">my events</button>
              </div>

              <div className="events-list">
                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    No upcoming events. Plan something!
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event._id}
                      className="event-card"
                      onMouseEnter={() => setCursorSize(70)}
                      onMouseLeave={() => setCursorSize(40)}
                    >
                      <div className="event-date-badge">
                        <span className="date-day">{new Date(event.date).getDate()}</span>
                        <span className="date-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div className="event-details">
                        <h3>{event.title}</h3>
                        <p className="event-community">{event.community?.name || 'General'}</p>
                        <div className="event-meta">
                          <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>·</span>
                          <span>{event.location}</span>
                          <span className="hide-mobile">·</span>
                          <span className="hide-mobile">{event.attendees.length} attending</span>
                        </div>
                      </div>
                      {event.attendees.some(a => a._id === localStorage.getItem('userId') || a === localStorage.getItem('userId')) ? (
                        <button
                          className="event-join-btn"
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                          onClick={() => handleRsvpEvent(event._id)}
                          onMouseEnter={() => setCursorSize(60)}
                          onMouseLeave={() => setCursorSize(40)}
                        >
                          going
                        </button>
                      ) : (
                        <button
                          className="event-join-btn"
                          onClick={() => handleRsvpEvent(event._id)}
                          onMouseEnter={() => setCursorSize(60)}
                          onMouseLeave={() => setCursorSize(40)}
                        >
                          join
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        }

      </main >

      {showOnboarding && (
        <div className="modal-overlay">
          <div className="modal-content onboarding-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Welcome to Cohort</h3>
            </div>
            <form onSubmit={handleSaveOnboarding} className="onboarding-form">
              <p className="onboarding-subtitle">Tell us about yourself to personalize your experience.</p>
              <div className="group-name-input">
                <input
                  type="text"
                  placeholder="Your name"
                  className="modal-input"
                  value={onboardingForm.name}
                  onChange={(e) => setOnboardingForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="group-name-input" style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Who are you? (e.g., Designer, Student, Developer)"
                  className="modal-input"
                  value={onboardingForm.whoAmI}
                  onChange={(e) => setOnboardingForm((prev) => ({ ...prev, whoAmI: e.target.value }))}
                  required
                />
              </div>
              <div className="group-name-input" style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Education"
                  className="modal-input"
                  value={onboardingForm.education}
                  onChange={(e) => setOnboardingForm((prev) => ({ ...prev, education: e.target.value }))}
                />
              </div>
              <div className="group-name-input" style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Interests (comma separated)"
                  className="modal-input"
                  value={onboardingForm.interests}
                  onChange={(e) => setOnboardingForm((prev) => ({ ...prev, interests: e.target.value }))}
                />
              </div>
              <div className="group-name-input" style={{ marginTop: '10px' }}>
                <textarea
                  placeholder="About you"
                  className="modal-input"
                  style={{ minHeight: '90px', paddingTop: '10px' }}
                  value={onboardingForm.aboutInfo}
                  onChange={(e) => setOnboardingForm((prev) => ({ ...prev, aboutInfo: e.target.value }))}
                />
              </div>
              <button type="submit" className="create-group-btn" style={{ marginTop: '14px' }}>
                save and continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {
        showSettings && (
          <div className="settings-panel">
            <div className="settings-content">
              <div className="settings-header">
                <h3>Profile Settings</h3>
                <button
                  className="close-settings-btn"
                  onClick={() => setShowSettings(false)}
                  onMouseEnter={() => setCursorSize(60)}
                  onMouseLeave={() => setCursorSize(40)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="settings-form">
                <div className="profile-upload-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                  <div
                    className="user-avatar-large"
                    style={{ width: '100px', height: '100px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                    onClick={() => document.getElementById('profile-upload').click()}
                  >
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : currentUser?.profilePic ? (
                      <img src={getAvatarUrl(currentUser.profilePic)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      currentUser?.name.charAt(0).toUpperCase()
                    )}
                    <div className="upload-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                      <span style={{ fontSize: '0.8rem' }}>Change</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    id="profile-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setProfileFile(file);
                        setPreviewImage(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={currentUser?.name}
                    className="modal-input"
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder={currentUser?.username}
                    className="modal-input"
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder={currentUser?.bio || "Tell us about yourself..."}
                    className="modal-input"
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', minHeight: '80px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="create-group-btn"
                  style={{ margin: 0, width: '100%' }}
                >
                  Save Changes
                </button>
              </form>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' }}></div>

              <button
                className="logout-btn"
                onClick={handleLogout}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )
      }

      {/* New Chat Modal */}
      {
        showNewChatModal && (
          <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>New Chat</h3>
                <div className="modal-actions">
                  <button
                    className="modal-icon-btn"
                    onClick={handleNewGroupChat}
                    onMouseEnter={() => setCursorSize(60)}
                    onMouseLeave={() => setCursorSize(40)}
                    title="Create Group Chat"
                  >
                    <Users size={20} />
                  </button>
                  <button
                    className="modal-icon-btn"
                    onClick={() => setShowNewChatModal(false)}
                    onMouseEnter={() => setCursorSize(60)}
                    onMouseLeave={() => setCursorSize(40)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="modal-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder={activeChatModalTab === 'discover' ? "Search username to add friend..." : "Search your friends..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="modal-search-input"
                />
              </div>

              <div className="chat-modal-tabs">
                <button
                  type="button"
                  className={`chat-modal-tab ${activeChatModalTab === 'friends' ? 'active' : ''}`}
                  onClick={() => setActiveChatModalTab('friends')}
                >
                  friends ({filteredUsers.length})
                </button>
                <button
                  type="button"
                  className={`chat-modal-tab ${activeChatModalTab === 'discover' ? 'active' : ''}`}
                  onClick={() => setActiveChatModalTab('discover')}
                >
                  discover
                </button>
              </div>

              {chatActionError && <div className="chat-action-error">{chatActionError}</div>}

              {activeChatModalTab === 'friends' && friendRequests.incoming.length > 0 && (
                <div className="requests-strip">
                  <div className="requests-strip-title">
                    <UserCheck size={14} />
                    pending requests
                  </div>
                  {friendRequests.incoming.map((requestUser) => (
                    <div key={requestUser._id} className="request-item">
                      <span>@{requestUser.username}</span>
                      <div className="request-actions">
                        <button
                          type="button"
                          className="request-btn accept"
                          onClick={() => handleAcceptRequest(requestUser._id)}
                          disabled={friendActionLoading === requestUser._id}
                        >
                          accept
                        </button>
                        <button
                          type="button"
                          className="request-btn reject"
                          onClick={() => handleRejectRequest(requestUser._id)}
                          disabled={friendActionLoading === requestUser._id}
                        >
                          reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-users-list">
                {activeChatModalTab === 'friends' && filteredUsers.length === 0 ? (
                  <div className="no-users">No friends yet. Use discover to add by username.</div>
                ) : (
                  (activeChatModalTab === 'friends' ? filteredUsers : filteredDiscoverUsers).map((user) => (
                    <div key={user._id} className="modal-user-item">
                      <div className="modal-user-avatar">
                        {user.profilePic ? (
                          <img src={getAvatarUrl(user.profilePic)} alt={user.name} className="avatar-img" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="modal-user-info">
                        <h4>{highlightMatch(user.name, searchQuery)}</h4>
                        <p>@{highlightMatch(user.username, searchQuery)}</p>
                      </div>
                      {activeChatModalTab === 'friends' ? (
                        <button
                          type="button"
                          className="request-btn accept"
                          onClick={() => handleCreateChat(user._id)}
                        >
                          message
                        </button>
                      ) : user.relationship === 'friend' ? (
                        <button
                          type="button"
                          className="request-btn accept"
                          onClick={() => {
                            setActiveChatModalTab('friends');
                            setSearchQuery(user.username);
                          }}
                        >
                          friend
                        </button>
                      ) : user.relationship === 'requested' ? (
                        <button type="button" className="request-btn ghost" disabled>requested</button>
                      ) : user.relationship === 'incoming' ? (
                        <div className="request-actions">
                          <button
                            type="button"
                            className="request-btn accept"
                            onClick={() => handleAcceptRequest(user._id)}
                            disabled={friendActionLoading === user._id}
                          >
                            accept
                          </button>
                          <button
                            type="button"
                            className="request-btn reject"
                            onClick={() => handleRejectRequest(user._id)}
                            disabled={friendActionLoading === user._id}
                          >
                            reject
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="request-btn ghost"
                          onClick={() => handleSendFriendRequest(user.username)}
                          disabled={friendActionLoading === user.username}
                        >
                          {friendActionLoading === user.username ? 'sending...' : 'add friend'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Group Chat Modal */}
      {
        showGroupChatModal && (
          <div className="modal-overlay" onClick={() => setShowGroupChatModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>New Group Chat</h3>
                <button
                  className="modal-icon-btn"
                  onClick={() => setShowGroupChatModal(false)}
                  onMouseEnter={() => setCursorSize(60)}
                  onMouseLeave={() => setCursorSize(40)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="group-name-input">
                <input
                  type="text"
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="modal-input"
                />
              </div>

              <div className="modal-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="modal-search-input"
                />
              </div>

              <div className="selected-users-count">
                {selectedUsers.length} user(s) selected (min 2 required)
              </div>

              <div className="modal-users-list">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`modal-user-item ${selectedUsers.includes(user._id) ? 'selected' : ''}`}
                    onClick={() => toggleUserSelection(user._id)}
                    onMouseEnter={() => setCursorSize(70)}
                    onMouseLeave={() => setCursorSize(40)}
                  >
                    <div className="modal-user-avatar">
                      {user.profilePic ? (
                        <img src={getAvatarUrl(user.profilePic)} alt={user.name} className="avatar-img" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="modal-user-info">
                      <h4>{highlightMatch(user.name, searchQuery)}</h4>
                      <p>@{highlightMatch(user.username, searchQuery)}</p>
                    </div>
                    {selectedUsers.includes(user._id) && (
                      <div className="selected-check">✓</div>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="create-group-btn"
                onClick={handleCreateGroupChat}
                disabled={!groupName.trim() || selectedUsers.length < 2}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                Create Group
              </button>
            </div>
          </div>
        )
      }
      {/* Community Creation Modal */}
      {
        showCommunityModal && (
          <div className="modal-overlay" onClick={() => setShowCommunityModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create Community</h3>
                <button
                  className="modal-icon-btn"
                  onClick={() => setShowCommunityModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateCommunity}>
                <div className="group-name-input">
                  <input
                    type="text"
                    placeholder="Community Name"
                    value={newCommunityName}
                    onChange={(e) => setNewCommunityName(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Category (e.g. tech, art)"
                    value={newCommunityCategory}
                    onChange={(e) => setNewCommunityCategory(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <textarea
                    placeholder="Description..."
                    value={newCommunityDesc}
                    onChange={(e) => setNewCommunityDesc(e.target.value)}
                    className="modal-input"
                    style={{ minHeight: '80px', paddingTop: '10px' }}
                  />
                </div>
                <button
                  type="submit"
                  className="create-group-btn"
                >
                  Create Community
                </button>
              </form>
            </div>
          </div>
        )
      }

      {/* Event Creation Modal */}
      {
        showEventModal && (
          <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create Event</h3>
                <button
                  className="modal-icon-btn"
                  onClick={() => setShowEventModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateEvent}>
                <div className="group-name-input">
                  <input
                    type="text"
                    placeholder="Event Title"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="datetime-local"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Location (default: Online)"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <textarea
                    placeholder="Description..."
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    className="modal-input"
                    style={{ minHeight: '80px', paddingTop: '10px' }}
                  />
                </div>
                <button
                  type="submit"
                  className="create-group-btn"
                >
                  Create Event
                </button>
              </form>
            </div>
          </div>
        )
      }

      {/* Custom Cursor */}
      <div
        className="custom-cursor"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          width: `${cursorSize}px`,
          height: `${cursorSize}px`
        }}
      >
        <div className="cursor-dot" />
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .home-page {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #000000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          color: white;
          cursor: none;
        }

        /* ============================================
           NAVBAR - COMPLETELY REDESIGNED
           ============================================ */
        .top-nav {
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(24px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          max-width: 1600px;
          margin: 0 auto;
          gap: 24px;
        }

        .nav-left {
          flex-shrink: 0;
        }

        .app-logo {
          font-size: 1.5rem;
          font-weight: 710;
          color: white;
          letter-spacing: -0.04em;
          text-transform: lowercase;
          font-family:'Syne', sans-serif;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }

        .home-page.theme-light {
          background: #f4f7fb;
          color: #0f172a;
        }

        .home-page.theme-light .top-nav {
          background: rgba(255, 255, 255, 0.94);
          border-bottom: 1px solid rgba(15, 23, 42, 0.1);
        }

        .home-page.theme-light .main-content {
          background: #f4f7fb;
        }

        .home-page.theme-light .app-logo,
        .home-page.theme-light .nav-tab,
        .home-page.theme-light .mobile-nav-item,
        .home-page.theme-light .profile-btn span,
        .home-page.theme-light .section-header h2,
        .home-page.theme-light .chat-info h3,
        .home-page.theme-light .message-content p,
        .home-page.theme-light .modal-user-info h4 {
          color: #0f172a;
        }

        .home-page.theme-light .app-logo {
          background: none;
          -webkit-text-fill-color: #0f172a;
        }

        .home-page.theme-light .section-content,
        .home-page.theme-light .chat-window,
        .home-page.theme-light .modal-content,
        .home-page.theme-light .settings-panel {
          background: rgba(255, 255, 255, 0.92);
          color: #0f172a;
          border-color: rgba(15, 23, 42, 0.12);
        }

        .home-page.theme-light .search-input,
        .home-page.theme-light .modal-input,
        .home-page.theme-light .aichat-input-container input,
        .home-page.theme-light .message-input,
        .home-page.theme-light .modal-search,
        .home-page.theme-light .ai-translate-bar,
        .home-page.theme-light .ai-language-select {
          background: rgba(15, 23, 42, 0.04);
          color: #0f172a !important;
          border-color: rgba(15, 23, 42, 0.12);
        }

        .home-page.theme-light .modal-search-input {
          color: #0f172a;
        }

        .home-page.theme-light .mobile-nav-menu {
          background: rgba(255, 255, 255, 0.96);
          border-top: 1px solid rgba(15, 23, 42, 0.08);
        }

        .home-page.theme-light .ai-translate-label {
          color: rgba(15, 23, 42, 0.66);
        }

        .home-page.theme-light .ai-mini-btn {
          color: #0f172a;
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(59, 130, 246, 0.32);
        }

        .home-page.theme-light .search-input::placeholder,
        .home-page.theme-light .modal-input::placeholder,
        .home-page.theme-light .message-input::placeholder,
        .home-page.theme-light .modal-search-input::placeholder {
          color: rgba(15, 23, 42, 0.45);
        }

        .home-page.theme-light .message.other .message-content,
        .home-page.theme-light .aichat-messages .message.other .message-content {
          background: #f2f5fb;
          color: #0f172a;
          border-color: rgba(15, 23, 42, 0.08);
        }

        .home-page.theme-light .icon-btn,
        .home-page.theme-light .profile-btn,
        .home-page.theme-light .modal-icon-btn,
        .home-page.theme-light .nav-tab.active,
        .home-page.theme-light .action-btn,
        .home-page.theme-light .request-btn.ghost {
          color: #0f172a;
          border-color: rgba(15, 23, 42, 0.15);
          background: rgba(15, 23, 42, 0.05);
        }

        .home-page.theme-light .chat-item:hover,
        .home-page.theme-light .modal-user-item:hover {
          background: rgba(15, 23, 42, 0.05);
          border-color: rgba(15, 23, 42, 0.1);
        }

        .home-page.theme-light .chat-time,
        .home-page.theme-light .chat-message,
        .home-page.theme-light .modal-user-info p,
        .home-page.theme-light .ai-subtitle,
        .home-page.theme-light .onboarding-subtitle {
          color: rgba(15, 23, 42, 0.6);
        }

        .app-logo::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #fff, #888);
          transition: width 0.4s ease;
        }

        .app-logo:hover::after {
          width: 100%;
        }

        .app-logo:hover {
          transform: scale(1.08) translateY(-1px);
          filter: brightness(1.2);
        }

        /* Desktop Navigation Tabs Container */
        .nav-center {
          display: none;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .nav-tab {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          text-transform: lowercase;
          cursor: pointer;
          padding: 11px 22px;
          border-radius: 22px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .nav-tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .nav-tab:hover::before {
          opacity: 1;
        }

        .nav-tab:hover {
          color: rgba(255, 255, 255, 0.85);
          transform: translateY(-1px);
        }

        .nav-tab.active {
          color: white;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 
            0 2px 16px rgba(255, 255, 255, 0.15),
            inset 0 1px 2px rgba(255, 255, 255, 0.1);
          transform: translateY(0);
        }

        .nav-right {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
        }

        .icon-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 11px;
          border-radius: 14px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: none;
          align-items: center;
          justify-content: center;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
        }

        .profile-btn {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          padding: 11px 20px;
          border-radius: 18px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: none;
          align-items: center;
          gap: 9px;
          text-transform: lowercase;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        }

        .profile-btn:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 
            0 6px 24px rgba(255, 255, 255, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .mobile-menu-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          cursor: pointer;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          transition: all 0.35s ease;
        }

        .mobile-menu-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: scale(1.05);
        }

        /* Mobile Menu Dropdown */
        .mobile-nav-menu {
          max-height: 0;
          overflow: hidden;
          background: rgba(5, 5, 5, 0.98);
          backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mobile-nav-menu.open {
          max-height: 500px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        }

        .mobile-nav-item {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.0625rem;
          font-weight: 700;
          text-transform: lowercase;
          cursor: pointer;
          padding: 20px 24px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.35s ease;
          width: 100%;
          display: block;
          position: relative;
        }

        .mobile-nav-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.15), transparent);
          transition: width 0.35s ease;
        }

        .mobile-nav-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: white;
          padding-left: 36px;
        }

        .mobile-nav-item:hover::before {
          width: 4px;
        }

        .mobile-nav-item.active {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border-left: 4px solid white;
          box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.1);
        }

        /* ============================================
           MAIN CONTENT
           ============================================ */
        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: #000000;
        }

        .main-content::-webkit-scrollbar {
          width: 10px;
        }

        .main-content::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        .main-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 5px;
        }

        .main-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .section-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .section-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.03em;
          text-transform: lowercase;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: lowercase;
          cursor: pointer;
          padding: 10px 22px;
          border-radius: 16px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
        }

        /* Search Bar */
        .search-bar {
          margin-bottom: 24px;
        }

        .search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 0.9375rem;
          padding: 14px 18px;
          border-radius: 14px;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
          text-transform: lowercase;
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }

        /* Chats */
        .chat-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .chat-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .chat-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        .chat-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 700;
          color: white;
        }

        .online-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid #000000;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
        }

        .chat-info {
          flex: 1;
          min-width: 0;
        }

        .chat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .chat-info h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: white;
          text-transform: lowercase;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-time {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
          margin-left: 12px;
        }

        .chat-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .chat-message {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: lowercase;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .unread-badge {
          min-width: 22px;
          height: 22px;
          background: white;
          color: #000000;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 0 7px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* AI Section */
        .ai-container {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 280px);
        }

        .ai-messages {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }

        .ai-welcome {
          text-align: center;
          padding: 24px;
        }

        .ai-welcome h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 10px;
          text-transform: lowercase;
          letter-spacing: -0.02em;
        }

        .ai-welcome p {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: lowercase;
        }

        .ai-quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .quick-action-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 18px 20px;
          border-radius: 14px;
          transition: all 0.3s ease;
          text-align: left;
        }

        .quick-action-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .action-label {
          text-transform: lowercase;
        }

        .ai-input-area {
          display: flex;
          gap: 12px;
        }

        .ai-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 0.9375rem;
          padding: 14px 20px;
          border-radius: 20px;
          outline: none;
          transition: all 0.3s ease;
        }

        .ai-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
          text-transform: lowercase;
        }

        .ai-input:focus {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }

        .send-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: lowercase;
          cursor: pointer;
          padding: 14px 28px;
          border-radius: 20px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .send-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        /* Communities */
        .communities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }

        .community-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .community-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .community-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .community-avatar-large {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
        }

        .active-badge {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #22c55e;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: lowercase;
          padding: 4px 8px;
          border-radius: 10px;
        }

        .community-card h3 {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 5px;
          text-transform: lowercase;
        }

        .community-category {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 8px;
          text-transform: lowercase;
        }

        .community-members {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 14px;
          text-transform: lowercase;
        }

        .join-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: lowercase;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .join-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }

        /* Updates */
        .updates-stories {
          display: flex;
          gap: 18px;
          overflow-x: auto;
          padding-bottom: 16px;
          margin-bottom: 36px;
        }

        .updates-stories::-webkit-scrollbar {
          height: 6px;
        }

        .updates-stories::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 3px;
        }

        .updates-stories::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }

        .story-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          min-width: 72px;
        }

        .story-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          padding: 3px;
          background: transparent;
          transition: transform 0.3s ease;
        }

        .story-item:hover .story-ring {
          transform: scale(1.1);
        }

        .story-ring.active {
          background: linear-gradient(135deg, #f15a22, #ec4899);
        }

        .story-ring.viewed {
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .add-story .story-ring {
          border: 2px dashed rgba(255, 255, 255, 0.2);
        }

        .story-content {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #0a0a0a;
          border: 3px solid #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          position: relative;
        }

        .add-story .story-content span {
          font-size: 2rem;
          color: rgba(255, 255, 255, 0.3);
        }

        .location-pin {
          position: absolute;
          bottom: -2px;
          right: -2px;
          font-size: 0.875rem;
        }

        .story-item > span {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: lowercase;
          text-align: center;
          font-weight: 500;
        }

        .story-time {
          font-size: 0.6875rem !important;
          color: rgba(255, 255, 255, 0.4) !important;
        }

        .location-section {
          margin-top: 36px;
        }

        .section-subheader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .section-subheader h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          text-transform: lowercase;
          letter-spacing: -0.02em;
        }

        .map-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: lowercase;
          cursor: pointer;
          padding: 10px 20px;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .map-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        .map-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          overflow: hidden;
        }

        .map-placeholder {
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .map-placeholder p {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.3);
          text-transform: lowercase;
        }

        /* Events */
        .events-tabs {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          overflow-x: auto;
        }

        .event-tab {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9375rem;
          font-weight: 600;
          text-transform: lowercase;
          cursor: pointer;
          padding: 12px 0;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .event-tab:hover {
          color: rgba(255, 255, 255, 0.7);
        }

        .event-tab.active {
          color: white;
          border-bottom-color: white;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .event-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }

        .event-date-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 56px;
          padding: 12px;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        .date-day {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          line-height: 1;
        }

        .date-month {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 4px;
          font-weight: 600;
        }

        .event-details {
          flex: 1;
          min-width: 0;
        }

        .event-details h3 {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
          text-transform: lowercase;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-community {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 6px;
          text-transform: lowercase;
        }

        .event-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: lowercase;
          flex-wrap: wrap;
        }

        .event-join-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: lowercase;
          cursor: pointer;
          padding: 10px 24px;
          border-radius: 16px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .event-join-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        /* Custom Cursor */
        .custom-cursor {
          position: fixed;
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          transform: translate(-50%, -50%);
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
                      height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          mix-blend-mode: difference;
        }

        .cursor-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
        }


        /* Chat Window */
        .chat-window {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #000000;
          z-index: 1001;
          display: flex;
          flex-direction: column;
        }

        .chat-window-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateX(-2px);
        }

        .chat-window-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .chat-avatar-small {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 700;
          color: white;
        }

        .chat-window-info h3 {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          text-transform: lowercase;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }

        .message {
          display: flex;
          margin-bottom: 8px;
        }

        .message.own {
          justify-content: flex-end;
        }

        .message.other {
          justify-content: flex-start;
        }

        .message-content {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 16px;
          position: relative;
        }

        .message.own .message-content {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
        }

        .message.other .message-content {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
        }

        .message-sender {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
          text-transform: lowercase;
        }

        .message-content p {
          margin: 0;
          font-size: 0.9375rem;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .message-tools {
          margin-top: 8px;
          display: flex;
          justify-content: flex-end;
        }

        .message-translate-btn {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.85);
          border-radius: 999px;
          font-size: 0.68rem;
          padding: 4px 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .message-translate-btn:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .message-translate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .translated-message {
          margin-top: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px dashed rgba(255, 255, 255, 0.18);
        }

        .translated-label {
          font-size: 0.7rem;
          font-weight: 600;
          opacity: 0.8;
          display: inline-block;
          margin-bottom: 4px;
        }

        .translated-message p {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.45;
        }

        .message-time {
          display: block;
          font-size: 0.6875rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 6px;
        }

        .message-input-form {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .message-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 0.9375rem;
          padding: 14px 18px;
          border-radius: 20px;
          outline: none;
          transition: all 0.3s ease;
        }

        .message-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .message-input:focus {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }

        .send-message-btn {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          cursor: pointer;
          padding: 12px 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .send-message-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: scale(1.05);
        }

        .send-message-btn:active {
          transform: scale(0.95);
        }

        /* Settings Panel */
        .settings-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 100%;
          max-width: 400px;
          height: 100vh;
          background: rgba(5, 5, 5, 0.98);
          backdrop-filter: blur(24px);
          border-left: 1px solid rgba(255, 255, 255, 0.12);
          z-index: 1002;
          animation: slideInRight 0.3s ease;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .settings-content {
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .settings-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-transform: lowercase;
        }

        .close-settings-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-settings-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .user-info-section {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          text-align: center;
        }

        .user-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 3px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin: 0 auto 16px;
        }

        .user-details h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin-bottom: 8px;
        }

        .user-details .username {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
        }

        .user-details .email {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .logout-btn {
          background: rgba(255, 50, 50, 0.1);
          border: 1px solid rgba(255, 50, 50, 0.3);
          color: #ff6b6b;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          padding: 14px 24px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          margin-top: auto;
        }

        .logout-btn:hover {
          background: rgba(255, 50, 50, 0.2);
          border-color: rgba(255, 50, 50, 0.5);
          transform: translateY(-2px);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 1003;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: rgba(10, 10, 10, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          text-transform: lowercase;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
        }

        .modal-icon-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .modal-icon-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .modal-search {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-search svg {
          color: rgba(255, 255, 255, 0.4);
        }

        .modal-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 0.9375rem;
          outline: none;
        }

        .modal-search-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .chat-modal-tabs {
          display: flex;
          gap: 8px;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .chat-modal-tab {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.78rem;
          text-transform: lowercase;
          cursor: pointer;
        }

        .chat-modal-tab.active {
          background: rgba(59, 130, 246, 0.22);
          border-color: rgba(59, 130, 246, 0.6);
          color: #dbeafe;
        }

        .chat-action-error {
          margin: 10px 24px 0;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(248, 113, 113, 0.4);
          background: rgba(248, 113, 113, 0.14);
          color: rgba(254, 226, 226, 0.95);
          font-size: 0.78rem;
        }

        .requests-strip {
          padding: 10px 24px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .requests-strip-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
          text-transform: lowercase;
        }

        .request-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 0.8rem;
        }

        .request-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .request-btn {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.88);
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 0.72rem;
          text-transform: lowercase;
          cursor: pointer;
        }

        .request-btn.accept {
          background: rgba(34, 197, 94, 0.18);
          border-color: rgba(34, 197, 94, 0.4);
        }

        .request-btn.reject {
          background: rgba(239, 68, 68, 0.16);
          border-color: rgba(239, 68, 68, 0.35);
        }

        .request-btn.ghost {
          background: rgba(255, 255, 255, 0.04);
        }

        .request-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .modal-users-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .modal-users-list::-webkit-scrollbar {
          width: 8px;
        }

        .modal-users-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-users-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }

        .modal-user-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid transparent;
          position: relative;
        }

        .modal-user-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .modal-user-item.selected {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .modal-user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .modal-user-info {
          flex: 1;
          min-width: 0;
        }

        .modal-user-info h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .modal-user-info p {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.5);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .selected-check {
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
        }

        .no-users {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9375rem;
        }

        .group-name-input {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 0.9375rem;
          padding: 14px 18px;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
        }

        .modal-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .modal-input:focus {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .onboarding-modal {
          max-width: 560px;
          max-height: 88vh;
        }

        .onboarding-form {
          padding: 16px 24px 22px;
        }

        .onboarding-subtitle {
          margin: 0 0 12px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.62);
        }

        .selected-users-count {
          padding: 12px 24px;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .create-group-btn {
          margin: 16px 24px 20px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          padding: 14px 24px;
          border-radius: 14px;
          transition: all 0.3s ease;
        }

        .create-group-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-2px);
        }

        .create-group-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .hide-mobile {
          display: none;
        }

        /* ============================================
           RESPONSIVE BREAKPOINTS
           ============================================ */
        
        /* Tablet (768px and up) */
        @media (min-width: 768px) {
          .nav-container {
            padding: 20px 40px;
          }

          .nav-center {
            display: flex;
          }

          .icon-btn {
            display: flex;
          }

          .profile-btn {
            display: flex;
          }

          .mobile-menu-btn {
            display: none;
          }

          .main-content {
            padding: 40px;
          }

          .section-header h2 {
            font-size: 2.25rem;
          }

          .communities-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 16px;
          }

          .map-placeholder {
            height: 300px;
          }

          .hide-mobile {
            display: inline;
          }
        }

        /* Desktop (1024px and up) */
        @media (min-width: 1024px) {
          .nav-container {
            padding: 20px 60px;
          }

          .main-content {
            padding: 48px 60px;
          }

          .communities-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }

        /* Large Desktop (1440px and up) */
        @media (min-width: 1440px) {
          .nav-container {
            padding: 24px 80px;
          }

          .main-content {
            padding: 56px 80px;
          }
        }

        /* Emoji Picker Styles */
        .emoji-picker-container {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 10px;
          z-index: 1000;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .input-actions-left {
          display: flex;
          gap: 8px;
        }

        .input-action-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .input-action-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .message-input-form {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .message-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 0.9375rem;
          padding: 12px 16px;
          border-radius: 20px;
          outline: none;
          transition: all 0.3s ease;
        }

        .message-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .message-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .send-message-btn {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          cursor: pointer;
          padding: 12px 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .send-message-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: scale(1.05);
        }

        /* Chat Window Styles */
        .chat-window {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #000;
          z-index: 1001;
          display: flex;
          flex-direction: column;
        }

        .chat-window-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(10, 10, 10, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .chat-window-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-avatar-small {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 700;
          color: white;
        }

        .chat-window-info h3 {
          font-size: 1rem;
          font-weight: 600;
          color: white;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          display: flex;
          margin-bottom: 8px;
        }

        .message.own {
          justify-content: flex-end;
        }

        .message.other {
          justify-content: flex-start;
        }

        .message-content {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .message.own .message-content {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .message-sender {
          display: block;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
          font-weight: 600;
        }

        .message-content p {
          margin: 0;
          color: white;
          font-size: 0.9375rem;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .message-time {
          display: block;
          font-size: 0.6875rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
        }

        /* Online Status & Typing Indicators */
        .online-indicator {
          width: 10px;
          height: 10px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid #000;
          position: absolute;
          bottom: 0px;
          right: 0px;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5);
        }

        .online-status-text {
          font-size: 0.75rem;
          color: #22c55e;
          font-weight: 500;
        }

        .typing-indicator {
          padding: 8px 16px;
          margin-left: 16px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .typing-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots span {
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out both;
        }

        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Message Status & Unread Badge */
        .message-status {
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          margin-left: 4px;
        }

        .status-sent { color: rgba(255, 255, 255, 0.4); }
        .status-delivered { color: rgba(255, 255, 255, 0.6); }
        .status-read { color: #3b82f6; }

        .unread-badge {
          background: #3b82f6;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          margin-top: 4px;
        }

        /* File Attachment Styles */
        .file-attachment {
          margin-top: 8px;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .file-image {
          max-width: 100%;
          max-height: 200px;
          display: block;
          border-radius: 8px;
        }

        .file-doc {
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: white;
          font-size: 0.9rem;
        }

        .file-doc:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        ::selection {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
        /* AI Chat Styles */
        .aichat-container {
          display: flex;
          flex-direction: column;
          /* Adjusted height to fit within viewport perfectly without body scroll */
          height: calc(100vh - 185px);
          background: rgba(0, 0, 0, 0.34);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,0.42);
          position: relative;
        }

        .ai-translate-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          position: sticky;
          top: 0;
          z-index: 3;
        }

        .ai-translate-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        .ai-translate-label {
          font-size: 0.76rem;
          text-transform: lowercase;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.68);
          white-space: nowrap;
        }

        .ai-language-select {
          height: 36px;
          min-width: 170px;
          max-width: 100%;
          padding: 0 34px 0 10px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          font-size: 0.84rem;
          outline: none;
          appearance: none;
          cursor: pointer;
        }

        .ai-language-select:focus {
          border-color: rgba(56, 189, 248, 0.58);
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.18);
        }

        .ai-mini-btn {
          height: 36px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(59, 130, 246, 0.2);
          color: rgba(255, 255, 255, 0.95);
          font-size: 0.8rem;
          text-transform: lowercase;
          cursor: pointer;
          flex-shrink: 0;
        }

        .ai-mini-btn:hover {
          background: rgba(59, 130, 246, 0.32);
        }

        .ai-mini-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .aichat-container::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 1px;
          border-radius: 20px;
          background: linear-gradient(120deg, rgba(56, 189, 248, 0.6), rgba(59, 130, 246, 0.28), rgba(34, 197, 94, 0.45));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: aiBorderFlow 4s linear infinite;
          pointer-events: none;
        }

        @keyframes aiBorderFlow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }

        .ai-header-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ai-header {
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
        }

        .ai-subtitle {
          margin-top: 6px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.68);
        }

        .ai-status-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }

        .ai-status-pill {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.88);
        }

        .ai-status-pill.open {
          border-color: rgba(34, 197, 94, 0.5);
          background: rgba(34, 197, 94, 0.12);
        }

        .ai-status-pill.closed {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.12);
        }

        .ai-reset-btn {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.88);
          border-radius: 10px;
          font-size: 0.82rem;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ai-reset-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .ai-reset-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ai-error-banner {
          margin-bottom: 12px;
          border: 1px solid rgba(248, 113, 113, 0.45);
          background: rgba(248, 113, 113, 0.14);
          color: rgba(254, 226, 226, 0.95);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.85rem;
        }

        .aichat-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          /* Ensure text is visible */
          color: white; 
        }

        .aichat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .aichat-messages::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }

        .aichat-messages .message {
          max-width: 80%;
          animation: fadeIn 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .aichat-messages .message.own {
          align-self: flex-end;
          align-items: flex-end;
        }

        .aichat-messages .message.other {
          align-self: flex-start;
          align-items: flex-start;
        }

        .aichat-messages .message-content {
          padding: 14px 20px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.5;
          position: relative;
        }

        .aichat-messages .message.own .message-content {
          background: #3b82f6; /* Bright Blue for user */
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 2px 12px rgba(59, 130, 246, 0.2);
        }

        .aichat-messages .message.other .message-content {
          background: #262626; /* Dark Grey for AI */
          color: rgba(255, 255, 255, 0.9);
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .aichat-input-container {
          padding: 20px;
          background: #1a1a1a; /* Solid dark background */
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0; /* Prevent shrinking */
        }

        /* Ensure input text is visible */
        .aichat-input-container input {
            color: white !important;
            background: rgba(255, 255, 255, 0.05);
        }
        .aichat-input-container input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }
        
        .ai-typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .ai-typing-indicator span {
          width: 6px;
          height: 6px;
          background: rgba(255,255,255,0.6);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .ai-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .ai-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        @media (max-width: 720px) {
          .ai-translate-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .ai-translate-left {
            width: 100%;
          }

          .ai-language-select {
            min-width: 0;
            width: 100%;
          }

          .ai-mini-btn {
            width: 100%;
          }
        }

      `}</style>
    </div >
  );
};

export default HomePage;
