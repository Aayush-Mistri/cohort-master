import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Bell, User, Send, ArrowLeft, LogOut, UserPlus, Users, Smile, Paperclip, Sun, Moon, UserCheck, MapPin, Clock, Pin, Reply, Trash2, Edit3 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import {
  getChats,
  getMessages,
  sendMessage,
  uploadFile,
  scheduleMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  toggleMessageReaction,
  editMessage,
  deleteMessage,
  votePoll,
  searchMessages,
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
import {
  getCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityDetails,
  updateCommunity,
  deleteCommunity,
  getCommunityInvite,
  joinCommunityByInvite,
  addGroupToCommunity,
  createGroupInCommunity,
  promoteCommunityAdmin,
  demoteCommunityAdmin,
  updateCommunitySettings,
  approveCommunityJoinRequest,
  rejectCommunityJoinRequest
} from '../api/communityApi';
import {
  getGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  getGroupDetails,
  updateGroup,
  deleteGroup,
  getGroupInvite,
  joinGroupByInvite,
  addGroupMembers,
  removeGroupMember,
  promoteGroupAdmin,
  demoteGroupAdmin,
  updateGroupSettings,
  approveGroupJoinRequest,
  rejectGroupJoinRequest,
  pinGroupMessage,
  unpinGroupMessage
} from '../api/groupApi';
import { getEvents, createEvent, rsvpEvent } from '../api/eventApi';
import { updateUserProfile, completeOnboarding } from '../api/userApi';
import { getUpdates, createUpdate } from '../api/updateApi';
import { sendAiMessage } from '../api/aiApi';
import { connectSocket, disconnectSocket, joinChat, sendMessageSocket, onReceiveMessage, offReceiveMessage, emitUserOnline, onUserStatusChange, offUserStatusChange, emitTypingStart, emitTypingStop, onUserTyping, offUserTyping, emitMessagesRead, onMessagesRead, offMessagesRead, emitMessageReaction, onMessageReaction, offMessageReaction, onNotification, offNotification } from '../api/socket';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';
const NAV_TABS = ['chats', 'ai', 'communities', 'groups', 'updates', 'events', 'settings'];
const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '😮'];

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorSize, setCursorSize] = useState(40);

  // User state
  const [currentUser, setCurrentUser] = useState(null);

  // Chat state
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageSearchResults, setMessageSearchResults] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

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

  // Scheduled messages
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    content: '',
    scheduledFor: '',
    scheduleType: 'once',
    customInterval: 1,
    customUnit: 'days',
    endsAt: ''
  });

  // Reactions
  const [openReactionMessageId, setOpenReactionMessageId] = useState(null);

  // Communities & Events & Groups State
  const [communities, setCommunities] = useState([]);
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Selection state for detail pages
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCommunityTab, setSelectedCommunityTab] = useState('announcements');
  const [selectedGroupTab, setSelectedGroupTab] = useState('chat');
  const [communityInviteInput, setCommunityInviteInput] = useState('');
  const [groupInviteInput, setGroupInviteInput] = useState('');
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');
  const [selectedCommunityGroupToAdd, setSelectedCommunityGroupToAdd] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupIcon, setEditGroupIcon] = useState('');
  const [editGroupProfileImage, setEditGroupProfileImage] = useState('');
  const [editCommunityName, setEditCommunityName] = useState('');
  const [editCommunityDesc, setEditCommunityDesc] = useState('');
  const [editCommunityIcon, setEditCommunityIcon] = useState('');

  // New Community Form State
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newCommunityCategory, setNewCommunityCategory] = useState('general');
  const [newCommunityCoverImage, setNewCommunityCoverImage] = useState('');
  const [newCommunityIcon, setNewCommunityIcon] = useState('');

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCoverImage, setNewGroupCoverImage] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('');
  const [newGroupProfileImage, setNewGroupProfileImage] = useState('');

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('Online');
  const [newEventCoverImage, setNewEventCoverImage] = useState('');
  const [newEventMaxAttendees, setNewEventMaxAttendees] = useState('');
  const [newEventVisibility, setNewEventVisibility] = useState('contacts'); // contacts | community | group
  const [newEventContextId, setNewEventContextId] = useState(''); // Community/Group ID

  // Bitmoji / Avatar State
  const [showBitmojiModal, setShowBitmojiModal] = useState(false);
  const [bitmojiSeed, setBitmojiSeed] = useState(Math.random().toString(36).substring(7));
  const [bitmojiStyle, setBitmojiStyle] = useState('avataaars');

  // AI & Updates State
  const [updates, setUpdates] = useState([]);
  const [updatesFilter, setUpdatesFilter] = useState('all');
  const [aiMessages, setAiMessages] = useState([{ role: 'ai', content: 'Hello! I am your AI assistant. How can I help you today?' }]);
  const [aiInput, setAiInput] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [newUpdateImage, setNewUpdateImage] = useState(null);
  const [newUpdateVisibility, setNewUpdateVisibility] = useState('contacts');
  const [newUpdateContextId, setNewUpdateContextId] = useState('');
  const [aiAllowChatAccess, setAiAllowChatAccess] = useState(false);
  const [aiTargetLanguage, setAiTargetLanguage] = useState('Hindi');
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [aiError, setAiError] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef(null);

  // Per-message translation state
  const [chatTargetLanguages, setChatTargetLanguages] = useState({});
  const [openMessageDropdown, setOpenMessageDropdown] = useState(null);
  const [messageTranslationLoadingId, setMessageTranslationLoadingId] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Settings State
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState(''); // New State
  const [editWhoAmI, setEditWhoAmI] = useState('');
  const [editAboutInfo, setEditAboutInfo] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editInterests, setEditInterests] = useState('');
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
      const currentUserId = localStorage.getItem('userId');
      const senderId = message?.sender?._id || message?.sender;
      if (selectedChat && message.chat === selectedChat._id) {
        setMessages(prev => [...prev, message]);
      } else if (senderId && senderId !== currentUserId) {
        pushNotification({
          type: 'message',
          chatId: message.chat,
          content: message.content || 'New message',
          from: message?.sender?.name || 'New message'
        });
      }
      // Update chat list to show new message
      loadChats();
    });

    return () => {
      offReceiveMessage();
    };
  }, [selectedChat]);

  useEffect(() => {
    onMessageReaction(({ messageId, reactions }) => {
      setMessages(prev =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    });

    return () => {
      offMessageReaction();
    };
  }, []);

  useEffect(() => {
    onNotification((note) => {
      pushNotification(note);
    });

    return () => {
      offNotification();
    };
  }, []);

  // Load messages when chat is selected and mark as read
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
      loadScheduledMessages(selectedChat._id);
      joinChat(selectedChat._id);

      // Mark messages as read
      markMessagesAsRead(selectedChat._id);
      const userId = localStorage.getItem('userId');
      emitMessagesRead(selectedChat._id, userId);
      if (!selectedChat.isGroup) {
        setShowPollModal(false);
      }
    }
    if (!selectedChat) {
      setScheduledMessages([]);
    }
    setMessageSearchQuery('');
    setMessageSearchResults([]);
    if (selectedChat) {
      setNotifications((prev) => prev.filter((note) => note.chatId !== selectedChat._id));
    }
  }, [selectedChat]);

  useEffect(() => {
    if (!messageSearchQuery || !selectedChat) {
      setMessageSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchMessages(selectedChat._id, messageSearchQuery);
        setMessageSearchResults(results);
      } catch (error) {
        console.error('Failed to search messages:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [messageSearchQuery, selectedChat]);



  // Load Communities & Events & Groups & Updates
  useEffect(() => {
    if (activeTab === 'communities') {
      loadCommunities();
    } else if (activeTab === 'groups') {
      loadGroups();
    } else if (activeTab === 'events') {
      loadEvents();
    } else if (activeTab === 'updates') {
      loadUpdates();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'updates') return undefined;
    const interval = setInterval(() => {
      loadUpdates();
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'groups' && selectedGroupTab === 'updates') {
      loadUpdates();
    }
  }, [activeTab, selectedGroupTab, selectedGroup]);

  const loadUpdates = async () => {
    try {
      const data = await getUpdates();
      setUpdates(data);
    } catch (error) {
      console.error('Failed to load updates', error);
    }
  };

  const pushNotification = (note) => {
    const id = `${note.type || 'message'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications(prev => [{ id, ...note }, ...prev].slice(0, 50));
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

    const targetLang = chatTargetLanguages[msg._id] || aiTargetLanguage;
    setMessageTranslationLoadingId(msg._id);
    setOpenMessageDropdown(null); // Close dropdown while translating

    try {
      const res = await sendAiMessage(msg.content, {
        includeChats: false,
        mode: 'translate',
        targetLanguage: targetLang
      });

      setTranslatedMessages(prev => ({
        ...prev,
        [msg._id]: {
          language: targetLang,
          text: res.reply
        }
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Translation failed';
      setTranslatedMessages(prev => ({
        ...prev,
        [msg._id]: {
          language: targetLang,
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
      formData.append('name', editName || currentUser?.name || '');
      formData.append('username', editUsername || currentUser?.username || '');
      formData.append('bio', editBio ?? '');
      formData.append('whoAmI', editWhoAmI ?? '');
      formData.append('aboutInfo', editAboutInfo ?? '');
      formData.append('education', editEducation ?? '');
      formData.append('interests', editInterests ?? '');
      if (profileFile) {
        formData.append('profilePic', profileFile);
      }

      const updatedUser = await updateUserProfile(formData);
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditName(updatedUser.name || '');
      setEditUsername(updatedUser.username || '');
      setEditBio(updatedUser.bio || '');
      setEditWhoAmI(updatedUser.whoAmI || '');
      setEditAboutInfo(updatedUser.aboutInfo || '');
      setEditEducation(updatedUser.education || '');
      setEditInterests((updatedUser.interests || []).join(', '));
      // Optional: Show success notification
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  const handleCreateUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (newUpdateImage) formData.append('image', newUpdateImage);
      formData.append('content', newUpdateContent || '');
      formData.append('visibility', newUpdateVisibility);
      if (newUpdateVisibility === 'community' && newUpdateContextId) formData.append('communityId', newUpdateContextId);
      if (newUpdateVisibility === 'group' && newUpdateContextId) formData.append('groupId', newUpdateContextId);
      
      await createUpdate(formData);
      loadUpdates();
      setShowUpdateModal(false);
      setNewUpdateContent('');
      setNewUpdateImage(null);
      setNewUpdateVisibility('contacts');
      setNewUpdateContextId('');
    } catch (error) {
      console.error('Failed to create update', error);
    }
  };

  const loadCommunities = async () => {
    try {
      const data = await getCommunities();
      setCommunities(data);
    } catch (error) {
      console.error('Failed to load communities', error);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups', error);
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
      const payload = {
        name: newCommunityName,
        description: newCommunityDesc,
        category: newCommunityCategory
      };
      if (newCommunityIcon.trim()) {
        payload.icon = newCommunityIcon.trim();
      }
      if (newCommunityCoverImage.trim()) {
        payload.coverImage = newCommunityCoverImage.trim();
      }
      await createCommunity(payload);
      setShowCommunityModal(false);
      setNewCommunityName('');
      setNewCommunityDesc('');
      setNewCommunityIcon('');
      setNewCommunityCoverImage('');
      loadCommunities();
    } catch (error) {
      console.error('Failed to create community', error);
    }
  };

  const handleJoinCommunity = async (id) => {
    try {
      const res = await joinCommunity(id);
      if (res?.pending) {
        alert('Join request sent for approval.');
      } else {
        loadCommunities();
      }
    } catch (error) {
      console.error('Failed to join community', error);
    }
  };

  const handleJoinCommunityByInvite = async () => {
    if (!communityInviteInput.trim()) return;
    try {
      const res = await joinCommunityByInvite(communityInviteInput.trim());
      setCommunityInviteInput('');
      if (res?.pending) {
        alert('Join request sent for approval.');
      } else {
        loadCommunities();
      }
    } catch (error) {
      console.error('Failed to join community via invite', error);
    }
  };

  const handleLeaveCommunity = async (id) => {
    try {
      await leaveCommunity(id);
      loadCommunities();
      if (selectedCommunity && selectedCommunity._id === id) {
        setSelectedCommunity(null);
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Failed to leave community', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newGroupName,
        description: newGroupDesc
      };
      if (newGroupCoverImage.trim()) {
        payload.coverImage = newGroupCoverImage.trim();
      }
      if (newGroupIcon.trim()) {
        payload.icon = newGroupIcon.trim();
      }
      if (newGroupProfileImage.trim()) {
        payload.profileImage = newGroupProfileImage.trim();
      }
      await createGroup(payload);
      setShowGroupModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupCoverImage('');
      setNewGroupIcon('');
      setNewGroupProfileImage('');
      loadGroups();
    } catch (error) {
      console.error('Failed to create group', error);
    }
  };

  const handleJoinGroup = async (id) => {
    try {
      const res = await joinGroup(id);
      if (res?.pending) {
        alert('Join request sent for approval.');
      } else {
        loadGroups();
      }
    } catch (error) {
      console.error('Failed to join group', error);
    }
  };

  const handleJoinGroupByInvite = async () => {
    if (!groupInviteInput.trim()) return;
    try {
      const res = await joinGroupByInvite(groupInviteInput.trim());
      setGroupInviteInput('');
      if (res?.pending) {
        alert('Join request sent for approval.');
      } else {
        loadGroups();
      }
    } catch (error) {
      console.error('Failed to join group via invite', error);
    }
  };

  const handleLeaveGroup = async (id) => {
    try {
      await leaveGroup(id);
      loadGroups();
      if (selectedGroup && selectedGroup._id === id) {
        setSelectedGroup(null);
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Failed to leave group', error);
    }
  };

  const openGroupDetails = async (groupId) => {
    try {
      if (allUsers.length === 0) {
        const users = await getUsers();
        setAllUsers(users);
      }
      const data = await getGroupDetails(groupId);
      setSelectedGroup(data);
      setSelectedGroupTab('chat');
      setEditGroupName(data?.name || '');
      setEditGroupDesc(data?.description || '');
      setEditGroupIcon(data?.icon || '');
      setEditGroupProfileImage(data?.profileImage || '');
      setActiveTab('groups');
      if (data?.isMember && data?.chat) {
        setSelectedChat(data.chat);
      }
    } catch (error) {
      console.error('Failed to load group details', error);
    }
  };

  const openCommunityDetails = async (communityId) => {
    try {
      if (allUsers.length === 0) {
        const users = await getUsers();
        setAllUsers(users);
      }
      const data = await getCommunityDetails(communityId);
      setSelectedCommunity(data);
      setSelectedCommunityTab('announcements');
      setEditCommunityName(data?.name || '');
      setEditCommunityDesc(data?.description || '');
      setEditCommunityIcon(data?.icon || '');
      if (data?.isMember && data?.announcementChat) {
        setSelectedChat(data.announcementChat);
      }
    } catch (error) {
      console.error('Failed to load community details', error);
    }
  };

  const handleAddGroupMember = async () => {
    if (!selectedGroup || !selectedMemberToAdd) return;
    try {
      const updated = await addGroupMembers(selectedGroup._id, [selectedMemberToAdd]);
      setSelectedGroup(updated);
      setSelectedMemberToAdd('');
      loadGroups();
    } catch (error) {
      console.error('Failed to add group member', error);
    }
  };

  const handleRemoveGroupMember = async (memberId) => {
    if (!selectedGroup) return;
    try {
      const updated = await removeGroupMember(selectedGroup._id, memberId);
      setSelectedGroup(updated);
      loadGroups();
    } catch (error) {
      console.error('Failed to remove group member', error);
    }
  };

  const handlePromoteGroupAdmin = async (memberId) => {
    if (!selectedGroup) return;
    try {
      const updated = await promoteGroupAdmin(selectedGroup._id, memberId);
      setSelectedGroup(updated);
      loadGroups();
    } catch (error) {
      console.error('Failed to promote group admin', error);
    }
  };

  const handleDemoteGroupAdmin = async (memberId) => {
    if (!selectedGroup) return;
    try {
      const updated = await demoteGroupAdmin(selectedGroup._id, memberId);
      setSelectedGroup(updated);
      loadGroups();
    } catch (error) {
      console.error('Failed to demote group admin', error);
    }
  };

  const handleGroupSettingsChange = async (updates) => {
    if (!selectedGroup) return;
    try {
      const updated = await updateGroupSettings(selectedGroup._id, updates);
      setSelectedGroup(updated);
      loadGroups();
    } catch (error) {
      console.error('Failed to update group settings', error);
    }
  };

  const handleApproveGroupJoin = async (userId) => {
    if (!selectedGroup) return;
    try {
      const updated = await approveGroupJoinRequest(selectedGroup._id, userId);
      setSelectedGroup(updated);
    } catch (error) {
      console.error('Failed to approve join request', error);
    }
  };

  const handleRejectGroupJoin = async (userId) => {
    if (!selectedGroup) return;
    try {
      const updated = await rejectGroupJoinRequest(selectedGroup._id, userId);
      setSelectedGroup(updated);
    } catch (error) {
      console.error('Failed to reject join request', error);
    }
  };

  const handleRefreshGroupInvite = async () => {
    if (!selectedGroup) return;
    try {
      const res = await getGroupInvite(selectedGroup._id, true);
      setSelectedGroup((prev) => ({ ...prev, inviteCode: res.inviteCode }));
    } catch (error) {
      console.error('Failed to refresh group invite', error);
    }
  };

  const handleSaveGroupDetails = async () => {
    if (!selectedGroup) return;
    try {
      const updated = await updateGroup(selectedGroup._id, {
        name: editGroupName,
        description: editGroupDesc,
        icon: editGroupIcon,
        profileImage: editGroupProfileImage
      });
      setSelectedGroup(updated);
      loadGroups();
    } catch (error) {
      console.error('Failed to update group', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (!window.confirm('Delete this group?')) return;
    try {
      await deleteGroup(selectedGroup._id);
      setSelectedGroup(null);
      setSelectedChat(null);
      loadGroups();
    } catch (error) {
      console.error('Failed to delete group', error);
    }
  };

  const handleAddGroupToCommunity = async () => {
    if (!selectedCommunity || !selectedCommunityGroupToAdd) return;
    try {
      const updated = await addGroupToCommunity(selectedCommunity._id, selectedCommunityGroupToAdd);
      setSelectedCommunity(updated);
      setSelectedCommunityGroupToAdd('');
      loadGroups();
      loadCommunities();
    } catch (error) {
      console.error('Failed to add group to community', error);
    }
  };

  const handleCreateGroupInCommunity = async (e) => {
    e.preventDefault();
    if (!selectedCommunity) return;
    try {
      const payload = {
        name: newGroupName,
        description: newGroupDesc
      };
      if (newGroupIcon.trim()) {
        payload.icon = newGroupIcon.trim();
      }
      if (newGroupProfileImage.trim()) {
        payload.profileImage = newGroupProfileImage.trim();
      }
      const updated = await createGroupInCommunity(selectedCommunity._id, payload);
      setSelectedCommunity(updated);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupIcon('');
      setNewGroupProfileImage('');
      loadGroups();
      loadCommunities();
    } catch (error) {
      console.error('Failed to create group in community', error);
    }
  };

  const handlePromoteCommunityAdmin = async (memberId) => {
    if (!selectedCommunity) return;
    try {
      const updated = await promoteCommunityAdmin(selectedCommunity._id, memberId);
      setSelectedCommunity(updated);
      loadCommunities();
    } catch (error) {
      console.error('Failed to promote community admin', error);
    }
  };

  const handleDemoteCommunityAdmin = async (memberId) => {
    if (!selectedCommunity) return;
    try {
      const updated = await demoteCommunityAdmin(selectedCommunity._id, memberId);
      setSelectedCommunity(updated);
      loadCommunities();
    } catch (error) {
      console.error('Failed to demote community admin', error);
    }
  };

  const handleCommunitySettingsChange = async (updates) => {
    if (!selectedCommunity) return;
    try {
      const updated = await updateCommunitySettings(selectedCommunity._id, updates);
      setSelectedCommunity(updated);
      loadCommunities();
    } catch (error) {
      console.error('Failed to update community settings', error);
    }
  };

  const handleApproveCommunityJoin = async (userId) => {
    if (!selectedCommunity) return;
    try {
      const updated = await approveCommunityJoinRequest(selectedCommunity._id, userId);
      setSelectedCommunity(updated);
    } catch (error) {
      console.error('Failed to approve community join request', error);
    }
  };

  const handleRejectCommunityJoin = async (userId) => {
    if (!selectedCommunity) return;
    try {
      const updated = await rejectCommunityJoinRequest(selectedCommunity._id, userId);
      setSelectedCommunity(updated);
    } catch (error) {
      console.error('Failed to reject community join request', error);
    }
  };

  const handleRefreshCommunityInvite = async () => {
    if (!selectedCommunity) return;
    try {
      const res = await getCommunityInvite(selectedCommunity._id, true);
      setSelectedCommunity((prev) => ({ ...prev, inviteCode: res.inviteCode }));
    } catch (error) {
      console.error('Failed to refresh community invite', error);
    }
  };

  const handleSaveCommunityDetails = async () => {
    if (!selectedCommunity) return;
    try {
      const updated = await updateCommunity(selectedCommunity._id, {
        name: editCommunityName,
        description: editCommunityDesc,
        icon: editCommunityIcon
      });
      setSelectedCommunity(updated);
      loadCommunities();
    } catch (error) {
      console.error('Failed to update community', error);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!selectedCommunity) return;
    if (!window.confirm('Delete this community?')) return;
    try {
      await deleteCommunity(selectedCommunity._id);
      setSelectedCommunity(null);
      setSelectedChat(null);
      loadCommunities();
    } catch (error) {
      console.error('Failed to delete community', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        title: newEventTitle,
        description: newEventDesc,
        date: newEventDate,
        location: newEventLocation,
        coverImage: newEventCoverImage,
        maxAttendees: newEventMaxAttendees ? parseInt(newEventMaxAttendees, 10) : 0
      };
      
      if (newEventVisibility === 'community' && newEventContextId) {
          eventData.communityId = newEventContextId;
      }
      if (newEventVisibility === 'group' && newEventContextId) {
          eventData.groupId = newEventContextId;
      }

      await createEvent(eventData);
      setShowEventModal(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventDate('');
      setNewEventCoverImage('');
      setNewEventMaxAttendees('');
      setNewEventVisibility('contacts');
      setNewEventContextId('');
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
          if (msg?.sender?._id === localStorage.getItem('userId') && msg.status !== 'read') {
            const existing = msg.readBy || [];
            const updatedReadBy = existing.some((id) => id === userId || id?._id === userId) ? existing : [...existing, userId];
            return { ...msg, status: 'read', readBy: updatedReadBy };
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

  const loadScheduledMessages = async (chatId) => {
    try {
      const data = await getScheduledMessages(chatId);
      setScheduledMessages(data);
    } catch (error) {
      console.error('Failed to load scheduled messages:', error);
    }
  };

  const formatScheduleTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const formatRepeatLabel = (schedule) => {
    if (!schedule) return 'once';
    switch (schedule.scheduleType) {
      case 'daily':
        return 'daily';
      case 'weekly':
        return 'weekly';
      case 'monthly':
        return 'monthly';
      case 'custom':
        return `every ${schedule.customInterval || 1} ${schedule.customUnit || 'days'}`;
      default:
        return 'once';
    }
  };

  const handleOpenScheduleModal = () => {
    if (!selectedChat) return;
    setScheduleForm({
      content: newMessage || '',
      scheduledFor: '',
      scheduleType: 'once',
      customInterval: 1,
      customUnit: 'days',
      endsAt: ''
    });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChat) return;
    if (!scheduleForm.content.trim() || !scheduleForm.scheduledFor) return;

    const scheduledDate = new Date(scheduleForm.scheduledFor);
    if (Number.isNaN(scheduledDate.getTime())) return;

    const payload = {
      chatId: selectedChat._id,
      content: scheduleForm.content.trim(),
      scheduledFor: scheduledDate.toISOString(),
      scheduleType: scheduleForm.scheduleType,
      customInterval: scheduleForm.customInterval,
      customUnit: scheduleForm.customUnit,
      endsAt: scheduleForm.endsAt ? new Date(scheduleForm.endsAt).toISOString() : null
    };

    try {
      await scheduleMessage(payload);
      setShowScheduleModal(false);
      setScheduleForm({
        content: '',
        scheduledFor: '',
        scheduleType: 'once',
        customInterval: 1,
        customUnit: 'days',
        endsAt: ''
      });
      setNewMessage('');
      loadScheduledMessages(selectedChat._id);
    } catch (error) {
      console.error('Failed to schedule message:', error);
    }
  };

  const handleCancelSchedule = async (scheduleId) => {
    if (!scheduleId) return;
    try {
      await cancelScheduledMessage(scheduleId);
      setScheduledMessages((prev) => prev.filter((item) => item._id !== scheduleId));
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    if (!messageId || !emoji || !selectedChat) return;
    try {
      const data = await toggleMessageReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg))
      );
      emitMessageReaction(selectedChat._id, data.messageId, data.reactions);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const toastMessage = "Fetching location...";
    // You could set a temporary state here to show loading, but let's just proceed
    // The browser will ask for permissions if not already granted.

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationMessage = `📍 My Location: https://maps.google.com/?q=${latitude},${longitude}`;

        if (!selectedChat) return;

        try {
          const message = await sendMessage(selectedChat._id, locationMessage);
          setMessages(prev => [...prev, message]);
          sendMessageSocket(selectedChat._id, message);
          loadChats();
        } catch (error) {
          console.error('Failed to send location:', error);
        }
      },
      (error) => {
        alert("Unable to retrieve your location");
        console.error("Location error:", error);
      }
    );
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;
    setUploadingAttachment(true);
    try {
      const uploaded = await uploadFile(file);
      setPendingAttachment(uploaded);
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleStartReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleStartEdit = (msg) => {
    setEditingMessage(msg);
    setNewMessage(msg.content || '');
    setReplyingTo(null);
    setPendingAttachment(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleDeleteMessage = async (msg) => {
    try {
      await deleteMessage(msg._id);
      setMessages((prev) =>
        prev.map((item) =>
          item._id === msg._id ? { ...item, isDeleted: true, content: '', attachments: [], poll: null } : item
        )
      );
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleVotePoll = async (messageId, optionIndex) => {
    try {
      const res = await votePoll(messageId, optionIndex);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, poll: res.poll } : msg))
      );
    } catch (error) {
      console.error('Failed to vote on poll:', error);
    }
  };

  const handleTogglePin = async (msg) => {
    if (!selectedGroup) return;
    try {
      const isPinned = (selectedGroup.pinnedMessages || []).some((item) => item?._id === msg._id || item === msg._id);
      const updated = isPinned
        ? await unpinGroupMessage(selectedGroup._id, msg._id)
        : await pinGroupMessage(selectedGroup._id, msg._id);
      setSelectedGroup(updated);
      loadGroups();
    } catch (error) {
      console.error('Failed to update pin:', error);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!selectedChat) return;
    if (!selectedChat.isGroup) {
      alert('Polls are only available in group chats.');
      return;
    }
    const options = pollOptions.map((opt) => opt.trim()).filter(Boolean);
    if (!pollQuestion.trim() || options.length < 2) {
      alert('Poll needs a question and at least two options.');
      return;
    }
    try {
      const message = await sendMessage(selectedChat._id, {
        content: '',
        poll: {
          question: pollQuestion.trim(),
          options
        }
      });
      setMessages((prev) => [...prev, message]);
      sendMessageSocket(selectedChat._id, message);
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
  };

  const handlePollOptionChange = (index, value) => {
    setPollOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const handleAddPollOption = () => {
    setPollOptions((prev) => (prev.length >= 5 ? prev : [...prev, '']));
  };

  const handleRemovePollOption = (index) => {
    setPollOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedChat) return;

    if (editingMessage) {
      if (!newMessage.trim()) return;
      try {
        const updated = await editMessage(editingMessage._id, newMessage.trim());
        setMessages((prev) => prev.map((msg) => (msg._id === updated._id ? updated : msg)));
        setEditingMessage(null);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
      return;
    }

    if (!newMessage.trim() && !pendingAttachment) return;

    try {
      const payload = {
        content: newMessage.trim(),
        attachments: pendingAttachment ? [pendingAttachment] : [],
        replyTo: replyingTo?._id || null
      };
      const message = await sendMessage(selectedChat._id, payload);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setReplyingTo(null);
      setPendingAttachment(null);

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

  const isCurrentUserGroupAdmin = (group) => {
    const userId = localStorage.getItem('userId');
    if (!group) return false;
    if (group.creator?._id === userId || group.creator === userId) return true;
    return (group.admins || []).some((admin) => (admin?._id || admin) === userId);
  };

  const isCurrentUserCommunityAdmin = (community) => {
    const userId = localStorage.getItem('userId');
    if (!community) return false;
    if (community.creator?._id === userId || community.creator === userId) return true;
    return (community.admins || []).some((admin) => (admin?._id || admin) === userId);
  };

  const getChatName = (chat) => {
    if (chat?.isGroup) return chat.name || 'Group Chat';
    const currentUserId = localStorage.getItem('userId');
    const otherUser = chat?.participants?.find(p => p?._id?.toString() !== currentUserId && p?._id !== currentUserId);
    return otherUser?.name || 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (!chat?.isGroup) {
      const currentUserId = localStorage.getItem('userId');
      const otherUser = chat?.participants?.find((p) => p?._id?.toString() !== currentUserId && p?._id !== currentUserId);
      if (otherUser?.profilePic) {
        return <img src={getAvatarUrl(otherUser.profilePic)} alt={otherUser?.name || 'User'} className="avatar-img" />;
      }
    }
    const name = getChatName(chat);
    return name ? name.charAt(0).toUpperCase() : '?';
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
        setEditName(user.name || '');
        setEditUsername(user.username || '');
        setEditBio(user.bio || '');
        setEditWhoAmI(user.whoAmI || '');
        setEditAboutInfo(user.aboutInfo || '');
        setEditEducation(user.education || '');
        setEditInterests((user.interests || []).join(', '));
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

  const renderMessageBody = (msg, { hasMention, pollTotalVotes, pollUserVote }) => {
    const isLocation = typeof msg.content === 'string' && msg.content.includes('ðŸ“ My Location: https://maps.google.com/');
    return (
      <>
        {msg.replyTo && (
          <div className="reply-preview">
            <span className="reply-author">{msg.replyTo?.sender?.name || 'Unknown'}</span>
            <span className="reply-text">
              {msg.replyTo?.isDeleted ? 'Message deleted' : msg.replyTo?.content || (msg.replyTo?.attachments?.length ? 'Attachment' : 'Message')}
            </span>
          </div>
        )}
        {msg.isDeleted ? (
          <p className="message-deleted">Message deleted</p>
        ) : msg.poll ? (
          <div className="poll-card">
            <div className="poll-question">{msg.poll.question}</div>
            <div className="poll-options">
              {(msg.poll.options || []).map((option, idx) => {
                const count = option.votes?.length || 0;
                const isActive = pollUserVote === idx;
                const percent = pollTotalVotes > 0 ? Math.round((count / pollTotalVotes) * 100) : 0;
                return (
                  <button
                    key={`${msg._id}-poll-${idx}`}
                    type="button"
                    className={`poll-option ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (selectedChat?.isGroup) {
                        handleVotePoll(msg._id, idx);
                      }
                    }}
                    disabled={!selectedChat?.isGroup}
                  >
                    <span className="poll-option-text">{option.option}</span>
                    <span className="poll-option-count">{count}</span>
                    <span className="poll-option-bar" style={{ width: `${percent}%` }}></span>
                  </button>
                );
              })}
            </div>
            <div className="poll-footer">{pollTotalVotes} votes</div>
          </div>
        ) : isLocation ? (
          <a
            href={msg.content.replace('ðŸ“ My Location: ', '')}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#38bdf8',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            <MapPin size={18} /> View Location on Map
          </a>
        ) : (
          <p className={hasMention ? 'message-text mention' : 'message-text'}>{msg.content}</p>
        )}
        {!msg.isDeleted && (msg.attachments || []).length > 0 && (
          <div className="file-attachment">
            {(msg.attachments || []).map((file) => {
              const fileUrl = getAvatarUrl(file.url);
              if ((file.mimeType || '').startsWith('image/')) {
                return (
                  <img key={file.url} src={fileUrl} alt={file.fileName || 'attachment'} className="file-image" />
                );
              }
              return (
                <a
                  key={file.url}
                  href={fileUrl}
                  className="file-doc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {file.fileName || 'Download file'}
                </a>
              );
            })}
          </div>
        )}
      </>
    );
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

      // Trigger Bitmoji modal immediately after onboarding
      if (!user.profilePic || user.profilePic === '') {
        setShowBitmojiModal(true);
      }
    } catch (error) {
      console.error('Failed to save onboarding:', error);
    }
  };

  const handleSaveBitmoji = async () => {
    try {
      const bitmojiUrl = `https://api.dicebear.com/7.x/${bitmojiStyle}/svg?seed=${bitmojiSeed}`;

      // Send the URL directly as profile pic
      const formData = new FormData();
      formData.append('name', currentUser.name);

      // we don't have a direct string URL update route easily available without file upload,
      // but if the backend accepts standard json put request for username/bio, we can manually 
      // trigger a fetch to update the profilePic field if the API allows it, or use the image URL on frontend
      // For simplicity, we assume we fetch & download the SVG then upload, or backend accepts URL.
      // Wait, let's look at backend PUT /profile. It expects multipart/form-data. 
      // Let's create a blob from the SVG url.

      const response = await fetch(bitmojiUrl);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.svg', { type: 'image/svg+xml' });
      formData.append('profilePic', file);

      const updatedUser = await updateUserProfile(formData);
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowBitmojiModal(false);
    } catch (error) {
      console.error('Failed to save bitmoji:', error);
      setShowBitmojiModal(false); // fallback close
    }
  };

  // Open new chat modal - load all users
  const handleNewChat = async () => {
    setChatActionError('');
    setSearchQuery('');
    try {
      const users = await getUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    setShowNewChatModal(true);
  };

  // Create 1-on-1 chat
  const handleCreateChat = async (userId) => {
    try {
      const createdChat = await createChat(userId);
      setShowNewChatModal(false);
      setSearchQuery('');
      // Reload chats from server to get fully populated version
      const freshChats = await getChats();
      setChats(freshChats);
      // Find the matching chat from the fresh list so we have full population
      const matched = freshChats.find(c => c._id === createdChat._id) || createdChat;
      setSelectedChat(matched);
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

  // Filter users based on search with smart prioritization - all users can be searched
  const filteredUsers = allUsers
    .filter(user =>
      (user.name?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes((searchQuery || '').toLowerCase())
    )
    .sort((a, b) => {
      const query = (searchQuery || '').toLowerCase();

      // Prioritize exact username matches
      const aUsernameMatch = (a.username?.toLowerCase() || '') === query;
      const bUsernameMatch = (b.username?.toLowerCase() || '') === query;
      if (aUsernameMatch && !bUsernameMatch) return -1;
      if (!aUsernameMatch && bUsernameMatch) return 1;

      // Then prioritize username starts with
      const aUsernameStarts = (a.username?.toLowerCase() || '').startsWith(query);
      const bUsernameStarts = (b.username?.toLowerCase() || '').startsWith(query);
      if (aUsernameStarts && !bUsernameStarts) return -1;
      if (!aUsernameStarts && bUsernameStarts) return 1;

      // Then prioritize name starts with
      const aNameStarts = (a.name?.toLowerCase() || '').startsWith(query);
      const bNameStarts = (b.name?.toLowerCase() || '').startsWith(query);
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;

      // Finally alphabetical by username
      return (a.username || '').localeCompare(b.username || '');
    });

  const filteredChats = chats.filter((chat) => {
    const query = (chatSearchQuery || '').trim().toLowerCase();
    if (!query) return true;
    const chatName = getChatName(chat).toLowerCase();
    const lastMessage = (chat.lastMessage?.content || '').toLowerCase();
    return chatName.includes(query) || lastMessage.includes(query);
  });

  const filteredDiscoverUsers = discoverUsers
    .filter((user) =>
      (user.name?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes((searchQuery || '').toLowerCase())
    );

  const getUpdateVisibilityLabel = (update) => {
    if (!update) return '';
    if (update.visibility === 'community') {
      return update.community?.name ? `community · ${update.community.name}` : 'community';
    }
    if (update.visibility === 'group') {
      return update.group?.name ? `group · ${update.group.name}` : 'group';
    }
    return update.visibility || 'contacts';
  };

  const filteredUpdates = (updates || []).filter((update) => {
    if (updatesFilter === 'all') return true;
    return update.visibility === updatesFilter;
  });

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

  const renderChatWindow = ({ disableInput = false } = {}) => {
    if (!selectedChat) return null;
    const canUsePoll = Boolean(selectedChat?.isGroup);

    return (
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
              {!selectedChat.isGroup && selectedChat.participants && (
                (() => {
                  const otherUser = selectedChat.participants.find(p => p?._id !== localStorage.getItem('userId'));
                  return otherUser && onlineUsers.has(otherUser._id) && (
                    <div className="online-indicator"></div>
                  );
                })()
              )}
            </div>
            <div>
              <h3>{getChatName(selectedChat)}</h3>
              {!selectedChat.isGroup && selectedChat.participants && (
                (() => {
                  const otherUser = selectedChat.participants.find(p => p?._id !== localStorage.getItem('userId'));
                  return otherUser && onlineUsers.has(otherUser._id) && (
                    <span className="online-status-text">online</span>
                  );
                })()
              )}
            </div>
          </div>
          <div className="chat-window-actions">
            <input
              type="text"
              className="chat-search-input"
              placeholder="Search messages..."
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="chat-action-btn"
              onClick={handleOpenScheduleModal}
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
              title="Schedule a message"
              disabled={disableInput}
            >
              <Clock size={18} />
            </button>
          </div>
        </div>

        {scheduledMessages.length > 0 && (
          <div className="scheduled-panel">
            <div className="scheduled-header">
              <span>scheduled messages</span>
              <button
                type="button"
                className="scheduled-add-btn"
                onClick={handleOpenScheduleModal}
                disabled={disableInput}
              >
                add
              </button>
            </div>
            <div className="scheduled-list">
              {scheduledMessages.map((item) => (
                <div key={item._id} className="scheduled-item">
                  <div className="scheduled-meta">
                    <span className="scheduled-time">{formatScheduleTime(item.scheduledFor)}</span>
                    <span className="scheduled-repeat">{formatRepeatLabel(item)}</span>
                  </div>
                  <p className="scheduled-content">{item.content}</p>
                  <button
                    type="button"
                    className="scheduled-cancel"
                    onClick={() => handleCancelSchedule(item._id)}
                    disabled={disableInput}
                  >
                    cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {messageSearchQuery && messageSearchResults.length > 0 && (
          <div className="message-search-results">
            {messageSearchResults.map((result) => (
              <div key={result._id} className="message-search-item">
                <span className="message-search-sender">{result.sender?.name || 'User'}:</span>
                <span className="message-search-text">{result.content || 'Attachment'}</span>
              </div>
            ))}
          </div>
        )}

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
              const isOwn = msg?.sender?._id === currentUserId || msg?.sender === currentUserId;
              const isGroupAdmin = selectedGroup && isCurrentUserGroupAdmin(selectedGroup);
              const isCommunityAdmin = selectedCommunity && isCurrentUserCommunityAdmin(selectedCommunity);
              const canDelete = isOwn || isGroupAdmin || isCommunityAdmin;
              const canEdit = isOwn && !msg.isDeleted && msg.type === 'text';
              const canPin = Boolean(selectedGroup && isGroupAdmin);
              const isPinned = (selectedGroup?.pinnedMessages || []).some((item) => item?._id === msg._id || item === msg._id);
              const hasMention = Boolean(currentUser?.username && typeof msg.content === 'string' && msg.content.includes(`@${currentUser.username}`));
              const pollTotalVotes = (msg.poll?.options || []).reduce((sum, option) => sum + (option.votes?.length || 0), 0);
              const pollUserVote = (msg.poll?.options || []).findIndex((option) =>
                (option.votes || []).some((id) => id?.toString?.() === currentUserId || id === currentUserId || id?._id === currentUserId)
              );
              const reactionSummary = (msg.reactions || []).map((reaction) => {
                const users = reaction.users || [];
                const reacted = users.some((id) => id?.toString?.() === currentUserId || id?._id === currentUserId || id === currentUserId);
                return {
                  emoji: reaction.emoji,
                  count: users.length,
                  reacted
                };
              }).filter((reaction) => reaction.count > 0);

              return (
                <div
                  key={msg._id}
                  className={`message ${isOwn ? 'own' : 'other'}`}
                >
                  <div className="message-content">
                    {!isOwn && <span className="message-sender">{msg?.sender?.name || 'Unknown User'}</span>}
                    {renderMessageBody(msg, { hasMention, pollTotalVotes, pollUserVote })}
                    <div className="message-tools" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                      <button
                        type="button"
                        className="message-action-btn"
                        onClick={() => handleStartReply(msg)}
                        title="Reply"
                      >
                        <Reply size={14} />
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          className="message-action-btn"
                          onClick={() => handleStartEdit(msg)}
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      {canDelete && !msg.isDeleted && (
                        <button
                          type="button"
                          className="message-action-btn"
                          onClick={() => handleDeleteMessage(msg)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {canPin && !msg.isDeleted && (
                        <button
                          type="button"
                          className={`message-action-btn ${isPinned ? 'active' : ''}`}
                          onClick={() => handleTogglePin(msg)}
                          title={isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin size={14} />
                        </button>
                      )}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          className="message-translate-btn"
                          onClick={() => setOpenMessageDropdown(openMessageDropdown === msg._id ? null : msg._id)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {chatTargetLanguages[msg._id] || aiTargetLanguage}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        {openMessageDropdown === msg._id && (
                          <div style={{
                            position: 'absolute', bottom: '100%', left: '0', marginBottom: '4px',
                            background: '#262626', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px', padding: '4px', zIndex: 10,
                            maxHeight: '150px', overflowY: 'auto', width: '120px'
                          }}>
                            {['Hindi', 'Gujarati', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'English'].map(lang => (
                              <div
                                key={lang}
                                onClick={() => {
                                  setChatTargetLanguages(prev => ({ ...prev, [msg._id]: lang }));
                                  setOpenMessageDropdown(null);
                                }}
                                style={{
                                  padding: '6px 8px', fontSize: '0.8rem', color: 'white', cursor: 'pointer',
                                  borderRadius: '4px', background: (chatTargetLanguages[msg._id] || aiTargetLanguage) === lang ? 'rgba(56,189,248,0.2)' : 'transparent'
                                }}
                              >
                                {lang}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="message-translate-btn"
                        onClick={() => handleTranslateChatMessage(msg)}
                        disabled={messageTranslationLoadingId === msg._id}
                        style={{
                          background: 'rgba(56,189,248,0.2)',
                          border: '1px solid rgba(56,189,248,0.4)',
                          color: '#38bdf8',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {messageTranslationLoadingId === msg._id ? 'translating...' : `translate`}
                      </button>
                      <div className="reaction-picker-wrap">
                        <button
                          type="button"
                          className="message-react-btn"
                          onClick={() => setOpenReactionMessageId(openReactionMessageId === msg._id ? null : msg._id)}
                          title="React"
                        >
                          ðŸ™‚
                        </button>
                        {openReactionMessageId === msg._id && (
                          <div className="reaction-picker">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="reaction-choice"
                                onClick={() => {
                                  handleToggleReaction(msg._id, emoji);
                                  setOpenReactionMessageId(null);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {translatedMessages[msg._id] && (
                      <div className="translated-message">
                        <span className="translated-label">{translatedMessages[msg._id].language}:</span>
                        <p>{translatedMessages[msg._id].text}</p>
                      </div>
                    )}
                    {reactionSummary.length > 0 && (
                      <div className="message-reactions">
                        {reactionSummary.map((reaction) => (
                          <button
                            key={reaction.emoji}
                            type="button"
                            className={`reaction-pill ${reaction.reacted ? 'active' : ''}`}
                            onClick={() => handleToggleReaction(msg._id, reaction.emoji)}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="reaction-count">{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                      {msg.editedAt && !msg.isDeleted && (
                        <span className="message-edited">edited</span>
                      )}
                      {isOwn && (
                        <span className={`message-status ${msg.status === 'read' ? 'status-read' : msg.status === 'delivered' ? 'status-delivered' : 'status-sent'}`}>
                          {msg.status === 'read' ? 'âœ“âœ“' : msg.status === 'delivered' ? 'âœ“âœ“' : 'âœ“'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

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

          {(replyingTo || editingMessage || pendingAttachment) && (
            <div className="message-draft-bar">
              {replyingTo && (
                <div className="draft-chip">
                  <span>replying to {replyingTo?.sender?.name || 'message'}</span>
                  <button type="button" onClick={handleCancelReply} className="draft-clear-btn">x</button>
                </div>
              )}
              {editingMessage && (
                <div className="draft-chip">
                  <span>editing message</span>
                  <button type="button" onClick={handleCancelEdit} className="draft-clear-btn">x</button>
                </div>
              )}
              {pendingAttachment && (
                <div className="draft-chip">
                  <span>{pendingAttachment.fileName || 'attachment ready'}</span>
                  <button type="button" onClick={() => setPendingAttachment(null)} className="draft-clear-btn">x</button>
                </div>
              )}
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
              disabled={disableInput || uploadingAttachment}
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              className="input-action-btn"
              onClick={handleShareLocation}
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
              title="Share Location"
              disabled={disableInput}
            >
              <MapPin size={20} />
            </button>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />
            {canUsePoll && (
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPollModal(true)}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
                title="Create poll"
                disabled={disableInput}
              >
                <Users size={20} />
              </button>
            )}
            <button
              type="button"
              className="input-action-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
              title="Add emoji"
              disabled={disableInput}
            >
              <Smile size={20} />
            </button>
            <button
              type="button"
              className="input-action-btn"
              onClick={handleOpenScheduleModal}
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
              title="Schedule message"
              disabled={disableInput}
            >
              <Clock size={20} />
            </button>
          </div>

          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={disableInput ? 'Only admins can send messages' : 'Type a message...'}
            className="message-input"
            onMouseEnter={() => setCursorSize(60)}
            onMouseLeave={() => setCursorSize(40)}
            disabled={disableInput}
          />
          <button
            type="submit"
            className="send-message-btn"
            onMouseEnter={() => setCursorSize(60)}
            onMouseLeave={() => setCursorSize(40)}
            disabled={disableInput}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    );
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
            {NAV_TABS.map(tab => (
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
              onClick={() => setShowNotifications((prev) => !prev)}
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="notif-badge">{notifications.length}</span>
              )}
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
              onClick={() => {
                setActiveTab('settings');
                setIsMobileMenuOpen(false);
              }}
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
          {NAV_TABS.map(tab => (
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

      {showNotifications && (
        <div className="notification-panel">
          <div className="notification-header">
            <span>Notifications</span>
            <button type="button" className="notification-clear" onClick={() => setNotifications([])}>clear</button>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map((note) => (
                <div key={note.id} className="notification-item">
                  <div className="notification-title">{note.type || 'message'}</div>
                  <div className="notification-body">{note.content || 'New activity'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
                      {!selectedChat.isGroup && selectedChat.participants && (
                        (() => {
                          const otherUser = selectedChat.participants.find(p => p?._id !== localStorage.getItem('userId'));
                          return otherUser && onlineUsers.has(otherUser._id) && (
                            <div className="online-indicator"></div>
                          );
                        })()
                      )}
                    </div>
                    <div>
                      <h3>{getChatName(selectedChat)}</h3>
                      {!selectedChat.isGroup && selectedChat.participants && (
                        (() => {
                          const otherUser = selectedChat.participants.find(p => p?._id !== localStorage.getItem('userId'));
                          return otherUser && onlineUsers.has(otherUser._id) && (
                            <span className="online-status-text">online</span>
                          );
                        })()
                      )}
                    </div>
                  </div>
                  <div className="chat-window-actions">
                    <button
                      type="button"
                      className="chat-action-btn"
                      onClick={handleOpenScheduleModal}
                      onMouseEnter={() => setCursorSize(60)}
                      onMouseLeave={() => setCursorSize(40)}
                      title="Schedule a message"
                    >
                      <Clock size={18} />
                    </button>
                  </div>
                </div>

                {scheduledMessages.length > 0 && (
                  <div className="scheduled-panel">
                    <div className="scheduled-header">
                      <span>scheduled messages</span>
                      <button
                        type="button"
                        className="scheduled-add-btn"
                        onClick={handleOpenScheduleModal}
                      >
                        add
                      </button>
                    </div>
                    <div className="scheduled-list">
                      {scheduledMessages.map((item) => (
                        <div key={item._id} className="scheduled-item">
                          <div className="scheduled-meta">
                            <span className="scheduled-time">{formatScheduleTime(item.scheduledFor)}</span>
                            <span className="scheduled-repeat">{formatRepeatLabel(item)}</span>
                          </div>
                          <p className="scheduled-content">{item.content}</p>
                          <button
                            type="button"
                            className="scheduled-cancel"
                            onClick={() => handleCancelSchedule(item._id)}
                          >
                            cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      const isOwn = msg?.sender?._id === currentUserId || msg?.sender === currentUserId;
                      const isGroupAdmin = selectedGroup && isCurrentUserGroupAdmin(selectedGroup);
                      const isCommunityAdmin = selectedCommunity && isCurrentUserCommunityAdmin(selectedCommunity);
                      const canDelete = isOwn || isGroupAdmin || isCommunityAdmin;
                      const canEdit = isOwn && !msg.isDeleted && msg.type === 'text';
                      const canPin = Boolean(selectedGroup && isGroupAdmin);
                      const isPinned = (selectedGroup?.pinnedMessages || []).some((item) => item?._id === msg._id || item === msg._id);
                      const hasMention = Boolean(currentUser?.username && typeof msg.content === 'string' && msg.content.includes(`@${currentUser.username}`));
                      const pollTotalVotes = (msg.poll?.options || []).reduce((sum, option) => sum + (option.votes?.length || 0), 0);
                      const pollUserVote = (msg.poll?.options || []).findIndex((option) =>
                        (option.votes || []).some((id) => id?.toString?.() === currentUserId || id === currentUserId || id?._id === currentUserId)
                      );
                      const reactionSummary = (msg.reactions || []).map((reaction) => {
                        const users = reaction.users || [];
                        const reacted = users.some((id) => id?.toString?.() === currentUserId || id?._id === currentUserId || id === currentUserId);
                        return {
                          emoji: reaction.emoji,
                          count: users.length,
                          reacted
                        };
                      }).filter((reaction) => reaction.count > 0);
                      return (
                        <div
                          key={msg._id}
                          className={`message ${isOwn ? 'own' : 'other'}`}
                        >
                          <div className="message-content">
                            {!isOwn && <span className="message-sender">{msg?.sender?.name || 'Unknown User'}</span>}
                            {renderMessageBody(msg, { hasMention, pollTotalVotes, pollUserVote })}
                            <div className="message-tools" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                              <button
                                type="button"
                                className="message-action-btn"
                                onClick={() => handleStartReply(msg)}
                                title="Reply"
                              >
                                <Reply size={14} />
                              </button>
                              {canEdit && (
                                <button
                                  type="button"
                                  className="message-action-btn"
                                  onClick={() => handleStartEdit(msg)}
                                  title="Edit"
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}
                              {canDelete && !msg.isDeleted && (
                                <button
                                  type="button"
                                  className="message-action-btn"
                                  onClick={() => handleDeleteMessage(msg)}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                              {canPin && !msg.isDeleted && (
                                <button
                                  type="button"
                                  className={`message-action-btn ${isPinned ? 'active' : ''}`}
                                  onClick={() => handleTogglePin(msg)}
                                  title={isPinned ? 'Unpin' : 'Pin'}
                                >
                                  <Pin size={14} />
                                </button>
                              )}
                              <div style={{ position: 'relative' }}>
                                <button
                                  type="button"
                                  className="message-translate-btn"
                                  onClick={() => setOpenMessageDropdown(openMessageDropdown === msg._id ? null : msg._id)}
                                  style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {chatTargetLanguages[msg._id] || aiTargetLanguage}
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                {openMessageDropdown === msg._id && (
                                  <div style={{
                                    position: 'absolute', bottom: '100%', left: '0', marginBottom: '4px',
                                    background: '#262626', border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px', padding: '4px', zIndex: 10,
                                    maxHeight: '150px', overflowY: 'auto', width: '120px'
                                  }}>
                                    {['Hindi', 'Gujarati', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'English'].map(lang => (
                                      <div
                                        key={lang}
                                        onClick={() => {
                                          setChatTargetLanguages(prev => ({ ...prev, [msg._id]: lang }));
                                          setOpenMessageDropdown(null);
                                        }}
                                        style={{
                                          padding: '6px 8px', fontSize: '0.8rem', color: 'white', cursor: 'pointer',
                                          borderRadius: '4px', background: (chatTargetLanguages[msg._id] || aiTargetLanguage) === lang ? 'rgba(56,189,248,0.2)' : 'transparent'
                                        }}
                                      >
                                        {lang}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                className="message-translate-btn"
                                onClick={() => handleTranslateChatMessage(msg)}
                                disabled={messageTranslationLoadingId === msg._id}
                                style={{
                                  background: 'rgba(56,189,248,0.2)',
                                  border: '1px solid rgba(56,189,248,0.4)',
                                  color: '#38bdf8',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {messageTranslationLoadingId === msg._id ? 'translating...' : `translate`}
                              </button>
                              <div className="reaction-picker-wrap">
                                <button
                                  type="button"
                                  className="message-react-btn"
                                  onClick={() => setOpenReactionMessageId(openReactionMessageId === msg._id ? null : msg._id)}
                                  title="React"
                                >
                                  🙂
                                </button>
                                {openReactionMessageId === msg._id && (
                                  <div className="reaction-picker">
                                    {QUICK_REACTIONS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        className="reaction-choice"
                                        onClick={() => {
                                          handleToggleReaction(msg._id, emoji);
                                          setOpenReactionMessageId(null);
                                        }}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            {translatedMessages[msg._id] && (
                              <div className="translated-message">
                                <span className="translated-label">{translatedMessages[msg._id].language}:</span>
                                <p>{translatedMessages[msg._id].text}</p>
                              </div>
                            )}
                            {reactionSummary.length > 0 && (
                              <div className="message-reactions">
                                {reactionSummary.map((reaction) => (
                                  <button
                                    key={reaction.emoji}
                                    type="button"
                                    className={`reaction-pill ${reaction.reacted ? 'active' : ''}`}
                                    onClick={() => handleToggleReaction(msg._id, reaction.emoji)}
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span className="reaction-count">{reaction.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <span className="message-time">{formatTime(msg.createdAt)}</span>
                              {msg.editedAt && !msg.isDeleted && (
                                <span className="message-edited">edited</span>
                              )}
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

                  {(replyingTo || editingMessage || pendingAttachment) && (
                    <div className="message-draft-bar">
                      {replyingTo && (
                        <div className="draft-chip">
                          <span>replying to {replyingTo?.sender?.name || 'message'}</span>
                          <button type="button" onClick={handleCancelReply} className="draft-clear-btn">x</button>
                        </div>
                      )}
                      {editingMessage && (
                        <div className="draft-chip">
                          <span>editing message</span>
                          <button type="button" onClick={handleCancelEdit} className="draft-clear-btn">x</button>
                        </div>
                      )}
                      {pendingAttachment && (
                        <div className="draft-chip">
                          <span>{pendingAttachment.fileName || 'attachment ready'}</span>
                          <button type="button" onClick={() => setPendingAttachment(null)} className="draft-clear-btn">x</button>
                        </div>
                      )}
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
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={handleShareLocation}
                      onMouseEnter={() => setCursorSize(60)}
                      onMouseLeave={() => setCursorSize(40)}
                      title="Share Location"
                    >
                      <MapPin size={20} />
                    </button>
                    <input
                      type="file"
                      id="file-upload"
                      style={{ display: 'none' }}
                      onChange={handleFileSelected}
                    />
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => setShowPollModal(true)}
                      onMouseEnter={() => setCursorSize(60)}
                      onMouseLeave={() => setCursorSize(40)}
                      title="Create poll"
                    >
                      <Users size={20} />
                    </button>
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
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={handleOpenScheduleModal}
                      onMouseEnter={() => setCursorSize(60)}
                      onMouseLeave={() => setCursorSize(40)}
                      title="Schedule message"
                    >
                      <Clock size={20} />
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
                  <div className="custom-lang-select-container" ref={langDropdownRef}>
                    <div
                      className={`custom-lang-select-trigger ${showLangDropdown ? 'open' : ''}`}
                      onClick={() => setShowLangDropdown(!showLangDropdown)}
                    >
                      {aiTargetLanguage}
                      <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                    {showLangDropdown && (
                      <div className="custom-lang-options-list">
                        {['Hindi', 'Gujarati', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese', 'Konkani', 'Maithili', 'Sanskrit'].map(lang => (
                          <div
                            key={lang}
                            className={`custom-lang-option ${aiTargetLanguage === lang ? 'selected' : ''}`}
                            onClick={() => {
                              setAiTargetLanguage(lang);
                              setShowLangDropdown(false);
                            }}
                          >
                            {lang}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
              {!selectedCommunity && (
                <button
                  className="action-btn"
                  onClick={() => setShowCommunityModal(true)}
                  onMouseEnter={() => setCursorSize(60)}
                  onMouseLeave={() => setCursorSize(40)}
                >
                  create
                </button>
              )}
            </div>

            {selectedCommunity ? (
              <div className="detail-view">
                <button 
                  className="back-btn" 
                  onClick={() => { setSelectedCommunity(null); setSelectedChat(null); }}
                  style={{ marginBottom: '20px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ArrowLeft size={16} /> back to communities
                </button>
                <div className="detail-header" style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div className="avatar-large" style={{ fontSize: '3rem' }}>
                      {selectedCommunity.icon && (selectedCommunity.icon.startsWith('http') || selectedCommunity.icon.startsWith('/uploads')) ? (
                        <img src={getAvatarUrl(selectedCommunity.icon)} alt={selectedCommunity.name || 'Community'} />
                      ) : (
                        selectedCommunity.icon || selectedCommunity.name?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2>{selectedCommunity.name}</h2>
                      <p style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedCommunity.category} · {selectedCommunity.members?.length || 0} members</p>
                    </div>
                  </div>
                  <p>{selectedCommunity.description}</p>
                  {selectedCommunity.rules && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '10px' }}>Rules:</h4>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>{selectedCommunity.rules}</p>
                    </div>
                  )}
                  <button
                    className="join-btn"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}
                    onClick={() => handleLeaveCommunity(selectedCommunity._id)}
                  >
                    leave community
                  </button>
                </div>
                
                <div className="detail-tabs">
                  {['announcements', 'groups', 'members', 'settings'].map((tab) => (
                    <button
                      key={tab}
                      className={`detail-tab ${selectedCommunityTab === tab ? 'active' : ''}`}
                      onClick={() => setSelectedCommunityTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {selectedCommunityTab === 'announcements' && (
                  <div className="community-announcements">
                    {renderChatWindow({ disableInput: !isCurrentUserCommunityAdmin(selectedCommunity) })}
                  </div>
                )}

                {selectedCommunityTab === 'members' && (
                  <div className="member-panel">
                    <div className="member-list">
                      {(selectedCommunity.members || []).map((member) => {
                        const memberId = member?._id || member;
                        const isCreator = (selectedCommunity.creator?._id || selectedCommunity.creator) === memberId;
                        const isAdmin = (selectedCommunity.admins || []).some((admin) => (admin?._id || admin) === memberId) || isCreator;
                        return (
                          <div key={memberId} className="member-row">
                            <div className="member-info">
                              <span className="member-name">{member?.name || 'Member'}</span>
                              {isCreator && <span className="member-role">creator</span>}
                              {!isCreator && isAdmin && <span className="member-role">admin</span>}
                              {!isAdmin && <span className="member-role">member</span>}
                            </div>
                            {isCurrentUserCommunityAdmin(selectedCommunity) && (memberId !== localStorage.getItem('userId')) && (
                              <div className="member-actions">
                                {isAdmin && !isCreator ? (
                                  <button type="button" onClick={() => handleDemoteCommunityAdmin(memberId)}>demote</button>
                                ) : (
                                  <button type="button" onClick={() => handlePromoteCommunityAdmin(memberId)}>promote</button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {isCurrentUserCommunityAdmin(selectedCommunity) && (selectedCommunity.joinRequests || []).length > 0 && (
                      <div className="join-requests">
                        <h4>Join requests</h4>
                        {(selectedCommunity.joinRequests || []).map((reqUser) => (
                          <div key={reqUser?._id || reqUser} className="join-request-row">
                            <span>{reqUser?.name || reqUser?.username || 'User'}</span>
                            <div className="member-actions">
                              <button type="button" onClick={() => handleApproveCommunityJoin(reqUser?._id || reqUser)}>approve</button>
                              <button type="button" onClick={() => handleRejectCommunityJoin(reqUser?._id || reqUser)}>reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedCommunityTab === 'settings' && (
                  <div className="settings-panel">
                    <div className="settings-row">
                      <span>Name</span>
                      <input
                        type="text"
                        className="modal-input"
                        value={editCommunityName}
                        onChange={(e) => setEditCommunityName(e.target.value)}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Description</span>
                      <input
                        type="text"
                        className="modal-input"
                        value={editCommunityDesc}
                        onChange={(e) => setEditCommunityDesc(e.target.value)}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Icon (emoji or image URL)</span>
                      <input
                        type="text"
                        className="modal-input"
                        value={editCommunityIcon}
                        onChange={(e) => setEditCommunityIcon(e.target.value)}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Require join approval</span>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedCommunity?.settings?.requireApproval)}
                        onChange={(e) => handleCommunitySettingsChange({ requireApproval: e.target.checked })}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Invite code</span>
                      <div className="invite-row">
                        <span className="invite-code">{selectedCommunity.inviteCode || 'not set'}</span>
                        <button type="button" onClick={handleRefreshCommunityInvite}>refresh</button>
                      </div>
                    </div>
                    <div className="settings-row">
                      <button type="button" className="create-group-btn" onClick={handleSaveCommunityDetails}>save changes</button>
                      <button type="button" className="secondary-btn" onClick={handleDeleteCommunity}>delete community</button>
                    </div>
                  </div>
                )}

                                {selectedCommunityTab === 'groups' && (
                  <div className="community-groups-panel">
                    {isCurrentUserCommunityAdmin(selectedCommunity) && (
                      <div className="member-add">
                        <select
                          value={selectedCommunityGroupToAdd}
                          onChange={(e) => setSelectedCommunityGroupToAdd(e.target.value)}
                        >
                          <option value="">Select group to add</option>
                          {groups
                            .filter((group) => !(selectedCommunity.groups || []).some((cg) => (cg?._id || cg) === group._id))
                            .map((group) => (
                              <option key={group._id} value={group._id}>
                                {group.name}
                              </option>
                            ))}
                        </select>
                        <button type="button" className="create-group-btn" onClick={handleAddGroupToCommunity}>add group</button>
                      </div>
                    )}
                    {isCurrentUserCommunityAdmin(selectedCommunity) && (
                      <form onSubmit={handleCreateGroupInCommunity} className="create-group-inline">
                        <input
                          type="text"
                          placeholder="New group name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Icon (emoji)"
                          value={newGroupIcon}
                          onChange={(e) => setNewGroupIcon(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Profile image URL (optional)"
                          value={newGroupProfileImage}
                          onChange={(e) => setNewGroupProfileImage(e.target.value)}
                        />
                        <button type="submit" className="create-group-btn">create group</button>
                      </form>
                    )}
                    <div className="communities-grid">
                      {(selectedCommunity.groups || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.5)' }}>
                          No groups in this community yet.
                        </div>
                      ) : (
                        (selectedCommunity.groups || []).map((group) => (
                          <div
                            key={group._id}
                            className="community-card"
                            onClick={() => openGroupDetails(group._id)}
                          >
                            <div className="community-header">
                              <div className="community-avatar-large">
                                {group.profileImage ? (
                                  <img src={getAvatarUrl(group.profileImage)} alt={group.name || 'Group'} />
                                ) : (
                                  group.icon || group.name?.charAt(0)?.toUpperCase()
                                )}
                              </div>
                            </div>
                            <h3>{group.name}</h3>
                            <p className="community-category">Group</p>
                            <p className="community-members">{group.members?.length || 0} members</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <>
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="search communities..."
                    className="search-input"
                  />
                </div>
                <div className="invite-join">
                  <input
                    type="text"
                    value={communityInviteInput}
                    onChange={(e) => setCommunityInviteInput(e.target.value)}
                    placeholder="Join via invite code..."
                  />
                  <button type="button" className="create-group-btn" onClick={handleJoinCommunityByInvite}>join</button>
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
                        onClick={() => {
                          if (community.members.some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId'))) {
                            openCommunityDetails(community._id);
                          }
                        }}
                      >
                        <div className="community-header">
                          <div className="community-avatar-large">
                            {community.icon && (community.icon.startsWith('http') || community.icon.startsWith('/uploads')) ? (
                              <img src={getAvatarUrl(community.icon)} alt={community.name || 'Community'} />
                            ) : (
                              community.icon || community.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                        </div>
                        <h3>{community.name}</h3>
                        <p className="community-category">{community.category}</p>
                        <p className="community-members">{community.members?.length || 0} members</p>
                        {(community.members || []).some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId')) ? (
                          <button
                            className="join-btn"
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
                            onClick={(e) => { e.stopPropagation(); handleLeaveCommunity(community._id); }}
                            onMouseEnter={() => setCursorSize(60)}
                            onMouseLeave={() => setCursorSize(40)}
                          >
                            leave
                          </button>
                        ) : (
                          <button
                            className="join-btn"
                            onClick={(e) => { e.stopPropagation(); handleJoinCommunity(community._id); }}
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
              </>
            )}
          </div>
        )}

        {/* Groups Section */}
        {activeTab === 'groups' && (
          <div className="section-content">
            <div className="section-header">
              <h2>groups</h2>
              {!selectedGroup && (
                <button
                  className="action-btn"
                  onClick={() => setShowGroupModal(true)}
                  onMouseEnter={() => setCursorSize(60)}
                  onMouseLeave={() => setCursorSize(40)}
                >
                  create
                </button>
              )}
            </div>

            {selectedGroup ? (
              <div className="detail-view">
                <button 
                  className="back-btn" 
                  onClick={() => { setSelectedGroup(null); setSelectedChat(null); }}
                  style={{ marginBottom: '20px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ArrowLeft size={16} /> back to groups
                </button>
                <div className="detail-header" style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div className="avatar-large" style={{ fontSize: '3rem' }}>
                      {selectedGroup.profileImage ? (
                        <img src={getAvatarUrl(selectedGroup.profileImage)} alt={selectedGroup.name || 'Group'} />
                      ) : (
                        selectedGroup.icon || selectedGroup.name?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2>{selectedGroup.name}</h2>
                      <p style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedGroup.members?.length || 0} members</p>
                    </div>
                  </div>
                  <p>{selectedGroup.description}</p>
                  <button
                    className="join-btn"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}
                    onClick={() => handleLeaveGroup(selectedGroup._id)}
                  >
                    leave group
                  </button>
                </div>
                
                                <div className="detail-tabs">
                  {['chat', 'members', 'settings', 'updates', 'events'].map((tab) => (
                    <button
                      key={tab}
                      className={`detail-tab ${selectedGroupTab === tab ? 'active' : ''}`}
                      onClick={() => setSelectedGroupTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {selectedGroupTab === 'chat' && (
                  <div className="group-chat-panel">
                    {(selectedGroup.pinnedMessages || []).length > 0 && (
                      <div className="pinned-panel">
                        <div className="pinned-header">pinned messages</div>
                        {(selectedGroup.pinnedMessages || []).map((pin) => (
                          <div key={pin?._id || pin} className="pinned-item">
                            {pin?.content || (pin?.attachments?.length ? 'Attachment' : 'Pinned message')}
                          </div>
                        ))}
                      </div>
                    )}
                    {renderChatWindow({ disableInput: selectedGroup?.settings?.adminsOnly && !isCurrentUserGroupAdmin(selectedGroup) })}
                  </div>
                )}

                {selectedGroupTab === 'members' && (
                  <div className="member-panel">
                    {isCurrentUserGroupAdmin(selectedGroup) && (
                      <div className="member-add">
                        <select
                          value={selectedMemberToAdd}
                          onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                        >
                          <option value="">Select user to add</option>
                          {allUsers
                            .filter((user) => !(selectedGroup.members || []).some((m) => (m?._id || m) === user._id))
                            .map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.name} (@{user.username})
                              </option>
                            ))}
                        </select>
                        <button type="button" className="create-group-btn" onClick={handleAddGroupMember}>add</button>
                      </div>
                    )}
                    <div className="member-list">
                      {(selectedGroup.members || []).map((member) => {
                        const memberId = member?._id || member;
                        const isCreator = (selectedGroup.creator?._id || selectedGroup.creator) === memberId;
                        const isAdmin = (selectedGroup.admins || []).some((admin) => (admin?._id || admin) === memberId) || isCreator;
                        return (
                          <div key={memberId} className="member-row">
                            <div className="member-info">
                              <span className="member-name">{member?.name || 'Member'}</span>
                              {isCreator && <span className="member-role">creator</span>}
                              {!isCreator && isAdmin && <span className="member-role">admin</span>}
                              {!isAdmin && <span className="member-role">member</span>}
                            </div>
                            {isCurrentUserGroupAdmin(selectedGroup) && (memberId !== localStorage.getItem('userId')) && (
                              <div className="member-actions">
                                {isAdmin && !isCreator ? (
                                  <button type="button" onClick={() => handleDemoteGroupAdmin(memberId)}>demote</button>
                                ) : (
                                  <button type="button" onClick={() => handlePromoteGroupAdmin(memberId)}>promote</button>
                                )}
                                {!isCreator && (
                                  <button type="button" onClick={() => handleRemoveGroupMember(memberId)}>remove</button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {isCurrentUserGroupAdmin(selectedGroup) && (selectedGroup.joinRequests || []).length > 0 && (
                      <div className="join-requests">
                        <h4>Join requests</h4>
                        {(selectedGroup.joinRequests || []).map((reqUser) => (
                          <div key={reqUser?._id || reqUser} className="join-request-row">
                            <span>{reqUser?.name || reqUser?.username || 'User'}</span>
                            <div className="member-actions">
                              <button type="button" onClick={() => handleApproveGroupJoin(reqUser?._id || reqUser)}>approve</button>
                              <button type="button" onClick={() => handleRejectGroupJoin(reqUser?._id || reqUser)}>reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedGroupTab === 'settings' && (
                  <div className="settings-panel">
                    <div className="settings-row">
                      <span>Name</span>
                      <input
                        type="text"
                        className="modal-input"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Description</span>
                      <input
                        type="text"
                        className="modal-input"
                        value={editGroupDesc}
                        onChange={(e) => setEditGroupDesc(e.target.value)}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Icon (emoji)</span>
                      <input
                        type="text"
                        className="modal-input"
                        value={editGroupIcon}
                        onChange={(e) => setEditGroupIcon(e.target.value)}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Profile image URL</span>
                      <input
                        type="text"
                        className="modal-input"
                        value={editGroupProfileImage}
                        onChange={(e) => setEditGroupProfileImage(e.target.value)}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Admins only mode</span>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedGroup?.settings?.adminsOnly)}
                        onChange={(e) => handleGroupSettingsChange({ adminsOnly: e.target.checked })}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Require join approval</span>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedGroup?.settings?.requireApproval)}
                        onChange={(e) => handleGroupSettingsChange({ requireApproval: e.target.checked })}
                      />
                    </div>
                    <div className="settings-row">
                      <span>Invite code</span>
                      <div className="invite-row">
                        <span className="invite-code">{selectedGroup.inviteCode || 'not set'}</span>
                        <button type="button" onClick={handleRefreshGroupInvite}>refresh</button>
                      </div>
                    </div>
                    <div className="settings-row">
                      <button type="button" className="create-group-btn" onClick={handleSaveGroupDetails}>save changes</button>
                      <button type="button" className="secondary-btn" onClick={handleDeleteGroup}>delete group</button>
                    </div>
                  </div>
                )}

                {(selectedGroupTab === 'updates' || selectedGroupTab === 'events') && (
                <div className="detail-feeds" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div>
                    <h3>Group Updates</h3>
                    <div className="updates-feed" style={{ marginTop: '20px' }}>
                      {(updates || []).filter(u => u.group && u.group._id === selectedGroup._id).map(update => (
                        <div key={update._id} className="feed-item" style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                          <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                              {update.author?.profilePic ? (
                                <img src={getAvatarUrl(update.author.profilePic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              ) : (
                                update.author?.name?.charAt(0)?.toUpperCase() || 'U'
                              )}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '0.9rem' }}>{update.author?.name || 'User'}</h4>
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
                  <div>
                    <h3>Group Events</h3>
                    <div className="events-list" style={{ marginTop: '20px' }}>
                      {(events || []).filter(e => e.group && e.group._id === selectedGroup._id).map(event => (
                        <div key={event._id} className="event-card" style={{ marginBottom: '20px' }}>
                          <div className="event-date-badge">
                            <span className="date-day">{new Date(event.date).getDate()}</span>
                            <span className="date-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                          </div>
                          <div className="event-details">
                            <h3>{event.title}</h3>
                            <div className="event-meta">
                              <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>· {event.location}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )}

              </div>
            ) : (
              <>
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="search groups..."
                    className="search-input"
                  />
                </div>
                <div className="invite-join">
                  <input
                    type="text"
                    value={groupInviteInput}
                    onChange={(e) => setGroupInviteInput(e.target.value)}
                    placeholder="Join via invite code..."
                  />
                  <button type="button" className="create-group-btn" onClick={handleJoinGroupByInvite}>join</button>
                </div>

                <div className="communities-grid">
                  {groups.length === 0 ? (
                    <div style={{ colSpan: 'full', textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      No groups found. Create the first one!
                    </div>
                  ) : (
                    groups.map((group) => (
                      <div
                        key={group._id}
                        className="community-card"
                        onMouseEnter={() => setCursorSize(70)}
                        onMouseLeave={() => setCursorSize(40)}
                        onClick={() => {
                          if (group.members.some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId'))) {
                            openGroupDetails(group._id);
                          }
                        }}
                      >
                        <div className="community-header">
                          <div className="community-avatar-large">
                            {group.profileImage ? (
                              <img src={getAvatarUrl(group.profileImage)} alt={group.name || 'Group'} />
                            ) : (
                              group.icon || group.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                        </div>
                        <h3>{group.name}</h3>
                        <p className="community-category">Group</p>
                        <p className="community-members">{group.members?.length || 0} members</p>
                        {(group.members || []).some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId')) ? (
                          <button
                            className="join-btn"
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
                            onClick={(e) => { e.stopPropagation(); handleLeaveGroup(group._id); }}
                            onMouseEnter={() => setCursorSize(60)}
                            onMouseLeave={() => setCursorSize(40)}
                          >
                            leave
                          </button>
                        ) : (
                          <button
                            className="join-btn"
                            onClick={(e) => { e.stopPropagation(); handleJoinGroup(group._id); }}
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
              </>
            )}
          </div>
        )}

        {/* Updates Section */}
        {activeTab === 'updates' && (
          <div className="section-content">
            <div className="section-header">
              <h2>updates</h2>
              <button
                className="action-btn"
                onClick={() => setShowUpdateModal(true)}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                post update
              </button>
            </div>
            <div className="updates-toolbar">
              <div className="updates-filter">
                <span className="updates-filter-label">show</span>
                <select
                  value={updatesFilter}
                  onChange={(e) => setUpdatesFilter(e.target.value)}
                  className="updates-filter-select"
                >
                  <option value="all">all</option>
                  <option value="contacts">contacts</option>
                  <option value="public">public</option>
                  <option value="community">community</option>
                  <option value="group">group</option>
                </select>
              </div>
              <button
                type="button"
                className="secondary-btn"
                onClick={loadUpdates}
              >
                refresh
              </button>
            </div>

            <div className="updates-stories">
              <div
                className="story-item add-story"
                onClick={() => setShowUpdateModal(true)}
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

              {filteredUpdates.map((update) => (
                <div key={update._id} className="story-item">
                  <div className="story-ring active">
                    <div className="story-content">
                      {/* Show user avatar or update image */}
                      {update.author?.profilePic ? (
                        <img src={getAvatarUrl(update.author.profilePic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        update.author?.name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                  </div>
                  <span>{update.author?.name?.split(' ')[0] || 'User'}</span>
                </div>
              ))}
            </div>

            <div className="updates-feed" style={{ marginTop: '40px' }}>
              {filteredUpdates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' }}>
                  No updates for this filter yet.
                </div>
              ) : (
                filteredUpdates.map(update => (
                <div key={update._id} className="feed-item" style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                  <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                      {update.author?.profilePic ? (
                        <img src={getAvatarUrl(update.author.profilePic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        update.author?.name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem' }}>{update.author?.name || 'User'}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(update.createdAt).toLocaleDateString()} · {getUpdateVisibilityLabel(update)}
                      </span>
                    </div>
                  </div>
                  {update.image && (
                    <div className="feed-image" style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
                      <img src={getAvatarUrl(update.image)} alt="Update" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}
                  <p>{update.content || 'Shared an update'}</p>
                </div>
              ))
              )}
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
                          <span className="hide-mobile">{event.attendees?.length || 0} attending</span>
                        </div>
                      </div>
                      {(event.attendees || []).some(a => a._id === localStorage.getItem('userId') || a === localStorage.getItem('userId')) ? (
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

        {/* Settings Section */}
        {activeTab === 'settings' && (
          <div className="section-content">
            <div className="section-header">
              <h2>settings</h2>
              <button
                className="action-btn"
                onClick={() => setActiveTab('chats')}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                back to chats
              </button>
            </div>
            <div className="settings-page-grid">
              <div className="settings-panel settings-page">
                <div className="settings-content">
                  <div className="settings-header">
                    <h3>Profile</h3>
                  </div>
                  <form onSubmit={handleUpdateProfile} className="settings-form">
                    <div className="profile-upload-section">
                      <div
                        className="user-avatar-large"
                        onClick={() => document.getElementById('profile-upload').click()}
                      >
                        {previewImage ? (
                          <img src={previewImage} alt="Preview" />
                        ) : currentUser?.profilePic ? (
                          <img src={getAvatarUrl(currentUser.profilePic)} alt="Profile" />
                        ) : (
                          currentUser?.name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                        <div className="upload-overlay">
                          <span>Change</span>
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
                      {currentUser?.email && (
                        <div className="profile-email">{currentUser.email}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="username"
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Role / Title</label>
                      <input
                        type="text"
                        value={editWhoAmI}
                        onChange={(e) => setEditWhoAmI(e.target.value)}
                        placeholder="Designer, Student, Developer"
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Education</label>
                      <input
                        type="text"
                        value={editEducation}
                        onChange={(e) => setEditEducation(e.target.value)}
                        placeholder="Education"
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Interests</label>
                      <input
                        type="text"
                        value={editInterests}
                        onChange={(e) => setEditInterests(e.target.value)}
                        placeholder="UI, startups, music"
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Bio</label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Short bio"
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>About</label>
                      <textarea
                        value={editAboutInfo}
                        onChange={(e) => setEditAboutInfo(e.target.value)}
                        placeholder="Tell more about yourself"
                        className="modal-input"
                      />
                    </div>

                    <button type="submit" className="create-group-btn">
                      Save Changes
                    </button>
                  </form>
                </div>
              </div>

              <div className="settings-panel settings-page">
                <div className="settings-content">
                  <div className="settings-header">
                    <h3>Preferences</h3>
                  </div>
                  <div className="settings-preference">
                    <div>
                      <div className="preference-title">Theme</div>
                      <div className="preference-subtitle">Switch between light and dark</div>
                    </div>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                    >
                      {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                    </button>
                  </div>

                  <div className="settings-preference">
                    <div>
                      <div className="preference-title">AI Chat Access</div>
                      <div className="preference-subtitle">Allow AI to reference your chats</div>
                    </div>
                    <label className={`ai-toggle ${aiAllowChatAccess ? 'on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={aiAllowChatAccess}
                        onChange={(e) => setAiAllowChatAccess(e.target.checked)}
                      />
                      <span className="ai-toggle-slider"></span>
                    </label>
                  </div>

                  <div className="settings-preference">
                    <div>
                      <div className="preference-title">Language</div>
                      <div className="preference-subtitle">Default translate target</div>
                    </div>
                    <select
                      className="modal-input"
                      value={aiTargetLanguage}
                      onChange={(e) => setAiTargetLanguage(e.target.value)}
                    >
                      {['Hindi', 'Gujarati', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'English'].map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

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
            </div>
          </div>
        )}

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

      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Message</h3>
              <button
                className="modal-icon-btn"
                onClick={() => setShowScheduleModal(false)}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="schedule-form">
              <textarea
                className="modal-input"
                placeholder="Message content"
                value={scheduleForm.content}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, content: e.target.value }))}
                style={{ minHeight: '100px' }}
                required
              />
              <div className="schedule-row">
                <label>Send at</label>
                <input
                  type="datetime-local"
                  className="modal-input"
                  value={scheduleForm.scheduledFor}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduledFor: e.target.value }))}
                  required
                />
              </div>
              <div className="schedule-row">
                <label>Repeat</label>
                <select
                  className="modal-input"
                  value={scheduleForm.scheduleType}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduleType: e.target.value }))}
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {scheduleForm.scheduleType === 'custom' && (
                <div className="schedule-custom-row">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    className="modal-input"
                    value={scheduleForm.customInterval}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, customInterval: Number(e.target.value) }))}
                  />
                  <select
                    className="modal-input"
                    value={scheduleForm.customUnit}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, customUnit: e.target.value }))}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              )}
              <div className="schedule-row">
                <label>End date (optional)</label>
                <input
                  type="datetime-local"
                  className="modal-input"
                  value={scheduleForm.endsAt}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                />
              </div>
              <div className="schedule-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-group-btn">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPollModal && (
        <div className="modal-overlay" onClick={() => setShowPollModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Poll</h3>
              <button
                className="modal-icon-btn"
                onClick={() => setShowPollModal(false)}
                onMouseEnter={() => setCursorSize(60)}
                onMouseLeave={() => setCursorSize(40)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePoll} className="schedule-form">
              <input
                type="text"
                className="modal-input"
                placeholder="Poll question"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                required
              />
              <div className="poll-options-form">
                {pollOptions.map((option, idx) => (
                  <div key={`poll-opt-${idx}`} className="poll-option-input">
                    <input
                      type="text"
                      className="modal-input"
                      placeholder={`Option ${idx + 1}`}
                      value={option}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      required
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" className="secondary-btn" onClick={() => handleRemovePollOption(idx)}>
                        remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="secondary-btn" onClick={handleAddPollOption} disabled={pollOptions.length >= 5}>
                add option
              </button>
              <div className="schedule-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowPollModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-group-btn">
                  Create poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  placeholder="Search anyone by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="modal-search-input"
                  autoFocus
                />
              </div>

              {chatActionError && <div className="chat-action-error">{chatActionError}</div>}

              <div className="modal-users-list">
                {filteredUsers.length === 0 ? (
                  <div className="no-users">
                    {searchQuery ? `No users found for "${searchQuery}"` : 'No users found.'}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="modal-user-item"
                      onClick={() => handleCreateChat(user._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="modal-user-avatar">
                        {user.profilePic ? (
                          <img src={getAvatarUrl(user.profilePic)} alt={user.name || 'User'} className="avatar-img" />
                        ) : (
                          (user.name?.charAt(0) || '?').toUpperCase()
                        )}
                      </div>
                      <div className="modal-user-info">
                        <h4>{highlightMatch(user.name || 'Unknown', searchQuery)}</h4>
                        <p>@{highlightMatch(user.username || '', searchQuery)}</p>
                      </div>
                      <button
                        type="button"
                        className="request-btn accept"
                        onClick={(e) => { e.stopPropagation(); handleCreateChat(user._id); }}
                      >
                        chat
                      </button>
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
                  <input
                    type="text"
                    placeholder="Community icon (emoji or image URL)"
                    value={newCommunityIcon}
                    onChange={(e) => setNewCommunityIcon(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Cover image URL (optional)"
                    value={newCommunityCoverImage}
                    onChange={(e) => setNewCommunityCoverImage(e.target.value)}
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

      {/* Group Creation Modal */}
      {
        showGroupModal && (
          <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create Group</h3>
                <button
                  className="modal-icon-btn"
                  onClick={() => setShowGroupModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateGroup}>
                <div className="group-name-input">
                  <input
                    type="text"
                    placeholder="Group Name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <textarea
                    placeholder="Description..."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="modal-input"
                    style={{ minHeight: '80px', paddingTop: '10px' }}
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Group icon (emoji)"
                    value={newGroupIcon}
                    onChange={(e) => setNewGroupIcon(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Profile image URL (optional)"
                    value={newGroupProfileImage}
                    onChange={(e) => setNewGroupProfileImage(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Cover image URL (optional)"
                    value={newGroupCoverImage}
                    onChange={(e) => setNewGroupCoverImage(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <button
                  type="submit"
                  className="create-group-btn"
                >
                  Create Group
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
                  <input
                    type="number"
                    placeholder="Max Attendees (optional)"
                    value={newEventMaxAttendees}
                    onChange={(e) => setNewEventMaxAttendees(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <select 
                    value={newEventVisibility} 
                    onChange={(e) => {
                      setNewEventVisibility(e.target.value);
                      setNewEventContextId('');
                    }} 
                    className="modal-input"
                  >
                    <option value="contacts">Contacts</option>
                    <option value="community">Community</option>
                    <option value="group">Group</option>
                  </select>
                </div>
                {newEventVisibility === 'community' && (
                  <div className="group-name-input" style={{ marginTop: '10px' }}>
                    <select 
                      value={newEventContextId} 
                      onChange={(e) => setNewEventContextId(e.target.value)} 
                      className="modal-input"
                      required
                    >
                      <option value="">Select Community</option>
                      {communities.filter(c => c.members.some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId'))).map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {newEventVisibility === 'group' && (
                  <div className="group-name-input" style={{ marginTop: '10px' }}>
                    <select 
                      value={newEventContextId} 
                      onChange={(e) => setNewEventContextId(e.target.value)} 
                      className="modal-input"
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.filter(g => g.members.some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId'))).map(g => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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

      {/* Update Creation Modal */}
      {
        showUpdateModal && (
          <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Post an Update</h3>
                <button
                  className="modal-icon-btn"
                  onClick={() => setShowUpdateModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateUpdate}>
                <div className="group-name-input">
                  <textarea
                    placeholder="What's happening?"
                    value={newUpdateContent}
                    onChange={(e) => setNewUpdateContent(e.target.value)}
                    className="modal-input"
                    style={{ minHeight: '80px', paddingTop: '10px' }}
                    required={!newUpdateImage}
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewUpdateImage(e.target.files[0])}
                    className="modal-input"
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <select 
                    value={newUpdateVisibility} 
                    onChange={(e) => {
                      setNewUpdateVisibility(e.target.value);
                      setNewUpdateContextId('');
                    }} 
                    className="modal-input"
                  >
                    <option value="contacts">Contacts</option>
                    <option value="public">Public</option>
                    <option value="community">Community</option>
                    <option value="group">Group</option>
                  </select>
                </div>
                {newUpdateVisibility === 'community' && (
                  <div className="group-name-input" style={{ marginTop: '10px' }}>
                    <select 
                      value={newUpdateContextId} 
                      onChange={(e) => setNewUpdateContextId(e.target.value)} 
                      className="modal-input"
                      required
                    >
                      <option value="">Select Community</option>
                      {communities.filter(c => c.members.some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId'))).map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {newUpdateVisibility === 'group' && (
                  <div className="group-name-input" style={{ marginTop: '10px' }}>
                    <select 
                      value={newUpdateContextId} 
                      onChange={(e) => setNewUpdateContextId(e.target.value)} 
                      className="modal-input"
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.filter(g => g.members.some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId'))).map(g => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="submit"
                  className="create-group-btn"
                >
                  Post Update
                </button>
              </form>
            </div>
          </div>
        )
      }

      {/* Bitmoji Modal */}
      {showBitmojiModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ textAlign: 'center' }}>
            <h2 className="modal-title">Create your Avatar</h2>
            <p className="onboarding-subtitle">Choose a style and randomize to find your perfect look!</p>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <img
                src={`https://api.dicebear.com/7.x/${bitmojiStyle}/svg?seed=${bitmojiSeed}`}
                alt="Bitmoji Preview"
                style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
              <select
                value={bitmojiStyle}
                onChange={(e) => setBitmojiStyle(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #444' }}
              >
                <option value="avataaars">Avataaars</option>
                <option value="micah">Micah</option>
                <option value="bottts">Bottts</option>
                <option value="fun-emoji">Fun Emoji</option>
                <option value="lorelei">Lorelei</option>
              </select>
              <button
                type="button"
                onClick={() => setBitmojiSeed(Math.random().toString(36).substring(7))}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#38bdf8', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Randomize
              </button>
            </div>

            <button
              onClick={handleSaveBitmoji}
              className="create-group-btn"
              style={{ width: '100%', marginTop: '10px' }}
            >
              Looks Good! Save Avatar
            </button>
          </div>
        </div>
      )}

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
          position: relative;
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

        .community-avatar-large img,
        .avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .avatar-large {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          overflow: hidden;
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

        .updates-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 10px 0 24px;
          flex-wrap: wrap;
        }

        .updates-filter {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 6px 10px;
          border-radius: 10px;
        }

        .updates-filter-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: lowercase;
        }

        .updates-filter-select {
          background: transparent;
          border: none;
          color: white;
          font-size: 0.8rem;
          outline: none;
          text-transform: lowercase;
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

        .message-action-btn {
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
          border-radius: 999px;
          padding: 4px 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .message-action-btn.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
        }

        .message-text.mention {
          background: rgba(59, 130, 246, 0.18);
          padding: 2px 6px;
          border-radius: 6px;
          display: inline-block;
        }

        .reply-preview {
          background: rgba(255, 255, 255, 0.06);
          border-left: 2px solid rgba(255, 255, 255, 0.3);
          padding: 6px 8px;
          border-radius: 8px;
          margin-bottom: 6px;
        }

        .reply-author {
          font-size: 0.7rem;
          font-weight: 600;
          opacity: 0.8;
          display: block;
        }

        .reply-text {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .message-deleted {
          font-style: italic;
          color: rgba(255, 255, 255, 0.55);
        }

        .message-edited {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.45);
        }

        .message-draft-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .draft-chip {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 4px 8px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
        }

        .draft-clear-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
        }

        .poll-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 10px 12px;
          margin-top: 6px;
        }

        .poll-question {
          font-weight: 600;
          margin-bottom: 8px;
        }

        .poll-options {
          display: grid;
          gap: 6px;
        }

        .poll-option {
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          padding: 6px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          overflow: hidden;
        }

        .poll-option.active {
          border-color: rgba(59, 130, 246, 0.4);
        }

        .poll-option-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: rgba(59, 130, 246, 0.18);
          z-index: 0;
        }

        .poll-option-text,
        .poll-option-count {
          position: relative;
          z-index: 1;
        }

        .poll-footer {
          margin-top: 6px;
          font-size: 0.7rem;
          opacity: 0.7;
        }

        .chat-search-input {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 0.8rem;
          margin-right: 8px;
        }

        .message-search-results {
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          max-height: 140px;
          overflow-y: auto;
        }

        .message-search-item {
          font-size: 0.75rem;
          display: flex;
          gap: 6px;
          padding: 4px 0;
        }

        .message-search-sender {
          font-weight: 600;
        }

        .notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 0.6rem;
          padding: 2px 6px;
          border-radius: 999px;
        }

        .notification-panel {
          position: fixed;
          top: 70px;
          right: 24px;
          width: 280px;
          background: rgba(10, 10, 15, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
          z-index: 50;
          padding: 12px;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          margin-bottom: 8px;
        }

        .notification-list {
          max-height: 240px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 8px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          margin-bottom: 6px;
        }

        .notification-title {
          font-weight: 600;
          font-size: 0.75rem;
          margin-bottom: 4px;
        }

        .notification-body {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .notification-clear {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
        }

        .detail-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .detail-tab {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border-radius: 999px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 0.75rem;
          text-transform: lowercase;
        }

        .detail-tab.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: white;
        }

        .member-panel,
        .settings-panel,
        .community-groups-panel {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
        }

        .member-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .member-actions button {
          margin-left: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 0.7rem;
          cursor: pointer;
        }

        .member-role {
          margin-left: 8px;
          font-size: 0.65rem;
          opacity: 0.6;
          text-transform: uppercase;
        }

        .settings-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
        }

        .invite-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .invite-code {
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.06);
          padding: 4px 8px;
          border-radius: 8px;
        }

        .pinned-panel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 12px;
        }

        .pinned-item {
          font-size: 0.8rem;
          padding: 4px 0;
        }

        .invite-join {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .invite-join input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 10px;
          padding: 8px 12px;
        }

        .create-group-inline {
          display: grid;
          gap: 8px;
          margin: 12px 0;
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
          height: calc(100vh - 185px);
          background: rgba(15, 15, 20, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .ai-translate-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .ai-translate-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .ai-translate-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
          font-weight: 600;
        }

        /* Custom Language Dropdown */
        .custom-lang-select-container {
          position: relative;
          min-width: 180px;
        }

        .custom-lang-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-lang-select-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .custom-lang-select-trigger.open {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15);
        }

        .dropdown-arrow {
          transition: transform 0.2s ease;
          opacity: 0.6;
        }

        .custom-lang-select-trigger.open .dropdown-arrow {
          transform: rotate(180deg);
        }

        .custom-lang-options-list {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(20, 20, 25, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 8px;
          max-height: 240px;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          z-index: 20;
          animation: dropdownFade 0.2s ease;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .custom-lang-options-list::-webkit-scrollbar {
          width: 6px;
        }

        .custom-lang-options-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }

        .custom-lang-option {
          padding: 10px 14px;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-lang-option:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .custom-lang-option.selected {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          font-weight: 500;
        }

        .ai-mini-btn {
          height: 40px;
          padding: 0 20px;
          border-radius: 12px;
          border: 1px solid rgba(56, 189, 248, 0.3);
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .ai-mini-btn:hover:not(:disabled) {
          background: rgba(56, 189, 248, 0.25);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);
        }

        .ai-mini-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }

        .aichat-container::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 1px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.5), rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.4));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        /* Ambient Glow effect */
        .aichat-container::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.05) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .ai-header-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ai-header {
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 16px;
        }

        .ai-subtitle {
          margin-top: 6px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 300;
        }

        .ai-status-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .ai-status-pill {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(8px);
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.02em;
        }

        .ai-status-pill.open {
          border-color: rgba(34, 197, 94, 0.4);
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
        }

        .ai-status-pill.closed {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }

        .ai-reset-btn {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ai-reset-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .ai-quick-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .ai-quick-actions::-webkit-scrollbar {
          height: 4px;
        }
        .ai-quick-actions::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }

        .quick-action-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 12px 20px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .quick-action-btn:hover:not(:disabled) {
          background: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.3);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .quick-action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .aichat-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          z-index: 1;
        }

        .aichat-messages::-webkit-scrollbar {
          width: 8px;
        }
        .aichat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }

        .aichat-messages .message {
          max-width: 82%;
          animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
          padding: 16px 22px;
          border-radius: 20px;
          font-size: 0.95rem;
          line-height: 1.6;
          position: relative;
          backdrop-filter: blur(10px);
        }

        .aichat-messages .message.own .message-content {
          background: linear-gradient(135deg, #38bdf8, #2563eb);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
        }

        .aichat-messages .message.other .message-content {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.95);
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .aichat-input-container {
          padding: 20px 24px;
          background: rgba(10, 10, 14, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
          z-index: 10;
        }

        .ai-input-area {
          display: flex;
          gap: 12px;
          position: relative;
        }

        .ai-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white !important;
          font-size: 0.95rem;
          padding: 16px 24px;
          border-radius: 24px;
          outline: none;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .ai-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .ai-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1), inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .aichat-input-container .send-btn {
          background: linear-gradient(135deg, #38bdf8, #2563eb);
          border: none;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .aichat-input-container .send-btn:hover:not(:disabled) {
          transform: scale(1.05) rotate(-5deg);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }

        .aichat-input-container .send-btn:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.3);
          box-shadow: none;
        }

        .ai-privacy-note {
          margin-top: 12px;
          text-align: center;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Enhanced Typing Indicator */
        .ai-typing-indicator {
          display: flex;
          gap: 6px;
          padding: 6px 4px;
        }
        .ai-typing-indicator span {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          animation: smoothBounce 1.4s infinite cubic-bezier(0.45, 0, 0.55, 1);
        }
        .ai-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .ai-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes smoothBounce {
          0%, 80%, 100% { transform: translateY(0) scale(0.8); opacity: 0.5; }
          40% { transform: translateY(-6px) scale(1.1); opacity: 1; }
        }

        .chat-window-actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chat-action-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: white;
          padding: 8px 10px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chat-action-btn:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .scheduled-panel {
          margin: 10px 0 0;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
        }

        .scheduled-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.75rem;
          text-transform: lowercase;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }

        .scheduled-add-btn {
          background: rgba(56, 189, 248, 0.18);
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          cursor: pointer;
        }

        .scheduled-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 170px;
          overflow-y: auto;
        }

        .scheduled-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px 12px;
        }

        .scheduled-meta {
          display: flex;
          gap: 12px;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 6px;
        }

        .scheduled-content {
          margin: 0 0 8px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.92);
        }

        .scheduled-cancel {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 0.7rem;
          cursor: pointer;
        }

        .reaction-picker-wrap {
          position: relative;
        }

        .message-react-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 4px 6px;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .reaction-picker {
          position: absolute;
          bottom: 130%;
          right: 0;
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 6px 8px;
          display: flex;
          gap: 6px;
          z-index: 10;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
        }

        .reaction-choice {
          background: transparent;
          border: none;
          font-size: 1rem;
          cursor: pointer;
        }

        .message-reactions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .reaction-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .reaction-pill.active {
          background: rgba(56, 189, 248, 0.2);
          border-color: rgba(56, 189, 248, 0.5);
          color: #e0f2fe;
        }

        .reaction-count {
          font-weight: 600;
        }

        .settings-page-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
        }

        .settings-panel {
          position: relative;
          width: 100%;
          max-width: none;
          height: auto;
          background: rgba(8, 8, 12, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          overflow: hidden;
          animation: none;
        }

        .settings-content {
          height: auto;
          gap: 16px;
        }

        .profile-upload-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          gap: 10px;
        }

        .profile-upload-section .user-avatar-large {
          width: 100px;
          height: 100px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
        }

        .profile-upload-section .user-avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          color: white;
        }

        .user-avatar-large:hover .upload-overlay {
          opacity: 1;
        }

        .profile-email {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .settings-form .form-group {
          margin-bottom: 14px;
        }

        .settings-form .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .settings-form .modal-input {
          width: 100%;
        }

        .settings-preference {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .settings-preference:first-of-type {
          border-top: none;
        }

        .preference-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
        }

        .preference-subtitle {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .secondary-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
        }

        .schedule-modal {
          max-width: 520px;
        }

        .schedule-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .schedule-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .schedule-row label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .schedule-custom-row {
          display: flex;
          gap: 12px;
        }

        .schedule-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        @media (max-width: 980px) {
          .settings-page-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .ai-translate-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 16px;
          }

          .ai-translate-left {
            width: 100%;
          }
          
          .custom-lang-select-container {
            width: 100%;
            flex: 1;
          }

          .ai-mini-btn {
            width: 100%;
            height: 44px;
          }
          
          .aichat-container {
            border-radius: 16px;
            height: calc(100vh - 200px);
          }
        }

      `}</style>
    </div >
  );
};

export default HomePage;






