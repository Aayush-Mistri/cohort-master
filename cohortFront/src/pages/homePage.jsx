import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Bell, User, Send, ArrowLeft, LogOut, UserPlus, Users, Smile, Paperclip, Sun, Moon, UserCheck, MapPin, Clock, Pin, Reply, Trash2, Edit3, Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
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
  getFriends,
  createChat,
  createGroupChat,
  getUserProfile,
  getPublicUserProfile,
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
import {
  connectSocket,
  disconnectSocket,
  joinChat,
  onReceiveMessage,
  offReceiveMessage,
  emitUserOnline,
  onUserStatusChange,
  offUserStatusChange,
  emitTypingStart,
  emitTypingStop,
  onUserTyping,
  offUserTyping,
  emitMessagesRead,
  onMessagesRead,
  offMessagesRead,
  emitMessageReaction,
  onMessageReaction,
  offMessageReaction,
  onNotification,
  offNotification,
  onConnect,
  offConnect,
  onAppRefresh,
  offAppRefresh,
  emitCallRing,
  emitCallAccept,
  emitCallDecline,
  emitCallBusy,
  emitCallOffer,
  emitCallAnswer,
  emitCallIceCandidate,
  emitCallEnd,
  onIncomingCall,
  offIncomingCall,
  onCallAccepted,
  offCallAccepted,
  onCallDeclined,
  offCallDeclined,
  onCallBusy,
  offCallBusy,
  onCallOffer,
  offCallOffer,
  onCallAnswer,
  offCallAnswer,
  onCallIceCandidate,
  offCallIceCandidate,
  onCallEnded,
  offCallEnded
} from '../api/socket';
import { API_BASE_URL, DEFAULT_API_BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const NAV_TABS = ['chats', 'ai', 'communities', 'groups', 'updates', 'events', 'settings'];
const QUICK_REACTIONS = ['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F389}', '\u{1F62E}'];
const LOCATION_MESSAGE_PREFIX = '\u{1F4CD} My Location: ';
const MESSAGE_REACT_LABEL = '\u{1F642}';
const MESSAGE_STATUS_SINGLE = '\u2713';
const MESSAGE_STATUS_DOUBLE = '\u2713\u2713';
const LABEL_SEPARATOR = '\u00B7';
const buildIceServerList = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const turnUrls = String(import.meta.env.VITE_TURN_URLS || import.meta.env.VITE_TURN_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (turnUrls.length > 0) {
    servers.push({
      urls: turnUrls,
      username: import.meta.env.VITE_TURN_USERNAME || '',
      credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
    });
  }

  return servers;
};

const WEBRTC_CONFIGURATION = {
  iceServers: buildIceServerList()
};
const INITIAL_CALL_STATE = {
  status: 'idle',
  chatId: '',
  chatName: '',
  fromUserId: '',
  fromUserName: '',
  error: '',
  isMuted: false,
  isCameraOff: false,
  isReceiveOnly: false
};

const padDatePart = (value) => String(value).padStart(2, '0');
const getCurrentMinuteDate = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
};
const getLocalDateTimeValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
};

const IMAGE_FILE_PATTERN = /^[^/\\?#]+\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico)(?:[?#].*)?$/i;
const SUPPORTED_IMAGE_UPLOAD_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.svg,.avif,.bmp,image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif,image/bmp';
const SUPPORTED_IMAGE_UPLOAD_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const SUPPORTED_IMAGE_UPLOAD_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/bmp'
]);

const normalizeMediaPath = (path) => {
  if (typeof path !== 'string') return '';
  return path.trim().replace(/\\/g, '/');
};

const getUploadImageError = (file) => {
  if (!file) return '';

  const fileName = String(file.name || '').toLowerCase();
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
  const mimeType = String(file.type || '').toLowerCase();

  if (!SUPPORTED_IMAGE_UPLOAD_EXTENSIONS.has(extension) || !SUPPORTED_IMAGE_UPLOAD_MIME_TYPES.has(mimeType)) {
    return 'Please choose a JPG, PNG, GIF, WebP, SVG, AVIF, or BMP image.';
  }

  return '';
};

const buildMediaCandidates = (path) => {
  const normalizedPath = normalizeMediaPath(path);
  if (!normalizedPath) return [];

  if (/^(?:data:|blob:)/i.test(normalizedPath)) {
    return [normalizedPath];
  }

  if (/^https?:/i.test(normalizedPath)) {
    return [normalizedPath];
  }

  const cleanPath = IMAGE_FILE_PATTERN.test(normalizedPath)
    ? `/uploads/${normalizedPath}`
    : (normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`);

  const candidates = [`${API_BASE_URL}${cleanPath}`];
  if (DEFAULT_API_BASE_URL && DEFAULT_API_BASE_URL !== API_BASE_URL) {
    candidates.push(`${DEFAULT_API_BASE_URL}${cleanPath}`);
  }

  return [...new Set(candidates)];
};

const getApiErrorMessage = (error, fallbackMessage) => {
  const serverMessage = error?.response?.data?.message;
  const serverError = error?.response?.data?.error;

  if (serverMessage && serverMessage !== 'Server error') {
    return serverMessage;
  }

  return serverError || serverMessage || error?.message || fallbackMessage;
};

const getRelationshipBadgeLabel = (relationship) => {
  const normalized = String(relationship || '').trim().toLowerCase();
  if (!normalized || normalized === 'none') return '';
  if (normalized === 'self') return 'you';
  if (normalized === 'friend') return 'contact';
  if (normalized === 'requested') return 'request sent';
  if (normalized === 'incoming') return 'request received';
  return normalized;
};

function SmartImage({ srcPath, alt, fallback = null, onError, ...imgProps }) {
  const candidates = buildMediaCandidates(srcPath);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setIsBroken(false);
  }, [srcPath]);

  if (!candidates.length || isBroken) {
    return fallback;
  }

  const handleError = (event) => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex(candidateIndex + 1);
    } else {
      setIsBroken(true);
    }

    if (typeof onError === 'function') {
      onError(event);
    }
  };

  return (
    <img
      {...imgProps}
      src={candidates[candidateIndex]}
      alt={alt}
      onError={handleError}
    />
  );
}

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState(false);
  const [cursorSize, setCursorSize] = useState(40);

  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profilePreviewLoading, setProfilePreviewLoading] = useState(false);
  const [profilePreviewError, setProfilePreviewError] = useState('');
  const [appLoading, setAppLoading] = useState(true);
  const [pageSectionLoading, setPageSectionLoading] = useState('');

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
  const [peopleDirectoryLoading, setPeopleDirectoryLoading] = useState(false);
  const [activeChatModalTab, setActiveChatModalTab] = useState('contacts');
  const [friendActionLoading, setFriendActionLoading] = useState('');
  const [chatActionError, setChatActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  // Online status
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [callState, setCallState] = useState(INITIAL_CALL_STATE);

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState({});

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageInputRef = useRef(null);
  const chatSearchInputRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const chatsRef = useRef([]);
  const currentUserRef = useRef(null);
  const selectedChatRef = useRef(null);
  const activeCallRef = useRef(INITIAL_CALL_STATE);
  const cursorRef = useRef(null);
  const cursorTargetRef = useRef({ x: 0, y: 0, size: 40, opacity: 0 });
  const cursorCurrentRef = useRef({ x: 0, y: 0, size: 40, opacity: 0 });
  const cursorFrameRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  // Typing timeout
  const typingTimeoutRef = useRef(null);

  // Message containers for auto-scroll
  const aiMessagesContainerRef = useRef(null);
  const chatMessagesContainerRef = useRef(null);

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
  const [scheduleDateError, setScheduleDateError] = useState('');

  // Reactions
  const [openReactionMessageId, setOpenReactionMessageId] = useState(null);

  // Communities & Events & Groups State
  const [communities, setCommunities] = useState([]);
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeEventsTab, setActiveEventsTab] = useState('upcoming');
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
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('Online');
  const [newEventCoverImage, setNewEventCoverImage] = useState('');
  const [newEventMaxAttendees, setNewEventMaxAttendees] = useState('');
  const [newEventVisibility, setNewEventVisibility] = useState('contacts'); // contacts | community | group
  const [newEventContextId, setNewEventContextId] = useState(''); // Community/Group ID
  const [eventDateError, setEventDateError] = useState('');
  const [eventCreateError, setEventCreateError] = useState('');

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
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef(null);

  // Per-message translation state
  const [chatTargetLanguages, setChatTargetLanguages] = useState({});
  const [openMessageDropdown, setOpenMessageDropdown] = useState(null);
  const [messageTranslationLoadingId, setMessageTranslationLoadingId] = useState('');
  const minDateTimeLocal = getLocalDateTimeValue(getCurrentMinuteDate());

  const getCurrentUserId = () => localStorage.getItem('userId');
  const getEntityId = (value) => String(value?._id || value?.id || value || '');

  const getEventEndValue = (event) => event?.endDate || event?.date;

  const isEventPast = (event) => {
    const endValue = getEventEndValue(event);
    const endDate = new Date(endValue);
    if (Number.isNaN(endDate.getTime())) return false;
    return Boolean(event?.isExpired) || endDate < new Date();
  };

  const isMyEvent = (event) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId || !event) return false;
    const creatorId = event.creator?._id || event.creator?.id || event.creator;
    if ((creatorId || '').toString() === currentUserId) return true;
    return (event.attendees || []).some((attendee) => ((attendee?._id || attendee) || '').toString() === currentUserId);
  };

  const buildEventRangeError = (startValue, endValue) => {
    const startDate = new Date(startValue);
    if (Number.isNaN(startDate.getTime())) {
      return 'Please choose a valid event date and time.';
    }

    const endDate = new Date(endValue || startValue);
    if (Number.isNaN(endDate.getTime())) {
      return 'Please choose a valid event end date and time.';
    }

    if (startDate < getCurrentMinuteDate()) {
      return 'Past dates are not allowed.';
    }

    if (endDate < startDate) {
      return 'End date must be after the start date.';
    }

    return '';
  };

  const joinKnownChatRooms = (chatList = chatsRef.current) => {
    (chatList || []).forEach((chat) => {
      if (chat?._id) {
        joinChat(chat._id);
      }
    });
  };

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    activeCallRef.current = callState;
  }, [callState]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current || null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current || null;
    }
  }, [callState.status]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showNotifications) return undefined;

    const handleNotificationOutsideClick = (event) => {
      if (notificationPanelRef.current?.contains(event.target) || notificationButtonRef.current?.contains(event.target)) {
        return;
      }
      setShowNotifications(false);
    };

    document.addEventListener('mousedown', handleNotificationOutsideClick);
    return () => document.removeEventListener('mousedown', handleNotificationOutsideClick);
  }, [showNotifications]);

  useEffect(() => {
    if (!showScheduleModal && scheduleDateError) {
      setScheduleDateError('');
    }
  }, [showScheduleModal, scheduleDateError]);

  useEffect(() => {
    if (!showEventModal && (eventDateError || eventCreateError)) {
      setEventDateError('');
      setEventCreateError('');
    }
  }, [showEventModal, eventDateError, eventCreateError]);

  // Auto-scroll to bottom for AI messages
  useEffect(() => {
    if (aiMessagesContainerRef.current) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        if (aiMessagesContainerRef.current) {
          aiMessagesContainerRef.current.scrollTop = aiMessagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [aiMessages, isAiTyping]);

  // Auto-scroll to bottom for chat messages
  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        if (chatMessagesContainerRef.current) {
          chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  // Scroll to bottom when chat is selected/opened
  useEffect(() => {
    if (selectedChat) {
      requestAnimationFrame(() => {
        if (chatMessagesContainerRef.current) {
          chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [selectedChat]);

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
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('cohortTheme') || 'dark');
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
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
    let isMounted = true;

    const bootstrap = async () => {
      setAppLoading(true);
      await Promise.allSettled([loadUserProfile(), loadChats()]);
      if (isMounted) {
        setAppLoading(false);
      }
    };

    const handleSocketConnect = () => {
      const userId = getCurrentUserId();
      if (userId) {
        emitUserOnline(userId);
      }
      joinKnownChatRooms();
    };

    bootstrap();
    onConnect(handleSocketConnect);
    connectSocket();

    return () => {
      isMounted = false;
      offConnect(handleSocketConnect);
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      joinKnownChatRooms(chats);
    }
  }, [chats]);

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

  useEffect(() => {
    if (!isThemeTransitioning) return undefined;

    const timer = setTimeout(() => {
      setIsThemeTransitioning(false);
    }, 520);

    return () => clearTimeout(timer);
  }, [isThemeTransitioning]);

  const handleThemeToggle = () => {
    setIsThemeTransitioning(true);
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const finePointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncCursorCapability = () => {
      setCursorEnabled(finePointerQuery.matches && !reducedMotionQuery.matches);
    };

    syncCursorCapability();

    const addListener = (query, handler) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', handler);
        return () => query.removeEventListener('change', handler);
      }

      query.addListener(handler);
      return () => query.removeListener(handler);
    };

    const removeFinePointerListener = addListener(finePointerQuery, syncCursorCapability);
    const removeReducedMotionListener = addListener(reducedMotionQuery, syncCursorCapability);

    return () => {
      removeFinePointerListener();
      removeReducedMotionListener();
    };
  }, []);

  useEffect(() => {
    cursorTargetRef.current.size = cursorSize;
  }, [cursorSize]);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // Listen for real-time messages
  useEffect(() => {
    onReceiveMessage((message) => {
      const curId = localStorage.getItem('userId');
      const sId = (message?.sender?._id || message?.sender)?.toString();
      const isOwnMessage = sId === curId;
      if (selectedChat && message.chat === selectedChat._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      } else if (!isOwnMessage) {
        pushNotification({
          type: 'message',
          chatId: message.chat,
          content: message.content || 'New message',
          from: message?.sender?.name || 'New message'
        });
      }
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

  useEffect(() => {
    const handleAppRefresh = ({ resource } = {}) => {
      const refreshType = resource || 'all';

      if (refreshType === 'all' || refreshType === 'profile') {
        loadUserProfile();
        loadChats();
        if (activeTab === 'updates' || selectedGroupTab === 'updates') {
          loadUpdates();
        }
        if (activeTab === 'events' || selectedGroupTab === 'events') {
          loadEvents();
        }
        if (activeTab === 'communities') {
          loadCommunities();
        }
        if (activeTab === 'groups') {
          loadGroups();
        }
      }

      if (refreshType === 'all' || refreshType === 'events') {
        if (activeTab === 'events' || selectedGroupTab === 'events') {
          loadEvents();
        }
      }

      if (refreshType === 'all' || refreshType === 'updates') {
        if (activeTab === 'updates' || selectedGroupTab === 'updates') {
          loadUpdates();
        }
      }

      if (refreshType === 'all' || refreshType === 'communities') {
        if (activeTab === 'communities') {
          loadCommunities();
        }
      }

      if (refreshType === 'all' || refreshType === 'groups') {
        if (activeTab === 'groups') {
          loadGroups();
        }
      }
    };

    onAppRefresh(handleAppRefresh);

    return () => {
      offAppRefresh(handleAppRefresh);
    };
  }, [activeTab, selectedGroupTab]);

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
    let cancelled = false;

    const loadActiveTab = async () => {
      const loaders = {
        communities: loadCommunities,
        groups: loadGroups,
        events: loadEvents,
        updates: loadUpdates
      };

      const loader = loaders[activeTab];
      if (!loader) return;

      setPageSectionLoading(activeTab);
      try {
        await loader();
      } finally {
        if (!cancelled) {
          setPageSectionLoading((current) => (current === activeTab ? '' : current));
        }
      }
    };

    loadActiveTab();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadChats();
      if (selectedChat?._id) {
        loadMessages(selectedChat._id);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    if (!['communities', 'groups', 'events', 'updates'].includes(activeTab)) return undefined;

    const loaderMap = {
      communities: loadCommunities,
      groups: loadGroups,
      events: loadEvents,
      updates: loadUpdates
    };

    const interval = setInterval(() => {
      loaderMap[activeTab]?.();
    }, 30000);

    return () => clearInterval(interval);
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

  useEffect(() => {
    if (activeTab === 'groups' && selectedGroupTab === 'events') {
      loadEvents();
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

  const handleNotificationItemClick = (note) => {
    if (!note) return;

    setShowNotifications(false);

    if (note.chatId) {
      const matchingChat = chatsRef.current.find((chat) => chat._id === note.chatId);
      if (matchingChat) {
        setActiveTab('chats');
        setSelectedCommunity(null);
        setSelectedGroup(null);
        setSelectedChat(matchingChat);
      }
    }

    setNotifications((prev) => prev.filter((item) => item.id !== note.id));
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
    const trimmedInput = aiInput.trim();
    if (!trimmedInput) return;

    const userMsg = { role: 'user', content: trimmedInput };
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
    setProfileUpdateLoading(true);
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
      setProfileFile(null);
      setPreviewImage(null);
      setProfilePreview((prev) => {
        if (!prev) return prev;
        const prevId = prev._id || prev.id;
        const updatedId = updatedUser._id || updatedUser.id;
        if (!prevId || !updatedId || prevId.toString() !== updatedId.toString()) {
          return prev;
        }
        return { ...prev, ...updatedUser };
      });

      await Promise.allSettled([
        loadUserProfile(),
        loadChats(),
        loadFriendsAndRequests(),
        loadUpdates(),
        loadCommunities(),
        loadGroups()
      ]);

      pushNotification({
        type: 'profile',
        content: 'Profile updated successfully.'
      });
    } catch (error) {
      pushNotification({
        type: 'profile',
        content: getApiErrorMessage(error, 'Could not update your profile right now.')
      });
      console.error('Failed to update profile', error);
    } finally {
      setProfileUpdateLoading(false);
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
      pushNotification({
        type: 'update',
        content: getApiErrorMessage(error, 'Could not create this update right now.')
      });
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
    const trimmedName = newCommunityName.trim();
    const normalizedName = trimmedName.toLowerCase();

    if (!trimmedName) {
      pushNotification({
        type: 'community',
        content: 'Community name is required.'
      });
      return;
    }

    if (communities.some((community) => String(community?.name || '').trim().toLowerCase() === normalizedName)) {
      pushNotification({
        type: 'community',
        content: 'Community name already taken.'
      });
      return;
    }

    try {
      const payload = {
        name: trimmedName,
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
      pushNotification({
        type: 'community',
        content: getApiErrorMessage(error, 'Could not create this community right now.')
      });
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
    const trimmedName = newGroupName.trim();
    const normalizedName = trimmedName.toLowerCase();

    if (!trimmedName) {
      pushNotification({
        type: 'group',
        content: 'Group name is required.'
      });
      return;
    }

    if (groups.some((group) => String(group?.name || '').trim().toLowerCase() === normalizedName)) {
      pushNotification({
        type: 'group',
        content: 'Group name already taken.'
      });
      return;
    }

    try {
      const payload = {
        name: trimmedName,
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
      pushNotification({
        type: 'group',
        content: getApiErrorMessage(error, 'Could not create this group right now.')
      });
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
        await loadContactUsers();
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
        await loadContactUsers();
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
      pushNotification({
        type: 'group',
        content: getApiErrorMessage(error, 'Could not add this member right now.')
      });
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
    const rangeError = buildEventRangeError(newEventDate, newEventEndDate);
    if (rangeError) {
      setEventDateError(rangeError);
      return;
    }
    setEventDateError('');
    setEventCreateError('');

    try {
      const eventData = {
        title: newEventTitle.trim(),
        description: newEventDesc.trim(),
        date: newEventDate,
        endDate: newEventEndDate || newEventDate,
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
      setNewEventEndDate('');
      setNewEventLocation('Online');
      setNewEventCoverImage('');
      setNewEventMaxAttendees('');
      setNewEventVisibility('contacts');
      setNewEventContextId('');
      loadEvents();
    } catch (error) {
      setEventCreateError(getApiErrorMessage(error, 'Could not create this event right now.'));
      console.error('Failed to create event', error);
    }
  };

  const handleRsvpEvent = async (id) => {
    try {
      await rsvpEvent(id);
      loadEvents();
    } catch (error) {
      pushNotification({
        type: 'event',
        content: error.response?.data?.message || 'Could not update your RSVP.'
      });
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
      setSelectedChat((prev) => {
        if (!prev?._id) return prev;
        return data.find((chat) => chat._id === prev._id) || prev;
      });
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

  const attachStreamToElement = (videoElementRef, stream) => {
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = stream || null;
    }
  };

  const stopMediaStream = (stream) => {
    stream?.getTracks?.().forEach((track) => track.stop());
  };

  const clearPeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    stopMediaStream(remoteStreamRef.current);
    remoteStreamRef.current = null;
    attachStreamToElement(remoteVideoRef, null);
    pendingIceCandidatesRef.current = [];
  };

  const clearLocalMedia = () => {
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    attachStreamToElement(localVideoRef, null);
  };

  const resetCallResources = () => {
    clearPeerConnection();
    clearLocalMedia();
  };

  const finishCall = (notificationMessage = '') => {
    resetCallResources();
    setCallState(INITIAL_CALL_STATE);
    if (notificationMessage) {
      pushNotification({
        type: 'call',
        content: notificationMessage
      });
    }
  };

  const flushPendingIceCandidates = async (peerConnection) => {
    if (!peerConnection?.remoteDescription) return;

    const queuedCandidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of queuedCandidates) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Failed to apply queued ICE candidate:', error);
      }
    }
  };

  const ensureLocalMediaStream = async ({ allowReceiveOnlyFallback = false } = {}) => {
    if (!isBrowserCallSupported()) {
      throw new Error('Video calls are not supported in this browser.');
    }

    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      attachStreamToElement(localVideoRef, stream);
      setCallState((prev) => ({
        ...prev,
        isMuted: false,
        isCameraOff: false,
        isReceiveOnly: false,
        error: ''
      }));

      return stream;
    } catch (error) {
      if (allowReceiveOnlyFallback && error?.name === 'NotReadableError') {
        const fallbackStream = new MediaStream();
        localStreamRef.current = fallbackStream;
        attachStreamToElement(localVideoRef, fallbackStream);
        setCallState((prev) => ({
          ...prev,
          isMuted: true,
          isCameraOff: true,
          isReceiveOnly: true,
          error: 'Camera or microphone is already being used in another browser/app. Joined in receive-only mode.'
        }));
        return fallbackStream;
      }

      throw error;
    }
  };

  const createPeerConnection = (chatId) => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection(WEBRTC_CONFIGURATION);
    const localStream = localStreamRef.current;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    attachStreamToElement(remoteVideoRef, remoteStream);

    peerConnection.ontrack = (event) => {
      const remoteMediaStream = event.streams?.[0];
      if (remoteMediaStream) {
        remoteStreamRef.current = remoteMediaStream;
        attachStreamToElement(remoteVideoRef, remoteMediaStream);
        setCallState((prev) => (prev.chatId === chatId ? { ...prev } : prev));
        return;
      }

      if (event.track) {
        remoteStream.addTrack(event.track);
        attachStreamToElement(remoteVideoRef, remoteStream);
        setCallState((prev) => (prev.chatId === chatId ? { ...prev } : prev));
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;

      emitCallIceCandidate({
        chatId,
        candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
        fromUserId: getCurrentUserId(),
        fromUserName: currentUserRef.current?.name || 'User'
      });
    };

    peerConnection.onconnectionstatechange = () => {
      const { connectionState } = peerConnection;

      if (connectionState === 'connected') {
        setCallState((prev) => (prev.chatId === chatId ? { ...prev, status: 'connected', error: '' } : prev));
        return;
      }

      if (connectionState === 'failed' || connectionState === 'disconnected') {
        finishCall('Call connection was lost.');
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const startOutgoingOffer = async (chatId) => {
    const localStream = await ensureLocalMediaStream();
    const peerConnection = createPeerConnection(chatId);

    if (peerConnection.getSenders().length === 0) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    emitCallOffer({
      chatId,
      offer,
      fromUserId: getCurrentUserId(),
      fromUserName: currentUserRef.current?.name || 'User'
    });
  };

  const handleStartVideoCall = async () => {
    if (!selectedChat || selectedChat.isGroup) return;

    const otherUser = getDirectChatOtherUser(selectedChat);
    const otherUserId = getEntityId(otherUser?._id || otherUser?.id || otherUser);

    if (!otherUserId) return;

    if (!isBrowserCallSupported()) {
      pushNotification({
        type: 'call',
        content: 'This browser does not support video calling.'
      });
      return;
    }

    if (!isUserOnline(otherUserId)) {
      pushNotification({
        type: 'call',
        content: `${otherUser?.name || 'This contact'} is offline right now.`
      });
      return;
    }

    if (activeCallRef.current.status !== 'idle') {
      pushNotification({
        type: 'call',
        content: 'Finish the current call before starting another one.'
      });
      return;
    }

    try {
      await ensureLocalMediaStream();
      setCallState({
        ...INITIAL_CALL_STATE,
        status: 'outgoing',
        chatId: selectedChat._id,
        chatName: getChatName(selectedChat),
        fromUserId: getCurrentUserId(),
        fromUserName: currentUserRef.current?.name || 'User'
      });
      emitCallRing({
        chatId: selectedChat._id,
        fromUserId: getCurrentUserId(),
        fromUserName: currentUserRef.current?.name || 'User'
      });
    } catch (error) {
      console.error('Failed to start video call:', error);
      finishCall(error?.message || 'Could not access your camera or microphone.');
    }
  };

  const handleAcceptIncomingCall = async () => {
    const activeCall = activeCallRef.current;
    if (activeCall.status !== 'incoming' || !activeCall.chatId) return;

    try {
      await ensureLocalMediaStream({ allowReceiveOnlyFallback: true });

      const matchingChat = chatsRef.current.find((chat) => chat._id === activeCall.chatId);
      if (matchingChat) {
        setActiveTab('chats');
        setSelectedChat(matchingChat);
      }

      setCallState((prev) => ({ ...prev, status: 'connecting', error: '' }));
      emitCallAccept({
        chatId: activeCall.chatId,
        fromUserId: getCurrentUserId(),
        fromUserName: currentUserRef.current?.name || 'User'
      });
    } catch (error) {
      console.error('Failed to accept call:', error);
      emitCallDecline({
        chatId: activeCall.chatId,
        fromUserId: getCurrentUserId(),
        fromUserName: currentUserRef.current?.name || 'User'
      });
      const errorMessage = error?.name === 'NotReadableError'
        ? 'Your camera or microphone is busy in another app or browser.'
        : (error?.message || 'Could not access your camera or microphone.');
      finishCall(errorMessage);
    }
  };

  const handleDeclineIncomingCall = () => {
    const activeCall = activeCallRef.current;
    if (activeCall.status !== 'incoming' || !activeCall.chatId) return;

    emitCallDecline({
      chatId: activeCall.chatId,
      fromUserId: getCurrentUserId(),
      fromUserName: currentUserRef.current?.name || 'User'
    });
    finishCall();
  };

  const handleEndCall = () => {
    const activeCall = activeCallRef.current;
    if (activeCall.status === 'idle' || !activeCall.chatId) return;

    emitCallEnd({
      chatId: activeCall.chatId,
      fromUserId: getCurrentUserId(),
      fromUserName: currentUserRef.current?.name || 'User'
    });
    finishCall();
  };

  const handleToggleCallMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks?.()?.[0];
    if (!audioTrack) return;

    const nextMuted = !activeCallRef.current.isMuted;
    audioTrack.enabled = !nextMuted;
    setCallState((prev) => ({ ...prev, isMuted: nextMuted }));
  };

  const handleToggleCallCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks?.()?.[0];
    if (!videoTrack) return;

    const nextCameraOff = !activeCallRef.current.isCameraOff;
    videoTrack.enabled = !nextCameraOff;
    setCallState((prev) => ({ ...prev, isCameraOff: nextCameraOff }));
  };

  useEffect(() => {
    const handleIncomingCallEvent = ({ chatId, fromUserId, fromUserName }) => {
      if (!chatId || !fromUserId) return;

      const activeCall = activeCallRef.current;
      if (activeCall.status !== 'idle') {
        emitCallBusy({
          chatId,
          fromUserId: getCurrentUserId(),
          fromUserName: currentUserRef.current?.name || 'User'
        });
        return;
      }

      const matchingChat = chatsRef.current.find((chat) => chat._id === chatId);
      setCallState({
        ...INITIAL_CALL_STATE,
        status: 'incoming',
        chatId,
        chatName: matchingChat ? getChatName(matchingChat) : (fromUserName || 'Contact'),
        fromUserId,
        fromUserName: fromUserName || ''
      });
    };

    const handleCallAcceptedEvent = async ({ chatId }) => {
      const activeCall = activeCallRef.current;
      if (activeCall.chatId !== chatId || activeCall.status !== 'outgoing') return;

      setCallState((prev) => (prev.chatId === chatId ? { ...prev, status: 'connecting', error: '' } : prev));

      try {
        await startOutgoingOffer(chatId);
      } catch (error) {
        console.error('Failed to create offer:', error);
        emitCallEnd({
          chatId,
          fromUserId: getCurrentUserId(),
          fromUserName: currentUserRef.current?.name || 'User'
        });
        finishCall('Could not start the video call.');
      }
    };

    const handleCallDeclinedEvent = ({ chatId, fromUserName }) => {
      if (activeCallRef.current.chatId !== chatId) return;
      finishCall(`${fromUserName || 'The other user'} declined the call.`);
    };

    const handleCallBusyEvent = ({ chatId, fromUserName }) => {
      if (activeCallRef.current.chatId !== chatId) return;
      finishCall(`${fromUserName || 'The other user'} is already on another call.`);
    };

    const handleCallOfferEvent = async ({ chatId, offer }) => {
      const activeCall = activeCallRef.current;
      if (!offer || activeCall.chatId !== chatId || activeCall.status === 'idle') return;

      try {
        await ensureLocalMediaStream();
        const peerConnection = createPeerConnection(chatId);
        await peerConnection.setRemoteDescription(offer);
        await flushPendingIceCandidates(peerConnection);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        emitCallAnswer({
          chatId,
          answer,
          fromUserId: getCurrentUserId(),
          fromUserName: currentUserRef.current?.name || 'User'
        });

        setCallState((prev) => (prev.chatId === chatId ? { ...prev, status: 'connecting', error: '' } : prev));
      } catch (error) {
        console.error('Failed to process offer:', error);
        emitCallEnd({
          chatId,
          fromUserId: getCurrentUserId(),
          fromUserName: currentUserRef.current?.name || 'User'
        });
        finishCall('Could not connect this call.');
      }
    };

    const handleCallAnswerEvent = async ({ chatId, answer }) => {
      if (!answer || activeCallRef.current.chatId !== chatId || !peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(answer);
        await flushPendingIceCandidates(peerConnectionRef.current);
        setCallState((prev) => (prev.chatId === chatId ? { ...prev, status: 'connecting', error: '' } : prev));
      } catch (error) {
        console.error('Failed to process answer:', error);
        finishCall('Could not complete the video call connection.');
      }
    };

    const handleCallIceCandidateEvent = async ({ chatId, candidate }) => {
      if (!candidate || activeCallRef.current.chatId !== chatId) return;

      const iceCandidate = new RTCIceCandidate(candidate);
      const peerConnection = peerConnectionRef.current;

      if (!peerConnection || !peerConnection.remoteDescription) {
        pendingIceCandidatesRef.current.push(iceCandidate);
        return;
      }

      try {
        await peerConnection.addIceCandidate(iceCandidate);
      } catch (error) {
        console.error('Failed to add ICE candidate:', error);
      }
    };

    const handleCallEndedEvent = ({ chatId, fromUserName }) => {
      if (activeCallRef.current.chatId !== chatId) return;
      finishCall(`${fromUserName || 'The other user'} ended the call.`);
    };

    onIncomingCall(handleIncomingCallEvent);
    onCallAccepted(handleCallAcceptedEvent);
    onCallDeclined(handleCallDeclinedEvent);
    onCallBusy(handleCallBusyEvent);
    onCallOffer(handleCallOfferEvent);
    onCallAnswer(handleCallAnswerEvent);
    onCallIceCandidate(handleCallIceCandidateEvent);
    onCallEnded(handleCallEndedEvent);

    return () => {
      offIncomingCall(handleIncomingCallEvent);
      offCallAccepted(handleCallAcceptedEvent);
      offCallDeclined(handleCallDeclinedEvent);
      offCallBusy(handleCallBusyEvent);
      offCallOffer(handleCallOfferEvent);
      offCallAnswer(handleCallAnswerEvent);
      offCallIceCandidate(handleCallIceCandidateEvent);
      offCallEnded(handleCallEndedEvent);
    };
  }, []);

  useEffect(() => () => {
    resetCallResources();
  }, []);

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

  const validateScheduleDates = ({ scheduledFor, endsAt }) => {
    if (!scheduledFor) return '';
    const minDate = getCurrentMinuteDate();
    const scheduledDate = new Date(scheduledFor);
    if (Number.isNaN(scheduledDate.getTime())) return 'Enter a valid schedule date.';
    if (scheduledDate < minDate) return 'Past dates are not allowed.';
    if (!endsAt) return '';
    const endDate = new Date(endsAt);
    if (Number.isNaN(endDate.getTime())) return 'Enter a valid end date.';
    if (endDate < minDate) return 'End date cannot be in the past.';
    if (endDate < scheduledDate) return 'End date must be after the scheduled time.';
    return '';
  };

  const handleOpenScheduleModal = () => {
    if (!selectedChat || isChatReadOnlyForCurrentUser(selectedChat)) return;
    setScheduleDateError('');
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
    if (!selectedChat || isChatReadOnlyForCurrentUser(selectedChat)) return;
    if (!scheduleForm.content.trim() || !scheduleForm.scheduledFor) return;

    const validationError = validateScheduleDates({
      scheduledFor: scheduleForm.scheduledFor,
      endsAt: scheduleForm.endsAt
    });
    if (validationError) {
      setScheduleDateError(validationError);
      return;
    }

    const scheduledDate = new Date(scheduleForm.scheduledFor);
    if (Number.isNaN(scheduledDate.getTime())) return;
    const endsAtDate = scheduleForm.endsAt ? new Date(scheduleForm.endsAt) : null;
    setScheduleDateError('');

    const payload = {
      chatId: selectedChat._id,
      content: scheduleForm.content.trim(),
      scheduledFor: scheduledDate.toISOString(),
      scheduleType: scheduleForm.scheduleType,
      customInterval: scheduleForm.customInterval,
      customUnit: scheduleForm.customUnit,
      endsAt: endsAtDate ? endsAtDate.toISOString() : null
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
    if (isChatReadOnlyForCurrentUser(selectedChat)) return;
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
    if (!file || !selectedChat || isChatReadOnlyForCurrentUser(selectedChat)) {
      if (event?.target) {
        event.target.value = '';
      }
      return;
    }
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
    if (isChatReadOnlyForCurrentUser(selectedChat)) return;
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
    if (!selectedChat || isChatReadOnlyForCurrentUser(selectedChat)) return;
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
    if (!selectedChat || isChatReadOnlyForCurrentUser(selectedChat)) return;

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

      // Scroll to bottom immediately after sending using requestAnimationFrame
      requestAnimationFrame(() => {
        if (chatMessagesContainerRef.current) {
          chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
        }
      });

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

  const isCurrentUserCommunityMember = (community) => {
    const userId = localStorage.getItem('userId');
    if (!community || !userId) return false;
    if (community.isMember === true) return true;
    if (community.role === 'admin' || community.role === 'member') return true;
    return (community.members || []).some((member) => (member?._id || member) === userId);
  };

  const getCommunityForChat = (chat) => {
    if (!chat) return null;

    const chatId = getEntityId(chat);
    const communityId = getEntityId(chat.community);

    if (selectedCommunity) {
      const selectedCommunityId = getEntityId(selectedCommunity);
      const selectedAnnouncementChatId = getEntityId(selectedCommunity.announcementChat);
      if (selectedCommunityId === communityId || (selectedAnnouncementChatId && selectedAnnouncementChatId === chatId)) {
        return selectedCommunity;
      }
    }

    const communityFromList = communities.find((community) => {
      const listCommunityId = getEntityId(community);
      const announcementChatId = getEntityId(community?.announcementChat);
      return listCommunityId === communityId || (announcementChatId && announcementChatId === chatId);
    });

    if (communityFromList) {
      return communityFromList;
    }

    return chat.community && typeof chat.community === 'object' ? chat.community : null;
  };

  const isCommunityAnnouncementChat = (chat) => Boolean(chat && (chat.kind === 'community-announcement' || chat.community));

  const isChatReadOnlyForCurrentUser = (chat) => {
    if (!isCommunityAnnouncementChat(chat)) return false;
    return !isCurrentUserCommunityAdmin(getCommunityForChat(chat));
  };

  const getDirectChatOtherUser = (chat) => {
    if (!chat || chat.isGroup) return null;
    const currentUserId = getCurrentUserId();
    return chat.participants?.find((participant) => {
      const participantId = getEntityId(participant?._id || participant?.id || participant);
      return participantId && participantId !== currentUserId;
    }) || null;
  };

  const getChatName = (chat) => {
    if (chat?.isGroup) return chat.name || 'Group Chat';
    const otherUser = getDirectChatOtherUser(chat);
    return otherUser?.name || 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (!chat?.isGroup) {
      const otherUser = getDirectChatOtherUser(chat);
      if (otherUser?.profilePic) {
        return (
          <SmartImage
            srcPath={otherUser.profilePic}
            alt={otherUser?.name || 'User'}
            className="avatar-img"
            fallback={otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
          />
        );
      }
    }
    const name = getChatName(chat);
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const normalizedUserId = String(userId);
    for (const onlineUserId of onlineUsers) {
      if (String(onlineUserId) === normalizedUserId) {
        return true;
      }
    }
    return false;
  };

  const isBrowserCallSupported = () => (
    typeof window !== 'undefined'
    && typeof window.RTCPeerConnection !== 'undefined'
    && typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
  );

  const getCallStatusLabel = (status) => {
    switch (status) {
      case 'incoming':
        return 'Incoming video call';
      case 'outgoing':
        return 'Calling...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Video call live';
      default:
        return '';
    }
  };

  useEffect(() => {
    const cursorElement = cursorRef.current;
    if (!cursorEnabled || !cursorElement) {
      if (cursorFrameRef.current) {
        cancelAnimationFrame(cursorFrameRef.current);
        cursorFrameRef.current = null;
      }
      return undefined;
    }

    const target = cursorTargetRef.current;
    const current = cursorCurrentRef.current;
    target.size = cursorSize;

    const syncPosition = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      target.opacity = 1;

      if (current.opacity === 0) {
        current.x = event.clientX;
        current.y = event.clientY;
        current.size = target.size;
        current.opacity = 1;
      }
    };

    const hideCursor = () => {
      target.opacity = 0;
      cursorElement.classList.remove('is-pressed');
    };

    const handlePointerDown = () => {
      target.size = Math.max(28, cursorSize - 8);
      cursorElement.classList.add('is-pressed');
    };

    const handlePointerUp = () => {
      target.size = cursorSize;
      cursorElement.classList.remove('is-pressed');
    };

    const animateCursor = () => {
      current.x += (target.x - current.x) * 0.22;
      current.y += (target.y - current.y) * 0.22;
      current.size += (target.size - current.size) * 0.18;
      current.opacity += (target.opacity - current.opacity) * 0.2;

      const safeSize = Math.max(0, current.size);
      const halfSize = safeSize / 2;

      cursorElement.style.transform = `translate3d(${current.x - halfSize}px, ${current.y - halfSize}px, 0)`;
      cursorElement.style.width = `${safeSize}px`;
      cursorElement.style.height = `${safeSize}px`;
      cursorElement.style.opacity = `${Math.max(0, Math.min(1, current.opacity))}`;

      cursorFrameRef.current = window.requestAnimationFrame(animateCursor);
    };

    cursorFrameRef.current = window.requestAnimationFrame(animateCursor);
    window.addEventListener('pointermove', syncPosition, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
    window.addEventListener('blur', hideCursor);
    document.addEventListener('mouseleave', hideCursor);

    return () => {
      if (cursorFrameRef.current) {
        cancelAnimationFrame(cursorFrameRef.current);
        cursorFrameRef.current = null;
      }
      window.removeEventListener('pointermove', syncPosition);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', hideCursor);
      document.removeEventListener('mouseleave', hideCursor);
    };
  }, [cursorEnabled, cursorSize]);

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

  const getAvatarUrl = (path) => {
    return buildMediaCandidates(path)[0] || '';
  };

  const isImageSource = (value) => {
    const normalizedValue = normalizeMediaPath(value);
    if (!normalizedValue) return false;
    return /^(?:https?:|data:|blob:)/i.test(normalizedValue)
      || normalizedValue.startsWith(API_BASE_URL)
      || normalizedValue.startsWith(DEFAULT_API_BASE_URL)
      || normalizedValue.startsWith('/')
      || normalizedValue.startsWith('uploads/')
      || normalizedValue.startsWith('images/')
      || /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i.test(normalizedValue);
  };

  const renderEntityAvatar = (imagePath, icon, label, alt) => {
    if (isImageSource(imagePath)) {
      return <SmartImage srcPath={imagePath} alt={alt} fallback={label?.charAt(0)?.toUpperCase() || '?'} />;
    }
    if (isImageSource(icon)) {
      return <SmartImage srcPath={icon} alt={alt} fallback={label?.charAt(0)?.toUpperCase() || '?'} />;
    }
    return icon || label?.charAt(0)?.toUpperCase() || '?';
  };

  const getProfileSummary = (user) => (
    user?.bio
    || user?.whoAmI
    || user?.aboutInfo
    || user?.education
    || ''
  );

  const handleOpenProfilePreview = async (userId) => {
    const resolvedUserId = userId?._id || userId?.id || userId;
    if (!resolvedUserId) return;

    const currentUserId = currentUser?._id || currentUser?.id;
    if (currentUserId && resolvedUserId.toString() === currentUserId.toString()) {
      setProfilePreview({
        ...currentUser,
        _id: currentUserId,
        id: currentUserId,
        relationship: 'self',
        friendsCount: currentUser?.friendsCount || 0
      });
      setProfilePreviewError('');
      setProfilePreviewLoading(false);
      return;
    }

    setProfilePreviewLoading(true);
    setProfilePreviewError('');
    try {
      const { user } = await getPublicUserProfile(resolvedUserId);
      setProfilePreview(user);
    } catch (error) {
      setProfilePreviewError(error.response?.data?.message || 'Could not load this profile right now.');
      setProfilePreview(null);
    } finally {
      setProfilePreviewLoading(false);
    }
  };

  const handleCloseProfilePreview = () => {
    setProfilePreview(null);
    setProfilePreviewError('');
    setProfilePreviewLoading(false);
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
                  <SmartImage
                    key={file.url}
                    srcPath={file.url}
                    alt={file.fileName || 'attachment'}
                    className="file-image"
                  />
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

  const loadContactUsers = async () => {
    setPeopleDirectoryLoading(true);
    try {
      const users = await getFriends();
      setAllUsers(users);
      return users;
    } catch (error) {
      console.error('Failed to load contacts:', error);
      return [];
    } finally {
      setPeopleDirectoryLoading(false);
    }
  };

  const loadFriendsAndRequests = async () => {
    setPeopleDirectoryLoading(true);
    try {
      const [users, requests] = await Promise.all([
        getFriends(),
        getFriendRequests()
      ]);
      setAllUsers(users);
      setFriendRequests(requests);
    } catch (error) {
      console.error('Failed to load users/requests:', error);
    } finally {
      setPeopleDirectoryLoading(false);
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
    setActiveChatModalTab('contacts');
    try {
      await loadFriendsAndRequests();
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
    setSearchQuery('');
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

  const selectedDirectChatUser = getDirectChatOtherUser(selectedChat);
  const selectedDirectChatUserId = getEntityId(selectedDirectChatUser?._id || selectedDirectChatUser?.id || selectedDirectChatUser);
  const canStartSelectedVideoCall = Boolean(
    selectedChat
    && !selectedChat.isGroup
    && selectedDirectChatUserId
    && isBrowserCallSupported()
    && isUserOnline(selectedDirectChatUserId)
    && callState.status === 'idle'
  );
  const selectedChatVideoCallTitle = !selectedChat || selectedChat.isGroup
    ? 'Video calls are available in direct chats'
    : !isBrowserCallSupported()
      ? 'This browser does not support video calling'
      : !isUserOnline(selectedDirectChatUserId)
        ? 'This contact is offline'
        : callState.status !== 'idle'
          ? 'Finish the current call first'
          : 'Start video call';
  const activeCallChat = chats.find((chat) => chat._id === callState.chatId)
    || (selectedChat?._id === callState.chatId ? selectedChat : null);
  const activeCallName = activeCallChat
    ? getChatName(activeCallChat)
    : (callState.chatName || callState.fromUserName || 'Contact');

  const filteredDiscoverUsers = discoverUsers
    .filter((user) =>
      (user.name?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes((searchQuery || '').toLowerCase())
    );

  const selectedGroupMemberIds = new Set(
    (selectedGroup?.members || []).map((member) => getEntityId(member)).filter(Boolean)
  );
  const eligibleGroupUsers = [];
  const eligibleGroupUserIds = new Set();

  const appendEligibleGroupUsers = (users = []) => {
    users.forEach((user) => {
      const userId = getEntityId(user);
      if (!userId || selectedGroupMemberIds.has(userId) || eligibleGroupUserIds.has(userId)) {
        return;
      }
      eligibleGroupUserIds.add(userId);
      eligibleGroupUsers.push(user);
    });
  };

  appendEligibleGroupUsers(allUsers);
  appendEligibleGroupUsers(selectedGroup?.community?.members || []);

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

  const eventTabs = [
    { key: 'upcoming', label: 'upcoming' },
    { key: 'myUpcoming', label: 'my events' },
    { key: 'myPast', label: 'past my events' }
  ];

  const filteredEvents = (() => {
    const allEvents = [...(events || [])];
    const matchesTab = (event) => {
      const pastEvent = isEventPast(event);
      const myEvent = isMyEvent(event);

      if (activeEventsTab === 'myUpcoming') return myEvent && !pastEvent;
      if (activeEventsTab === 'myPast') return myEvent && pastEvent;
      return !pastEvent;
    };

    const sorted = allEvents
      .filter(matchesTab)
      .sort((left, right) => {
        const leftTime = new Date(getEventEndValue(left) || left?.date).getTime();
        const rightTime = new Date(getEventEndValue(right) || right?.date).getTime();
        return activeEventsTab === 'myPast'
          ? rightTime - leftTime
          : leftTime - rightTime;
      });

    return sorted;
  })();

  const getEventEmptyState = () => {
    if (activeEventsTab === 'myUpcoming') return 'You have no upcoming events yet.';
    if (activeEventsTab === 'myPast') return 'No past events from your calendar yet.';
    return 'No upcoming events. Plan something!';
  };

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

        <div className="messages-container" ref={chatMessagesContainerRef}>
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
    <div className={`home-page ${theme === 'light' ? 'theme-light' : 'theme-dark'} ${cursorEnabled ? 'custom-cursor-enabled' : ''} ${isThemeTransitioning ? 'theme-transitioning' : ''}`}>
      {appLoading && (
        <div className="page-loading-overlay" aria-live="polite">
          <div className="page-loading-card">
            <div className="page-loading-spinner" />
            <p>Loading your workspace...</p>
          </div>
        </div>
      )}
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
              ref={notificationButtonRef}
              className="icon-btn"
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-expanded={showNotifications}
              aria-haspopup="dialog"
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
              onClick={handleThemeToggle}
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
              title="Profile"
              aria-label="Profile"
              onMouseEnter={() => setCursorSize(60)}
              onMouseLeave={() => setCursorSize(40)}
            >
              {currentUser?.profilePic ? (
                <SmartImage
                  srcPath={currentUser.profilePic}
                  alt={currentUser?.name || 'Profile'}
                  className="profile-btn-avatar"
                  fallback={<User size={18} />}
                />
              ) : currentUser?.name ? (
                <span className="profile-btn-fallback">{currentUser.name.charAt(0).toUpperCase()}</span>
              ) : (
                <User size={18} />
              )}
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
        <div ref={notificationPanelRef} className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="notification-header">
            <span>Notifications</span>
            <button type="button" className="notification-clear" onClick={() => setNotifications([])}>clear</button>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={`notification-item ${note.chatId ? 'notification-item--interactive' : ''}`}
                  onClick={() => handleNotificationItemClick(note)}
                >
                  <div className="notification-title">{note.type || 'message'}</div>
                  <div className="notification-body">{note.content || 'New activity'}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {pageSectionLoading === activeTab && activeTab !== 'chats' && (
          <div className="page-inline-loader" aria-live="polite">
            <div className="page-loading-spinner page-loading-spinner--small" />
            <span>Loading {activeTab}...</span>
          </div>
        )}

        {/* Chats Section */}
        {activeTab === 'chats' && (
          <div className="section-content rounded-lg">
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
            {selectedChat && (() => {
              const disableInput = isChatReadOnlyForCurrentUser(selectedChat);

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
                      {/* Online status indicator */}
                      {!selectedChat.isGroup && selectedChat.participants && (
                        (() => {
                          const otherUser = getDirectChatOtherUser(selectedChat);
                          return otherUser && isUserOnline(otherUser?._id || otherUser?.id || otherUser) && (
                            <div className="online-indicator"></div>
                          );
                        })()
                      )}
                    </div>
                    <div>
                      <h3>{getChatName(selectedChat)}</h3>
                      {!selectedChat.isGroup && selectedChat.participants && (
                        (() => {
                          const otherUser = getDirectChatOtherUser(selectedChat);
                          return otherUser && isUserOnline(otherUser?._id || otherUser?.id || otherUser) && (
                            <span className="online-status-text">online</span>
                          );
                        })()
                      )}
                    </div>
                  </div>
                  <div className="chat-window-actions">
                    {!selectedChat.isGroup && selectedChat.participants && (
                      <>
                      <button
                        type="button"
                        className="chat-action-btn"
                        onClick={handleStartVideoCall}
                        disabled={!canStartSelectedVideoCall}
                        title={selectedChatVideoCallTitle}
                      >
                        <Video size={16} />
                      </button>
                      <button
                        type="button"
                        className="chat-action-btn"
                        onClick={() => {
                          const otherUser = getDirectChatOtherUser(selectedChat);
                          handleOpenProfilePreview(otherUser?._id || otherUser?.id || otherUser);
                        }}
                        title="View profile"
                      >
                        <User size={16} />
                      </button>
                      </>
                    )}
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

                <div className="messages-container" ref={chatMessagesContainerRef}>
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
                                disabled={disableInput}
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
            })()}
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

              <div className="aichat-messages" ref={aiMessagesContainerRef}>
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
                  <button type="submit" className="send-btn" disabled={isAiTyping || !aiInput.trim()}>
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
                <div className="detail-header detail-header--community">
                  <div className="detail-header-hero">
                    <div className="avatar-large" style={{ fontSize: '3rem' }}>
                      {renderEntityAvatar('', selectedCommunity.icon, selectedCommunity.name, selectedCommunity.name || 'Community')}
                    </div>
                    <div className="detail-header-copy">
                      <span className="detail-eyebrow">{selectedCommunity.category || 'community'}</span>
                      <h2>{selectedCommunity.name}</h2>
                      <p className="detail-meta">{selectedCommunity.members?.length || 0} members</p>
                    </div>
                  </div>
                  <p className="detail-description">
                    {selectedCommunity.description || 'A shared space for announcements, conversation, and coordinated activity.'}
                  </p>
                  {selectedCommunity.rules && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '10px' }}>Rules:</h4>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>{selectedCommunity.rules}</p>
                    </div>
                  )}
                  <button
                    className="join-btn join-btn--muted"
                    style={{ marginTop: '20px' }}
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
                              {member?.username && <span className="member-handle">@{member.username}</span>}
                              {isCreator && <span className="member-role">creator</span>}
                              {!isCreator && isAdmin && <span className="member-role">admin</span>}
                              {!isAdmin && <span className="member-role">member</span>}
                            </div>
                            <div className="member-actions">
                              <button type="button" onClick={() => handleOpenProfilePreview(memberId)} aria-label="View profile" title="View profile">
                                <User size={14} />
                              </button>
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
                            className="community-card community-card--group community-card--nested"
                            onClick={() => openGroupDetails(group._id)}
                          >
                            <div className="community-header">
                              <div className="community-avatar-large">
                                {renderEntityAvatar(group.profileImage, group.icon, group.name, group.name || 'Group')}
                              </div>
                              <span className="community-card-pill">group</span>
                            </div>
                            <div className="community-card-copy">
                              <h3>{group.name}</h3>
                              <p className="community-card-description">
                                {group.description || 'Focused discussion, updates, and events for this community circle.'}
                              </p>
                            </div>
                            <div className="community-card-footer">
                              <p className="community-members">{group.members?.length || 0} members</p>
                              <span className="community-status">open</span>
                            </div>
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
                    communities.map((community) => {
                      const isJoined = isCurrentUserCommunityMember(community);

                      return (
                      <div
                        key={community._id}
                        className="community-card community-card--community"
                        onMouseEnter={() => setCursorSize(70)}
                        onMouseLeave={() => setCursorSize(40)}
                        onClick={() => {
                          if (isJoined) {
                            openCommunityDetails(community._id);
                          }
                        }}
                      >
                        <div className="community-header">
                          <div className="community-avatar-large">
                            {renderEntityAvatar('', community.icon, community.name, community.name || 'Community')}
                          </div>
                          <span className="community-card-pill">{community.category || 'community'}</span>
                        </div>
                        <div className="community-card-copy">
                          <h3>{community.name}</h3>
                          <p className="community-card-description">
                            {community.description || 'Bring announcements, shared interests, and local energy into one place.'}
                          </p>
                        </div>
                        <div className="community-card-footer">
                          <p className="community-members">{community.members?.length || 0} members</p>
                          <span className="community-status">
                            {isJoined
                              ? 'joined'
                              : 'discover'}
                          </span>
                        </div>
                        {isJoined ? (
                          <button
                            className="join-btn join-btn--muted"
                            onClick={(e) => { e.stopPropagation(); handleLeaveCommunity(community._id); }}
                            onMouseEnter={() => setCursorSize(60)}
                            onMouseLeave={() => setCursorSize(40)}
                          >
                            leave
                          </button>
                        ) : (
                          <button
                            className="join-btn join-btn--community"
                            onClick={(e) => { e.stopPropagation(); handleJoinCommunity(community._id); }}
                            onMouseEnter={() => setCursorSize(60)}
                            onMouseLeave={() => setCursorSize(40)}
                          >
                            join
                          </button>
                        )}
                      </div>
                    );
                    })
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
                <div className="detail-header detail-header--group">
                  <div className="detail-header-hero">
                    <div className="avatar-large" style={{ fontSize: '3rem' }}>
                      {renderEntityAvatar(selectedGroup.profileImage, selectedGroup.icon, selectedGroup.name, selectedGroup.name || 'Group')}
                    </div>
                    <div className="detail-header-copy">
                      <span className="detail-eyebrow">group</span>
                      <h2>{selectedGroup.name}</h2>
                      <p className="detail-meta">{selectedGroup.members?.length || 0} members</p>
                    </div>
                  </div>
                  <p className="detail-description">
                    {selectedGroup.description || 'A tighter room for day-to-day collaboration, updates, and event planning.'}
                  </p>
                  <button
                    className="join-btn join-btn--muted"
                    style={{ marginTop: '20px' }}
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
                          disabled={peopleDirectoryLoading || eligibleGroupUsers.length === 0}
                        >
                          <option value="">
                            {peopleDirectoryLoading
                              ? 'Loading people...'
                              : eligibleGroupUsers.length === 0
                                ? 'No eligible people to add'
                                : 'Select user to add'}
                          </option>
                          {eligibleGroupUsers.map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.name} (@{user.username})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="create-group-btn"
                          onClick={handleAddGroupMember}
                          disabled={peopleDirectoryLoading || !selectedMemberToAdd}
                        >
                          {peopleDirectoryLoading ? 'loading...' : 'add'}
                        </button>
                      </div>
                    )}
                    {isCurrentUserGroupAdmin(selectedGroup) && !peopleDirectoryLoading && eligibleGroupUsers.length === 0 && (
                      <div className="member-helper-text">
                        Add contacts first, or use a community-linked group to pick from community members here.
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
                              {member?.username && <span className="member-handle">@{member.username}</span>}
                              {isCreator && <span className="member-role">creator</span>}
                              {!isCreator && isAdmin && <span className="member-role">admin</span>}
                              {!isAdmin && <span className="member-role">member</span>}
                            </div>
                            <div className="member-actions">
                              <button type="button" onClick={() => handleOpenProfilePreview(memberId)} aria-label="View profile" title="View profile">
                                <User size={14} />
                              </button>
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
 <span>Only admins can invite</span> 
 <input 
 type="checkbox" 
 checked={Boolean(selectedGroup?.settings?.onlyAdminsInvite)} 
 onChange={(e) => handleGroupSettingsChange({ onlyAdminsInvite: e.target.checked })} 
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
                            <div
                              className="feed-header"
                              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer' }}
                              onClick={() => handleOpenProfilePreview(update.author?._id || update.author?.id)}
                            >
                              <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                                {update.author?.profilePic ? (
                                  <SmartImage
                                    srcPath={update.author.profilePic}
                                    alt={update.author?.name || 'User'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    fallback={update.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  />
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
                                <SmartImage
                                  srcPath={update.image}
                                  alt="Update"
                                  style={{ width: '100%', display: 'block' }}
                                  fallback={<div style={{ padding: '18px', color: 'rgba(255,255,255,0.65)', background: 'rgba(0,0,0,0.2)' }}>Image unavailable</div>}
                                />
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
                        className="community-card community-card--group"
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
                            {renderEntityAvatar(group.profileImage, group.icon, group.name, group.name || 'Group')}
                          </div>
                          <span className="community-card-pill">{group.community?.name ? 'linked group' : 'private group'}</span>
                        </div>
                        <div className="community-card-copy">
                          <h3>{group.name}</h3>
                          <p className="community-card-description">
                            {group.description || 'Smaller, faster conversations for people working around the same topic.'}
                          </p>
                        </div>
                        <div className="community-card-footer">
                          <p className="community-members">{group.members?.length || 0} members</p>
                          <span className="community-status">
                            {(group.members || []).some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId'))
                              ? 'member'
                              : 'available'}
                          </span>
                        </div>
                        {(group.members || []).some(m => m._id === localStorage.getItem('userId') || m === localStorage.getItem('userId')) ? (
                          <button
                            className="join-btn join-btn--muted"
                            onClick={(e) => { e.stopPropagation(); handleLeaveGroup(group._id); }}
                            onMouseEnter={() => setCursorSize(60)}
                            onMouseLeave={() => setCursorSize(40)}
                          >
                            leave
                          </button>
                        ) : (
                          <button
                            className="join-btn join-btn--group"
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
                        <SmartImage
                          srcPath={update.author.profilePic}
                          alt={update.author?.name || 'User'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          fallback={update.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                        />
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
                    <div
                      className="feed-header"
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer' }}
                      onClick={() => handleOpenProfilePreview(update.author?._id || update.author?.id)}
                    >
                      <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                        {update.author?.profilePic ? (
                          <SmartImage
                            srcPath={update.author.profilePic}
                            alt={update.author?.name || 'User'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            fallback={update.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                          />
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
                        <SmartImage
                          srcPath={update.image}
                          alt="Update"
                          style={{ width: '100%', display: 'block' }}
                          fallback={<div style={{ padding: '18px', color: 'rgba(255,255,255,0.65)', background: 'rgba(0,0,0,0.2)' }}>Image unavailable</div>}
                        />
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
                {eventTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`event-tab ${activeEventsTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveEventsTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="events-list">
                {filteredEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    {getEventEmptyState()}
                  </div>
                ) : (
                  filteredEvents.map((event) => {
                    const startDate = new Date(event.date);
                    const endDate = new Date(getEventEndValue(event));
                    const pastEvent = isEventPast(event);
                    const isGoing = (event.attendees || []).some((attendee) => ((attendee?._id || attendee) || '').toString() === getCurrentUserId());
                    const contextLabel = event.community?.name || event.group?.name || 'Contacts';

                    return (
                      <div
                      key={event._id}
                      className="event-card"
                      onMouseEnter={() => setCursorSize(70)}
                      onMouseLeave={() => setCursorSize(40)}
                    >
                      <div className="event-date-badge">
                        <span className="date-day">{startDate.getDate()}</span>
                        <span className="date-month">{startDate.toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div className="event-details">
                        <h3>{event.title}</h3>
                        <p className="event-community">{contextLabel}</p>
                        <div className="event-meta">
                          <span>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>·</span>
                          <span>{event.location}</span>
                          <span className="hide-mobile">·</span>
                          <span className="hide-mobile">{event.attendees?.length || 0} attending</span>
                        </div>
                      </div>
                      {isGoing ? (
                        <button
                          className="event-join-btn"
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                          disabled={pastEvent}
                          onClick={() => handleRsvpEvent(event._id)}
                          onMouseEnter={() => setCursorSize(60)}
                          onMouseLeave={() => setCursorSize(40)}
                        >
                          {pastEvent ? 'ended' : 'going'}
                        </button>
                      ) : (
                        <button
                          className="event-join-btn"
                          disabled={pastEvent}
                          onClick={() => handleRsvpEvent(event._id)}
                          onMouseEnter={() => setCursorSize(60)}
                          onMouseLeave={() => setCursorSize(40)}
                        >
                          {pastEvent ? 'ended' : 'join'}
                        </button>
                      )}
                      </div>
                    );
                  })
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
                          <SmartImage srcPath={currentUser.profilePic} alt="Profile" fallback={<User size={18} />} />
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
                        accept={SUPPORTED_IMAGE_UPLOAD_ACCEPT}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const imageError = getUploadImageError(file);
                            if (imageError) {
                              setProfileFile(null);
                              setPreviewImage(null);
                              e.target.value = '';
                              pushNotification({
                                type: 'profile',
                                content: imageError
                              });
                              return;
                            }

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

                    <button type="submit" className="create-group-btn" disabled={profileUpdateLoading}>
                      {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
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
                      onClick={handleThemeToggle}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setScheduleForm((prev) => ({ ...prev, scheduledFor: value }));
                    setScheduleDateError(validateScheduleDates({ scheduledFor: value, endsAt: scheduleForm.endsAt }));
                  }}
                  min={minDateTimeLocal}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setScheduleForm((prev) => ({ ...prev, endsAt: value }));
                    setScheduleDateError(validateScheduleDates({ scheduledFor: scheduleForm.scheduledFor, endsAt: value }));
                  }}
                  min={scheduleForm.scheduledFor || minDateTimeLocal}
                />
              </div>
              {scheduleDateError && <div className="chat-action-error">{scheduleDateError}</div>}
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
            <div className="modal-content chat-picker-modal" onClick={(e) => e.stopPropagation()}>
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

              <div className="chat-modal-tabs">
                {[
                  { key: 'contacts', label: 'contacts' },
                  { key: 'requests', label: 'requests' },
                  { key: 'discover', label: 'discover' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`chat-modal-tab ${activeChatModalTab === tab.key ? 'active' : ''}`}
                    onClick={() => {
                      setActiveChatModalTab(tab.key);
                      setChatActionError('');
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="modal-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder={
                    activeChatModalTab === 'discover'
                      ? 'Search by name or username to add contacts...'
                      : activeChatModalTab === 'requests'
                        ? 'Filter requests...'
                        : 'Search your contacts...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="modal-search-input"
                  autoFocus
                />
              </div>

              {chatActionError && <div className="chat-action-error">{chatActionError}</div>}

              <div className="modal-users-list">
                {activeChatModalTab === 'contacts' && (
                  filteredUsers.length === 0 ? (
                    <div className="no-users chat-modal-empty">
                      {searchQuery ? `No contacts found for "${searchQuery}"` : 'No contacts yet. Switch to discover to add people.'}
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const summary = getProfileSummary(user);
                      return (
                        <div
                          key={user._id}
                          className="modal-user-item"
                          onClick={() => handleCreateChat(user._id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="modal-user-avatar">
                            {user.profilePic ? (
                              <SmartImage srcPath={user.profilePic} alt={user.name || 'User'} className="avatar-img" fallback={(user.name?.charAt(0) || '?').toUpperCase()} />
                            ) : (
                              (user.name?.charAt(0) || '?').toUpperCase()
                            )}
                          </div>
                          <div className="modal-user-info">
                            <h4>{highlightMatch(user.name || 'Unknown', searchQuery)}</h4>
                            <p>@{highlightMatch(user.username || '', searchQuery)}</p>
                            {summary && <p className="modal-user-meta">{summary}</p>}
                          </div>
                          <button
                            type="button"
                            className="request-btn request-btn--icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProfilePreview(user._id);
                            }}
                            aria-label="View profile"
                            title="View profile"
                          >
                            <User size={14} />
                          </button>
                          <button
                            type="button"
                            className="request-btn accept"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateChat(user._id);
                            }}
                          >
                            chat
                          </button>
                        </div>
                      );
                    })
                  )
                )}

                {activeChatModalTab === 'requests' && (
                  (() => {
                    const normalizedQuery = (searchQuery || '').toLowerCase();
                    const incoming = (friendRequests.incoming || []).filter((user) =>
                      !normalizedQuery
                      || (user.name?.toLowerCase() || '').includes(normalizedQuery)
                      || (user.username?.toLowerCase() || '').includes(normalizedQuery)
                    );
                    const outgoing = (friendRequests.outgoing || []).filter((user) =>
                      !normalizedQuery
                      || (user.name?.toLowerCase() || '').includes(normalizedQuery)
                      || (user.username?.toLowerCase() || '').includes(normalizedQuery)
                    );

                    if (incoming.length === 0 && outgoing.length === 0) {
                      return <div className="no-users chat-modal-empty">No pending contact requests.</div>;
                    }

                    return (
                      <>
                        {incoming.map((user) => (
                          <div key={`incoming-${user._id}`} className="modal-user-item">
                          <div className="modal-user-avatar">
                            {user.profilePic ? (
                                <SmartImage srcPath={user.profilePic} alt={user.name || 'User'} className="avatar-img" fallback={(user.name?.charAt(0) || '?').toUpperCase()} />
                              ) : (
                                (user.name?.charAt(0) || '?').toUpperCase()
                              )}
                            </div>
                            <div className="modal-user-info">
                              <h4>{user.name || 'Unknown'}</h4>
                              <p>@{user.username || ''}</p>
                              <p className="modal-user-meta">Wants to connect with you</p>
                            </div>
                            <button
                              type="button"
                              className="request-btn request-btn--icon"
                              onClick={() => handleOpenProfilePreview(user._id)}
                              aria-label="View profile"
                              title="View profile"
                            >
                              <User size={14} />
                            </button>
                            <button
                              type="button"
                              className="request-btn accept"
                              disabled={friendActionLoading === user._id}
                              onClick={() => handleAcceptRequest(user._id)}
                            >
                              accept
                            </button>
                            <button
                              type="button"
                              className="request-btn"
                              disabled={friendActionLoading === user._id}
                              onClick={() => handleRejectRequest(user._id)}
                            >
                              reject
                            </button>
                          </div>
                        ))}
                        {outgoing.map((user) => (
                          <div key={`outgoing-${user._id}`} className="modal-user-item">
                          <div className="modal-user-avatar">
                            {user.profilePic ? (
                                <SmartImage srcPath={user.profilePic} alt={user.name || 'User'} className="avatar-img" fallback={(user.name?.charAt(0) || '?').toUpperCase()} />
                              ) : (
                                (user.name?.charAt(0) || '?').toUpperCase()
                              )}
                            </div>
                            <div className="modal-user-info">
                              <h4>{user.name || 'Unknown'}</h4>
                              <p>@{user.username || ''}</p>
                              <p className="modal-user-meta">Request sent</p>
                            </div>
                            <button
                              type="button"
                              className="request-btn request-btn--icon"
                              onClick={() => handleOpenProfilePreview(user._id)}
                              aria-label="View profile"
                              title="View profile"
                            >
                              <User size={14} />
                            </button>
                            <button type="button" className="request-btn" disabled>
                              requested
                            </button>
                          </div>
                        ))}
                      </>
                    );
                  })()
                )}

                {activeChatModalTab === 'discover' && (
                  !searchQuery.trim() ? (
                    <div className="no-users chat-modal-empty">Search by username or name to find new contacts.</div>
                  ) : filteredDiscoverUsers.length === 0 ? (
                    <div className="no-users chat-modal-empty">No people found for "{searchQuery}".</div>
                  ) : (
                    filteredDiscoverUsers.map((user) => {
                      const summary = getProfileSummary(user);
                      return (
                        <div key={user._id} className="modal-user-item">
                          <div className="modal-user-avatar">
                            {user.profilePic ? (
                              <SmartImage srcPath={user.profilePic} alt={user.name || 'User'} className="avatar-img" fallback={(user.name?.charAt(0) || '?').toUpperCase()} />
                            ) : (
                              (user.name?.charAt(0) || '?').toUpperCase()
                            )}
                          </div>
                          <div className="modal-user-info">
                            <h4>{highlightMatch(user.name || 'Unknown', searchQuery)}</h4>
                            <p>@{highlightMatch(user.username || '', searchQuery)}</p>
                            {summary && <p className="modal-user-meta">{summary}</p>}
                          </div>
                          <button
                            type="button"
                            className="request-btn request-btn--icon"
                            onClick={() => handleOpenProfilePreview(user._id)}
                            aria-label="View profile"
                            title="View profile"
                          >
                            <User size={14} />
                          </button>
                          {user.relationship === 'friend' && (
                            <button
                              type="button"
                              className="request-btn accept"
                              onClick={() => handleCreateChat(user._id)}
                            >
                              chat
                            </button>
                          )}
                          {user.relationship === 'requested' && (
                            <button type="button" className="request-btn" disabled>
                              requested
                            </button>
                          )}
                          {user.relationship === 'incoming' && (
                            <>
                              <button
                                type="button"
                                className="request-btn accept"
                                disabled={friendActionLoading === user._id}
                                onClick={() => handleAcceptRequest(user._id)}
                              >
                                accept
                              </button>
                              <button
                                type="button"
                                className="request-btn"
                                disabled={friendActionLoading === user._id}
                                onClick={() => handleRejectRequest(user._id)}
                              >
                                reject
                              </button>
                            </>
                          )}
                          {user.relationship === 'none' && (
                            <button
                              type="button"
                              className="request-btn accept"
                              disabled={friendActionLoading === user.username}
                              onClick={() => handleSendFriendRequest(user.username)}
                            >
                              add
                            </button>
                          )}
                        </div>
                      );
                    })
                  )
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
            <div className="modal-content chat-picker-modal chat-picker-modal--group" onClick={(e) => e.stopPropagation()}>
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
                        <SmartImage srcPath={user.profilePic} alt={user.name} className="avatar-img" fallback={user.name.charAt(0).toUpperCase()} />
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
            <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create Event</h3>
                <button
                  className="modal-icon-btn"
                  onClick={() => setShowEventModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateEvent} className="event-form">
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewEventDate(value);
                      if (!value) {
                        setNewEventEndDate('');
                        setEventDateError('');
                        return;
                      }
                      const selectedDate = new Date(value);
                      const defaultEndDate = new Date(selectedDate.getTime() + (60 * 60 * 1000));
                      const nextEndValue = newEventEndDate || getLocalDateTimeValue(defaultEndDate);
                      if (!newEventEndDate) {
                        setNewEventEndDate(nextEndValue);
                      }
                      setEventDateError(buildEventRangeError(value, nextEndValue));
                    }}
                    className="modal-input"
                    min={minDateTimeLocal}
                    required
                  />
                </div>
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="datetime-local"
                    value={newEventEndDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewEventEndDate(value);
                      setEventDateError(buildEventRangeError(newEventDate, value));
                    }}
                    className="modal-input"
                    min={newEventDate || minDateTimeLocal}
                    required
                  />
                </div>
                {(eventDateError || eventCreateError) && (
                  <div className="chat-action-error" style={{ marginTop: '10px' }}>
                    {eventDateError || eventCreateError}
                  </div>
                )}
                <div className="group-name-input" style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Cover image URL (optional)"
                    value={newEventCoverImage}
                    onChange={(e) => setNewEventCoverImage(e.target.value)}
                    className="modal-input"
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
                    accept={SUPPORTED_IMAGE_UPLOAD_ACCEPT}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) {
                        setNewUpdateImage(null);
                        return;
                      }

                      const imageError = getUploadImageError(file);
                      if (imageError) {
                        setNewUpdateImage(null);
                        e.target.value = '';
                        pushNotification({
                          type: 'update',
                          content: imageError
                        });
                        return;
                      }

                      setNewUpdateImage(file);
                    }}
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

      {(profilePreviewLoading || profilePreview || profilePreviewError) && (
        <div className="modal-overlay" onClick={handleCloseProfilePreview}>
          <div className="modal-content profile-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Profile</h3>
              <button
                type="button"
                className="modal-icon-btn"
                onClick={handleCloseProfilePreview}
              >
                <X size={20} />
              </button>
            </div>

            {profilePreviewLoading && (
              <div className="no-users">Loading profile...</div>
            )}

            {!profilePreviewLoading && profilePreviewError && (
              <div className="chat-action-error">{profilePreviewError}</div>
            )}

            {!profilePreviewLoading && profilePreview && (
              <div className="profile-preview-card">
                <div className="profile-preview-avatar">
                  {profilePreview.profilePic ? (
                    <SmartImage srcPath={profilePreview.profilePic} alt={profilePreview.name || 'User'} className="avatar-img" fallback={(profilePreview.name?.charAt(0) || '?').toUpperCase()} />
                  ) : (
                    (profilePreview.name?.charAt(0) || '?').toUpperCase()
                  )}
                </div>
                <h3>{profilePreview.name || 'Unknown User'}</h3>
                <p className="profile-preview-handle">@{profilePreview.username || 'unknown'}</p>
                {getRelationshipBadgeLabel(profilePreview.relationship) && (
                  <span className="profile-preview-pill">{getRelationshipBadgeLabel(profilePreview.relationship)}</span>
                )}
                {profilePreview.bio && (
                  <p className="profile-preview-bio">{profilePreview.bio}</p>
                )}
                <div className="profile-preview-grid">
                  {profilePreview.whoAmI && (
                    <div className="profile-preview-section">
                      <span className="profile-preview-label">Who am I</span>
                      <p>{profilePreview.whoAmI}</p>
                    </div>
                  )}
                  {profilePreview.education && (
                    <div className="profile-preview-section">
                      <span className="profile-preview-label">Education</span>
                      <p>{profilePreview.education}</p>
                    </div>
                  )}
                  {profilePreview.aboutInfo && (
                    <div className="profile-preview-section profile-preview-section--full">
                      <span className="profile-preview-label">About</span>
                      <p>{profilePreview.aboutInfo}</p>
                    </div>
                  )}
                  {!!profilePreview.friendsCount && (
                    <div className="profile-preview-section">
                      <span className="profile-preview-label">Contacts</span>
                      <p>{profilePreview.friendsCount}</p>
                    </div>
                  )}
                </div>
                {(profilePreview.interests || []).length > 0 && (
                  <div className="profile-preview-section profile-preview-section--full">
                    <span className="profile-preview-label">Interests</span>
                    <div className="profile-preview-tags">
                      {(profilePreview.interests || []).map((interest) => (
                        <span key={`${profilePreview.id}-${interest}`} className="profile-preview-tag">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {callState.status !== 'idle' && (
        <div className="call-overlay" role="dialog" aria-modal="true" aria-label="Video call">
          <div className="call-panel">
            <div className="call-panel-header">
              <div>
                <p className="call-panel-eyebrow">{getCallStatusLabel(callState.status)}</p>
                <h3>{activeCallName}</h3>
              </div>
              <button
                type="button"
                className="call-close-btn"
                onClick={callState.status === 'incoming' ? handleDeclineIncomingCall : handleEndCall}
                title={callState.status === 'incoming' ? 'Decline call' : 'End call'}
              >
                <PhoneOff size={16} />
              </button>
            </div>

            <div className="call-stage">
              <div className="call-remote-video-shell">
                <video
                  ref={remoteVideoRef}
                  className="call-remote-video"
                  autoPlay
                  playsInline
                />
                {!remoteStreamRef.current && (
                  <div className="call-video-placeholder">
                    <div className="call-avatar-fallback">
                      {activeCallName?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <p>{callState.status === 'incoming' ? 'Waiting for you to answer' : getCallStatusLabel(callState.status)}</p>
                  </div>
                )}
              </div>

              <div className="call-local-video-shell">
                <video
                  ref={localVideoRef}
                  className="call-local-video"
                  autoPlay
                  muted
                  playsInline
                />
                {(callState.isCameraOff || callState.isReceiveOnly) && (
                  <div className="call-local-video-off">
                    <VideoOff size={18} />
                    <span>{callState.isReceiveOnly ? 'Receive only' : 'Camera off'}</span>
                  </div>
                )}
              </div>
            </div>

            {callState.error && (
              <p className="call-error-text">{callState.error}</p>
            )}

            <div className="call-controls">
              {callState.status === 'incoming' ? (
                <>
                  <button type="button" className="call-control-btn call-control-btn--ghost" onClick={handleDeclineIncomingCall}>
                    <PhoneOff size={18} />
                    <span>Decline</span>
                  </button>
                  <button type="button" className="call-control-btn call-control-btn--accept" onClick={handleAcceptIncomingCall}>
                    <Phone size={18} />
                    <span>Accept</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`call-control-btn ${callState.isMuted ? 'call-control-btn--off' : ''}`}
                    onClick={handleToggleCallMute}
                    disabled={callState.isReceiveOnly}
                  >
                    {callState.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    <span>{callState.isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>
                  <button
                    type="button"
                    className={`call-control-btn ${callState.isCameraOff ? 'call-control-btn--off' : ''}`}
                    onClick={handleToggleCallCamera}
                    disabled={callState.isReceiveOnly}
                  >
                    {callState.isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                    <span>{callState.isCameraOff ? 'Camera on' : 'Camera off'}</span>
                  </button>
                  <button type="button" className="call-control-btn call-control-btn--danger" onClick={handleEndCall}>
                    <PhoneOff size={18} />
                    <span>End</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Cursor */}
      {cursorEnabled && (
        <div ref={cursorRef} className="custom-cursor" aria-hidden="true">
          <div className="cursor-dot" />
        </div>
      )}

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
          font-family: var(--font-sans, 'Plus Jakarta Sans', 'Segoe UI', sans-serif);
          display: flex;
          flex-direction: column;
          color: white;
          color-scheme: dark;
        }

        .home-page.custom-cursor-enabled,
        .home-page.custom-cursor-enabled * {
          cursor: none !important;
        }

        .home-page,
        .home-page .top-nav,
        .home-page .main-content,
        .home-page .section-content,
        .home-page .chat-item,
        .home-page .community-card,
        .home-page .event-card,
        .home-page .icon-btn,
        .home-page .profile-btn,
        .home-page .action-btn,
        .home-page .request-btn,
        .home-page .notification-panel,
        .home-page .notification-item,
        .home-page .member-panel,
        .home-page .settings-panel,
        .home-page .modal-content,
        .home-page .chat-window {
          transition:
            background 0.42s ease,
            background-color 0.42s ease,
            color 0.32s ease,
            box-shadow 0.42s ease,
            border-color 0.42s ease,
            transform 0.32s ease;
        }

        .home-page.theme-transitioning {
          position: relative;
          overflow: hidden;
        }

        .home-page.theme-transitioning::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1100;
          background:
            radial-gradient(circle at top center, rgba(96, 165, 250, 0.22), transparent 34%),
            linear-gradient(180deg, rgba(59, 130, 246, 0.1), transparent 42%);
          animation: themeWash 0.52s ease forwards;
        }

        @keyframes themeWash {
          0% {
            opacity: 0;
            transform: scale(0.985);
          }
          35% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: scale(1.01);
          }
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

        select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: rgba(255, 255, 255, 0.03);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 42px 10px 14px;
          border-radius: 12px;
          outline: none;
          font-family: inherit;
          min-height: 44px;
          line-height: 1.2;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
          background-image:
            linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.65) 50%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.65) 50%, transparent 50%),
            linear-gradient(to right, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08));
          background-position:
            calc(100% - 18px) calc(50% - 2px),
            calc(100% - 12px) calc(50% - 2px),
            calc(100% - 2.45rem) 50%;
          background-size: 6px 6px, 6px 6px, 1px 58%;
          background-repeat: no-repeat;
        }

        select:hover {
          border-color: rgba(255, 255, 255, 0.16);
          background-color: rgba(255, 255, 255, 0.05);
        }

        select:focus {
          border-color: rgba(56, 189, 248, 0.45);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
        }

        select option {
          background-color: #141414;
          color: white;
          font-family: inherit;
        }

        .home-page.theme-light select {
          background-color: rgba(15, 23, 42, 0.04);
          color: #0f172a;
          border-color: transparent;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
          background-image:
            linear-gradient(45deg, transparent 50%, rgba(15, 23, 42, 0.55) 50%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.55) 50%, transparent 50%),
            linear-gradient(to right, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.12));
        }

        .home-page.theme-light .search-input:focus,
        .home-page.theme-light .modal-input:focus,
        .home-page.theme-light .message-input:focus,
        .home-page.theme-light select:focus {
          border-color: transparent;
        }

        .home-page.theme-light select option {
          background-color: #ffffff;
          color: #0f172a;
        }

        .home-page.theme-light {
          background:
            radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 24%),
            radial-gradient(circle at top right, rgba(45, 212, 191, 0.1), transparent 20%),
            linear-gradient(180deg, #f7faff 0%, #eef4ff 48%, #f4f7fb 100%);
          color: #10203a;
          color-scheme: light;
        }

        .home-page.theme-light .top-nav {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(244, 248, 255, 0.94));
          border-bottom: none;
          box-shadow: 0 12px 34px rgba(37, 99, 235, 0.08);
        }

        .home-page.theme-light .nav-center {
          background: linear-gradient(180deg, rgba(219, 234, 254, 0.72), rgba(255, 255, 255, 0.9));
          border-color: transparent;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            0 8px 20px rgba(37, 99, 235, 0.06);
        }

        .home-page.theme-light .main-content {
          background: transparent;
        }

        .home-page.theme-light .app-logo,
        .home-page.theme-light .nav-tab,
        .home-page.theme-light .mobile-nav-item,
        .home-page.theme-light .profile-btn span,
        .home-page.theme-light .section-header h2,
        .home-page.theme-light .chat-info h3,
        .home-page.theme-light .message-content p,
        .home-page.theme-light .modal-user-info h4,
        .home-page.theme-light .community-card h3,
        .home-page.theme-light .update-card h3,
        .home-page.theme-light .event-title,
        .home-page.theme-light .ai-welcome h3,
        .home-page.theme-light .preference-title,
        .home-page.theme-light .detail-header h2,
        .home-page.theme-light .group-header h2 {
          color: #10203a;
        }

        .home-page.theme-light .app-logo {
          background: linear-gradient(135deg, #0f172a 0%, #2563eb 85%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-page.theme-light .nav-tab {
          color: rgba(25, 45, 86, 0.76);
        }

        .home-page.theme-light .nav-tab::before {
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.16), rgba(255, 255, 255, 0.3));
        }

        .home-page.theme-light .nav-tab:hover {
          color: #15305f;
        }

        .home-page.theme-light .section-content {
          background: transparent;
          box-shadow: none;
          border-color: transparent;
          color: #10203a;
        }

        .home-page.theme-light .chat-window,
        .home-page.theme-light .modal-content,
        .home-page.theme-light .settings-panel {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(247, 250, 255, 0.94));
          color: #10203a;
          border-color: transparent;
          box-shadow:
            0 18px 46px rgba(37, 99, 235, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .home-page.theme-light .community-card {
          border-color: transparent;
          border-radius: 28px;
          box-shadow:
            0 16px 32px rgba(37, 99, 235, 0.07),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        .home-page.theme-light .community-card--community {
          background: linear-gradient(155deg, rgba(251, 191, 36, 0.16), rgba(255, 255, 255, 0.95) 42%, rgba(239, 246, 255, 0.96));
        }

        .home-page.theme-light .community-card--group {
          background: linear-gradient(155deg, rgba(59, 130, 246, 0.16), rgba(255, 255, 255, 0.95) 42%, rgba(236, 253, 245, 0.92));
        }

        .home-page.theme-light .detail-header {
          border-color: transparent;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
        }

        .home-page.theme-light .detail-header--community {
          background: linear-gradient(145deg, rgba(251, 191, 36, 0.16), rgba(255, 255, 255, 0.95) 46%, rgba(239, 246, 255, 0.96));
        }

        .home-page.theme-light .detail-header--group {
          background: linear-gradient(145deg, rgba(96, 165, 250, 0.16), rgba(255, 255, 255, 0.95) 46%, rgba(236, 253, 245, 0.94));
        }

        .home-page.theme-light .search-input,
        .home-page.theme-light .modal-input,
        .home-page.theme-light .aichat-input-container input,
        .home-page.theme-light .message-input,
        .home-page.theme-light .modal-search,
        .home-page.theme-light .ai-translate-bar,
        .home-page.theme-light .ai-language-select,
        .home-page.theme-light .custom-lang-select-trigger {
          background: linear-gradient(180deg, rgba(239, 246, 255, 0.92), rgba(255, 255, 255, 0.88));
          color: #10203a !important;
          border-color: transparent;
          box-shadow:
            inset 0 0 0 1px rgba(59, 130, 246, 0.06),
            0 1px 0 rgba(255, 255, 255, 0.85);
        }

        .home-page.theme-light .custom-lang-options-list {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(245, 249, 255, 0.98));
          border-color: transparent;
          box-shadow: 0 18px 36px rgba(37, 99, 235, 0.12);
        }

        .home-page.theme-light .custom-lang-option {
          color: rgba(15, 23, 42, 0.78);
        }

        .home-page.theme-light .custom-lang-option:hover {
          background: rgba(15, 23, 42, 0.06);
          color: #0f172a;
        }

        .home-page.theme-light .custom-lang-option.selected {
          background: rgba(56, 189, 248, 0.14);
          color: #0284c7;
        }

        .home-page.theme-light .modal-search-input {
          color: #0f172a;
        }

        .home-page.theme-light .mobile-nav-menu {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 248, 255, 0.96));
          border-top: none;
          box-shadow: 0 18px 36px rgba(37, 99, 235, 0.1);
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
          background: linear-gradient(180deg, rgba(236, 244, 255, 0.95), rgba(248, 250, 255, 0.96));
          color: #10203a;
          border-color: transparent;
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.05);
        }

        .home-page.theme-light .chat-list,
        .home-page.theme-light .events-list {
          gap: 10px;
        }

        .home-page.theme-light .chat-item {
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(240, 247, 255, 0.88));
          box-shadow:
            0 10px 24px rgba(37, 99, 235, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .home-page.theme-light .icon-btn,
        .home-page.theme-light .profile-btn,
        .home-page.theme-light .modal-icon-btn,
        .home-page.theme-light .action-btn,
        .home-page.theme-light .request-btn,
        .home-page.theme-light .request-btn.ghost,
        .home-page.theme-light .member-actions button {
          color: #16315f;
          border-color: transparent;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(236, 244, 255, 0.96));
          box-shadow:
            0 8px 18px rgba(37, 99, 235, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }

        .home-page.theme-light .nav-tab.active {
          color: #ffffff;
          background: linear-gradient(135deg, #60a5fa, #2563eb);
          box-shadow:
            0 10px 24px rgba(37, 99, 235, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.24);
        }

        .home-page.theme-light .action-btn {
          background: linear-gradient(135deg, rgba(191, 219, 254, 0.72), rgba(255, 255, 255, 0.96));
          color: #16315f;
        }

        .home-page.theme-light .icon-btn:hover,
        .home-page.theme-light .modal-icon-btn:hover,
        .home-page.theme-light .profile-btn:hover,
        .home-page.theme-light .action-btn:hover,
        .home-page.theme-light .request-btn:hover,
        .home-page.theme-light .request-btn.ghost:hover,
        .home-page.theme-light .member-actions button:hover {
          background: linear-gradient(135deg, rgba(219, 234, 254, 0.95), rgba(255, 255, 255, 0.98));
          color: #10203a;
        }

        .home-page.theme-light .chat-item:hover,
        .home-page.theme-light .modal-user-item:hover {
          background: linear-gradient(90deg, rgba(219, 234, 254, 0.55), rgba(255, 255, 255, 0.78));
          border-color: transparent;
        }

        .home-page.theme-light .event-card,
        .home-page.theme-light .modal-user-item,
        .home-page.theme-light .member-panel,
        .home-page.theme-light .settings-panel,
        .home-page.theme-light .community-groups-panel,
        .home-page.theme-light .pinned-panel,
        .home-page.theme-light .scheduled-item,
        .home-page.theme-light .updates-filter,
        .home-page.theme-light .message-search-results {
          border-color: transparent;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(239, 246, 255, 0.88));
          box-shadow:
            0 10px 24px rgba(37, 99, 235, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .home-page.theme-light .event-card {
          border-radius: 20px;
        }

        .home-page.theme-light .modal-user-item {
          border-radius: 18px;
        }

        .home-page.theme-light .member-panel,
        .home-page.theme-light .settings-panel,
        .home-page.theme-light .community-groups-panel {
          border-radius: 22px;
        }

        .home-page.theme-light .pinned-panel,
        .home-page.theme-light .scheduled-item,
        .home-page.theme-light .message-search-results {
          border-radius: 18px;
        }

        .home-page.theme-light .updates-filter {
          border-radius: 16px;
        }

        .home-page.theme-light .member-row,
        .home-page.theme-light .settings-row {
          padding: 14px 2px;
          border-bottom-color: rgba(59, 130, 246, 0.08);
        }

        .home-page.theme-light .join-btn,
        .home-page.theme-light .map-btn,
        .home-page.theme-light .event-join-btn {
          border-color: transparent;
          border-radius: 18px;
          box-shadow:
            0 10px 22px rgba(37, 99, 235, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .home-page.theme-light .chat-time,
        .home-page.theme-light .chat-message,
        .home-page.theme-light .modal-user-info p,
        .home-page.theme-light .ai-subtitle,
        .home-page.theme-light .onboarding-subtitle,
        .home-page.theme-light .community-category,
        .home-page.theme-light .community-members,
        .home-page.theme-light .update-info,
        .home-page.theme-light .update-content,
        .home-page.theme-light .event-info span,
        .home-page.theme-light .preference-subtitle,
        .home-page.theme-light .group-category,
        .home-page.theme-light .group-members,
        .home-page.theme-light p {
          color: rgba(39, 60, 102, 0.64);
        }

        .home-page.theme-light .community-card-description,
        .home-page.theme-light .community-status,
        .home-page.theme-light .detail-meta,
        .home-page.theme-light .detail-description,
        .home-page.theme-light .member-handle,
        .home-page.theme-light .updates-filter-label {
          color: rgba(39, 60, 102, 0.68);
        }

        .home-page.theme-light .detail-eyebrow {
          background: linear-gradient(135deg, rgba(219, 234, 254, 0.9), rgba(255, 255, 255, 0.94));
          border-color: transparent;
          color: #28509b;
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.08);
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
          font-family: var(--font-sans, 'Plus Jakarta Sans', sans-serif);
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
          cursor: pointer;
          width: 48px;
          height: 48px;
          padding: 0;
          border-radius: 50%;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: none;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .profile-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.26), transparent 58%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .profile-btn svg {
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease;
        }

        .profile-btn-avatar {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        .profile-btn-fallback {
          position: relative;
          z-index: 1;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .profile-btn:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 
            0 6px 24px rgba(255, 255, 255, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .profile-btn:hover::before {
          opacity: 1;
        }

        .profile-btn:hover svg {
          transform: scale(1.08) rotate(-8deg);
        }

        .profile-btn:hover .profile-btn-avatar,
        .profile-btn:hover .profile-btn-fallback {
          transform: scale(1.06);
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

        .page-loading-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(4, 6, 10, 0.72);
          backdrop-filter: blur(14px);
        }

        .page-loading-card {
          display: grid;
          gap: 14px;
          min-width: 240px;
          padding: 28px 30px;
          border-radius: 24px;
          background: rgba(17, 24, 39, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38);
          justify-items: center;
          text-align: center;
          color: rgba(255, 255, 255, 0.88);
        }

        .page-loading-spinner {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.16);
          border-top-color: #38bdf8;
          animation: spinLoader 0.85s linear infinite;
        }

        .page-loading-spinner--small {
          width: 18px;
          height: 18px;
          border-width: 2px;
        }

        .page-inline-loader {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.78);
        }

        @keyframes spinLoader {
          to {
            transform: rotate(360deg);
          }
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
          font-family: var(--font-display, 'Syne', sans-serif);
          font-size: 1.9rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.05em;
          text-transform: none;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          padding: 11px 22px;
          border-radius: 999px;
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
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 18px;
        }

        .community-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 240px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 22px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;
        }

        .community-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.12), transparent 42%);
          opacity: 0.8;
          pointer-events: none;
        }

        .community-card--community {
          background: linear-gradient(160deg, rgba(249, 115, 22, 0.14), rgba(255, 255, 255, 0.04) 42%, rgba(255, 255, 255, 0.02));
        }

        .community-card--group {
          background: linear-gradient(160deg, rgba(45, 212, 191, 0.14), rgba(255, 255, 255, 0.04) 42%, rgba(255, 255, 255, 0.02));
        }

        .community-card--nested {
          min-height: 220px;
        }

        .community-card:hover {
          border-color: rgba(255, 255, 255, 0.18);
          transform: translateY(-6px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.38);
        }

        .community-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 0;
        }

        .community-avatar-large {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          font-weight: 700;
          color: white;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24);
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

        .community-card-copy {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .community-card-pill,
        .active-badge {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.76);
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 6px 10px;
          border-radius: 999px;
          position: relative;
          z-index: 1;
        }

        .community-card--community .community-card-pill {
          background: rgba(249, 115, 22, 0.15);
          border-color: rgba(249, 115, 22, 0.3);
          color: #fdba74;
        }

        .community-card--group .community-card-pill {
          background: rgba(45, 212, 191, 0.15);
          border-color: rgba(45, 212, 191, 0.28);
          color: #8ef2e4;
        }

        .community-card h3 {
          font-family: var(--font-display, 'Syne', sans-serif);
          font-size: 1.18rem;
          font-weight: 800;
          color: white;
          margin: 0;
          line-height: 1.05;
          letter-spacing: -0.04em;
          text-transform: none;
        }

        .community-card-description,
        .community-category {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.68);
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .community-members {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.66);
          margin: 0;
          font-weight: 600;
        }

        .community-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: auto;
          position: relative;
          z-index: 1;
        }

        .community-status {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
        }

        .join-btn {
          margin-top: auto;
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          min-height: 46px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          padding: 12px 16px;
          border-radius: 14px;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .join-btn--community {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.22), rgba(255, 255, 255, 0.08));
          border-color: rgba(249, 115, 22, 0.3);
        }

        .join-btn--group {
          background: linear-gradient(135deg, rgba(45, 212, 191, 0.22), rgba(255, 255, 255, 0.08));
          border-color: rgba(45, 212, 191, 0.28);
        }

        .join-btn--muted {
          padding-inline: 18px;
          color: rgba(255, 255, 255, 0.72) !important;
          border-color: rgba(255, 255, 255, 0.16);
        }

        .detail-header .join-btn--muted {
          width: auto;
        }

        .join-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
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
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .updates-filter-select {
          background: transparent;
          border: none;
          color: white;
          font-size: 0.8rem;
          outline: none;
          text-transform: lowercase;
          min-height: 34px;
          padding: 4px 30px 4px 8px;
          border-radius: 8px;
          background-position:
            calc(100% - 14px) calc(50% - 1px),
            calc(100% - 9px) calc(50% - 1px),
            calc(100% - 1.9rem) 50%;
          background-size: 5px 5px, 5px 5px, 1px 52%;
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
          overflow: hidden;
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
          overflow: hidden;
          isolation: isolate;
        }

        .story-content img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
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

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, #161616, #262626);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 700;
          color: white;
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

        .event-join-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Custom Cursor */
        .custom-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          border: 2px solid rgba(255, 255, 255, 0.72);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          transform: translate3d(-120px, -120px, 0);
          opacity: 0;
          background: rgba(255, 255, 255, 0.03);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04),
            0 8px 24px rgba(0, 0, 0, 0.24);
          backdrop-filter: blur(2px);
          will-change: transform, width, height, opacity;
          transition:
            opacity 0.18s ease,
            border-color 0.2s ease,
            background-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .custom-cursor.is-pressed {
          border-color: rgba(56, 189, 248, 0.92);
          background: rgba(56, 189, 248, 0.08);
          box-shadow:
            0 0 0 1px rgba(56, 189, 248, 0.14),
            0 10px 28px rgba(37, 99, 235, 0.18);
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
          transition: transform 0.18s ease, background-color 0.18s ease;
        }

        .custom-cursor.is-pressed .cursor-dot {
          transform: translate(-50%, -50%) scale(0.8);
          background: #7dd3fc;
        }

        @media (pointer: coarse), (prefers-reduced-motion: reduce) {
          .custom-cursor {
            display: none !important;
          }

          .home-page,
          .home-page * {
            cursor: auto !important;
          }
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
          font-family: var(--font-display, 'Syne', sans-serif);
          font-size: 1.12rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.03em;
          text-transform: none;
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
          z-index: 1150;
          padding: 12px;
        }

        .home-page.theme-dark .notification-panel {
          background:
            linear-gradient(180deg, rgba(8, 13, 24, 0.96), rgba(10, 14, 28, 0.94)),
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 42%);
          border-color: rgba(96, 165, 250, 0.2);
          box-shadow:
            0 18px 40px rgba(2, 6, 23, 0.56),
            inset 0 1px 0 rgba(147, 197, 253, 0.08);
          backdrop-filter: blur(24px) saturate(150%);
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          margin-bottom: 8px;
        }

        .home-page.theme-dark .notification-header {
          color: rgba(219, 234, 254, 0.92);
        }

        .notification-list {
          max-height: 240px;
          overflow-y: auto;
        }

        .notification-item {
          width: 100%;
          border: none;
          text-align: left;
          font: inherit;
          padding: 8px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          margin-bottom: 6px;
          cursor: pointer;
        }

        .notification-item--interactive:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.08);
        }

        .home-page.theme-dark .notification-item {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.7));
          border: 1px solid rgba(96, 165, 250, 0.1);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .notification-title {
          font-weight: 600;
          font-size: 0.75rem;
          margin-bottom: 4px;
        }

        .home-page.theme-dark .notification-title {
          color: #dbeafe;
        }

        .notification-body {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .home-page.theme-dark .notification-body {
          color: rgba(191, 219, 254, 0.8);
          opacity: 1;
        }

        .notification-clear {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
        }

        .home-page.theme-dark .notification-clear {
          color: rgba(147, 197, 253, 0.82);
        }

        .home-page.theme-dark .notification-clear:hover {
          color: #eff6ff;
        }

        .detail-header {
          position: relative;
          overflow: hidden;
          background: linear-gradient(150deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 30px;
          border-radius: 24px;
          margin-bottom: 30px;
        }

        .detail-header::after {
          content: '';
          position: absolute;
          right: -64px;
          bottom: -86px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.08), transparent 68%);
          pointer-events: none;
        }

        .detail-header--community {
          background: linear-gradient(145deg, rgba(249, 115, 22, 0.15), rgba(255, 255, 255, 0.04) 42%, rgba(255, 255, 255, 0.02));
        }

        .detail-header--group {
          background: linear-gradient(145deg, rgba(45, 212, 191, 0.15), rgba(255, 255, 255, 0.04) 42%, rgba(255, 255, 255, 0.02));
        }

        .detail-header-hero {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 18px;
          position: relative;
          z-index: 1;
        }

        .detail-header-copy {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .detail-eyebrow {
          align-self: flex-start;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.78);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .detail-header h2 {
          font-family: var(--font-display, 'Syne', sans-serif);
          font-size: clamp(1.9rem, 2.6vw, 2.7rem);
          font-weight: 800;
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-transform: none;
        }

        .detail-meta {
          color: rgba(255, 255, 255, 0.64);
          font-size: 0.95rem;
          font-weight: 600;
        }

        .detail-description {
          max-width: 720px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.7;
          position: relative;
          z-index: 1;
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
          padding: 9px 14px;
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .detail-tab.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: white;
          box-shadow: 0 8px 18px rgba(59, 130, 246, 0.18);
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
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .member-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .member-name {
          font-weight: 600;
          color: white;
        }

        .member-handle {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .member-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .member-actions button {
          margin-left: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          border-radius: 999px;
          min-width: 36px;
          min-height: 36px;
          padding: 4px 10px;
          font-size: 0.7rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
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
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          margin-bottom: 20px;
        }

        .invite-join input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 14px;
          padding: 12px 14px;
        }

        .create-group-inline {
          display: grid;
          gap: 10px;
          margin: 16px 0;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .member-add {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 16px;
        }

        .member-helper-text {
          margin-bottom: 14px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 0.82rem;
          line-height: 1.5;
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
          font-family: var(--font-display, 'Syne', sans-serif);
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          text-transform: none;
          letter-spacing: -0.04em;
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
          max-height: min(88vh, 760px);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
          overflow: hidden;
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
          font-family: var(--font-display, 'Syne', sans-serif);
          font-size: 1.35rem;
          font-weight: 800;
          color: white;
          text-transform: none;
          letter-spacing: -0.04em;
        }

        .modal-subtitle {
          margin-top: 6px;
          color: rgba(226, 232, 240, 0.68);
          font-size: 0.86rem;
          line-height: 1.5;
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
          overflow-x: auto;
        }

        .chat-modal-tab {
          min-height: 38px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          white-space: nowrap;
          text-transform: lowercase;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .chat-modal-tab:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.22);
          color: white;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .request-btn--icon {
          width: 38px;
          min-width: 38px;
          height: 38px;
          padding: 0;
          border-radius: 12px;
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

        .chat-picker-modal {
          max-width: 470px;
          min-height: 320px;
          max-height: min(82vh, 640px);
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(18, 18, 22, 0.98), rgba(10, 10, 12, 0.98));
          box-shadow:
            0 28px 80px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .chat-picker-modal .modal-header {
          padding: 22px 22px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .chat-picker-modal .modal-header h3 {
          font-size: 1.9rem;
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .chat-picker-modal .modal-actions {
          gap: 10px;
        }

        .chat-picker-modal .modal-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.09);
        }

        .chat-picker-modal .chat-modal-tabs {
          padding: 14px 20px 10px;
          border-bottom: none;
          gap: 10px;
        }

        .chat-picker-modal .modal-search {
          margin: 0 20px 12px;
          padding: 0 14px;
          min-height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }

        .chat-picker-modal .modal-search:focus-within {
          border-color: rgba(59, 130, 246, 0.45);
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .chat-picker-modal .modal-search-input {
          min-width: 0;
          font-size: 0.95rem;
        }

        .chat-picker-modal .chat-action-error {
          margin: 0 20px 12px;
        }

        .chat-picker-modal .group-name-input {
          padding: 0 20px 12px;
          border-bottom: none;
        }

        .chat-picker-modal .selected-users-count {
          margin: 0 20px 10px;
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          color: rgba(255, 255, 255, 0.68);
        }

        .chat-picker-modal .modal-users-list {
          margin: 0 12px 12px;
          padding: 8px;
          min-height: 180px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .chat-picker-modal .modal-user-item {
          border-radius: 16px;
        }

        .chat-picker-modal .modal-user-item + .modal-user-item {
          margin-top: 6px;
        }

        .chat-picker-modal .create-group-btn {
          margin: 0 20px 20px;
          width: calc(100% - 40px);
        }

        .chat-modal-empty {
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 16px;
          border: 1px dashed rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.018);
          color: rgba(255, 255, 255, 0.52);
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
          overflow: hidden;
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
          font-size: 0.98rem;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
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

        .modal-user-meta {
          margin-top: 4px;
          white-space: normal;
          line-height: 1.4;
        }

        .profile-preview-modal {
          max-width: 560px;
          max-height: min(84vh, 720px);
        }

        .profile-preview-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          padding: 12px 22px 22px;
          overflow-y: auto;
        }

        .profile-preview-avatar {
          width: 92px;
          height: 92px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 2px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          overflow: hidden;
        }

        .profile-preview-handle {
          color: rgba(255, 255, 255, 0.6);
          margin-top: -6px;
        }

        .profile-preview-pill {
          border-radius: 999px;
          padding: 6px 12px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #7dd3fc;
          font-size: 0.78rem;
          text-transform: capitalize;
        }

        .profile-preview-bio {
          max-width: 420px;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.6;
        }

        .profile-preview-grid {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 6px;
        }

        .profile-preview-section {
          text-align: left;
          min-width: 0;
          padding: 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }

        .profile-preview-section--full {
          grid-column: 1 / -1;
        }

        .profile-preview-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.45);
        }

        .profile-preview-section p {
          color: rgba(255, 255, 255, 0.88);
          line-height: 1.5;
          word-break: break-word;
        }

        .profile-preview-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-start;
          margin-top: 2px;
        }

        .profile-preview-tag {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.78);
          font-size: 0.78rem;
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
          width: 100%;
          min-width: 0;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .event-modal {
          max-width: 580px;
          max-height: min(88vh, 760px);
        }

        .event-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 20px 24px 24px;
          overflow-y: auto;
        }

        .event-form .group-name-input {
          padding: 0;
          border-bottom: none;
        }

        .event-form .chat-action-error {
          margin: 0;
        }

        .event-form .create-group-btn {
          margin-top: 8px;
        }

        .modal-input {
          box-sizing: border-box;
          max-width: 100%;
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

        textarea.modal-input {
          min-height: 112px;
          resize: vertical;
        }

        input[type="file"].modal-input {
          padding: 12px 14px;
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
          margin-top: 16px;
          box-sizing: border-box;
          max-width: 100%;
          width: 100%;
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

        .schedule-actions .create-group-btn,
        .member-add .create-group-btn,
        .settings-row .create-group-btn {
          width: auto;
          margin: 0;
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
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
          font-family: var(--font-display, 'Syne', sans-serif);
          font-size: 1.12rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.03em;
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
          display: flex;
          align-items: center;
          margin-left: 4px;
          font-size: 0;
          line-height: 1;
        }

        .message-status::before {
          content: '\\2713';
          font-size: 0.7rem;
        }

        .status-delivered::before,
        .status-read::before {
          content: '\\2713\\2713';
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
          display: grid;
          gap: 4px;
          background: rgba(20, 20, 25, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 8px;
          max-height: 240px;
          overflow-y: auto;
          overflow-x: hidden;
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
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          max-width: 100%;
          width: 100%;
        }

        .aichat-messages .message-content p {
          margin: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          max-width: 100%;
          width: 100%;
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

        .chat-action-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .call-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(2, 6, 23, 0.78);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .call-panel {
          width: min(100%, 960px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background:
            radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 42%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(3, 7, 18, 0.96));
          box-shadow: 0 32px 80px rgba(2, 6, 23, 0.6);
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .call-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .call-panel-header h3 {
          font-size: 1.5rem;
          font-family: var(--font-display, 'Syne', sans-serif);
          color: white;
          letter-spacing: -0.03em;
        }

        .call-panel-eyebrow {
          margin-bottom: 6px;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(148, 163, 184, 0.8);
        }

        .call-close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .call-stage {
          position: relative;
          min-height: 420px;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .call-remote-video-shell {
          position: relative;
          min-height: 420px;
          height: 100%;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.88));
        }

        .call-remote-video,
        .call-local-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: rgba(15, 23, 42, 0.92);
        }

        .call-video-placeholder,
        .call-local-video-off {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: rgba(226, 232, 240, 0.92);
          text-align: center;
          padding: 24px;
        }

        .call-avatar-fallback {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(14, 165, 233, 0.5));
          border: 1px solid rgba(125, 211, 252, 0.42);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
        }

        .call-local-video-shell {
          position: absolute;
          right: 18px;
          bottom: 18px;
          width: min(240px, 34%);
          aspect-ratio: 4 / 3;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 16px 36px rgba(2, 6, 23, 0.48);
          background: rgba(15, 23, 42, 0.95);
        }

        .call-local-video-off {
          background: rgba(15, 23, 42, 0.86);
          font-size: 0.82rem;
        }

        .call-error-text {
          color: #fca5a5;
          font-size: 0.88rem;
          margin-top: -4px;
        }

        .call-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .call-control-btn {
          min-width: 128px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border-radius: 16px;
          padding: 12px 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .call-control-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.12);
        }

        .call-control-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }

        .call-control-btn--accept {
          background: rgba(34, 197, 94, 0.18);
          border-color: rgba(74, 222, 128, 0.42);
          color: #bbf7d0;
        }

        .call-control-btn--ghost,
        .call-control-btn--danger,
        .call-control-btn--off {
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(248, 113, 113, 0.36);
          color: #fecaca;
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
          font-size: 0;
          cursor: pointer;
        }

        .message-react-btn::before {
          content: '\\1F642';
          font-size: 0.9rem;
          line-height: 1;
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
          overflow-y: auto;
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
          width: 100%;
          min-width: 0;
          margin-bottom: 0;
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

        .settings-form {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
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

        .home-page,
        .home-page * {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.46) transparent;
        }

        .home-page *::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .home-page *::-webkit-scrollbar-track {
          background: transparent;
        }

        .home-page *::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.46);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .home-page *::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.62);
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        @media (max-width: 980px) {
          .settings-page-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .call-overlay {
            padding: 14px;
          }

          .call-panel {
            padding: 16px;
            border-radius: 20px;
          }

          .call-stage,
          .call-remote-video-shell {
            min-height: 300px;
          }

          .call-local-video-shell {
            width: 110px;
            right: 12px;
            bottom: 12px;
            border-radius: 14px;
          }

          .call-control-btn {
            flex: 1 1 100%;
            min-width: 0;
          }

          .chat-picker-modal {
            max-width: 100%;
            min-height: 0;
            max-height: min(86vh, 620px);
          }

          .chat-picker-modal .modal-header {
            padding: 20px 18px 14px;
          }

          .chat-picker-modal .modal-header h3 {
            font-size: 1.55rem;
          }

          .chat-picker-modal .chat-modal-tabs,
          .chat-picker-modal .group-name-input {
            padding-left: 18px;
            padding-right: 18px;
          }

          .chat-picker-modal .modal-search,
          .chat-picker-modal .chat-action-error,
          .chat-picker-modal .selected-users-count {
            margin-left: 18px;
            margin-right: 18px;
          }

          .chat-picker-modal .create-group-btn {
            width: calc(100% - 36px);
            margin: 0 18px 18px;
          }

          .event-form {
            padding: 18px 18px 20px;
          }

          .profile-preview-grid {
            grid-template-columns: 1fr;
          }

          .detail-header {
            padding: 24px 20px;
          }

          .detail-header-hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .invite-join,
          .member-add {
            grid-template-columns: 1fr;
          }

          .create-group-inline {
            grid-template-columns: 1fr;
          }

          .communities-grid {
            grid-template-columns: 1fr;
          }

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





