import express from 'express';
import axios from 'axios';
import protect from '../middleware/auth-middleware.js';
import Chat from '../models/chat-model.js';
import Message from '../models/message-model.js';

const router = express.Router();

const getGeminiConfig = () => ({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
});

const pickPreferredModel = (modelIds = []) => {
    const preferredOrder = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-2.5-pro',
        'gemini-2.0-pro'
    ];

    for (const preferred of preferredOrder) {
        if (modelIds.includes(preferred)) return preferred;
    }
    return modelIds[0] || null;
};

const resolveModelForGenerateContent = async ({ apiKey, configuredModel }) => {
    const modelEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(configuredModel)}?key=${apiKey}`;

    try {
        const modelRes = await axios.get(modelEndpoint);
        const methods = modelRes.data?.supportedGenerationMethods || [];
        if (methods.includes('generateContent')) {
            return configuredModel;
        }
    } catch (error) {
        if (error.response?.status !== 404) {
            throw error;
        }
    }

    const listEndpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await axios.get(listEndpoint);
    const available = (listRes.data?.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => (m.name || '').replace(/^models\//, ''))
        .filter(Boolean);

    const fallback = pickPreferredModel(available);
    if (!fallback) {
        throw new Error('No Gemini models with generateContent support are currently available.');
    }
    return fallback;
};

const MAX_CHATS = 5;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 400;
const SUPPORTED_INDIAN_LANGUAGES = [
    'Hindi',
    'Gujarati',
    'Bengali',
    'Marathi',
    'Tamil',
    'Telugu',
    'Kannada',
    'Malayalam',
    'Punjabi',
    'Urdu',
    'Odia',
    'Assamese',
    'Konkani',
    'Maithili',
    'Sanskrit'
];

const normalizeLanguage = (language) => {
    if (!language || typeof language !== 'string') {
        return 'Hindi';
    }
    const trimmed = language.trim().toLowerCase();
    const match = SUPPORTED_INDIAN_LANGUAGES.find((lang) => lang.toLowerCase() === trimmed);
    return match || language.trim();
};

const buildChatContext = async (userId) => {
    const chats = await Chat.find({ participants: userId })
        .sort({ updatedAt: -1 })
        .limit(MAX_CHATS)
        .populate('participants', 'name');

    const chatIds = chats.map(chat => chat._id);
    if (chatIds.length === 0) {
        return '';
    }

    const messages = await Message.find({ chat: { $in: chatIds } })
        .sort({ createdAt: -1 })
        .limit(MAX_MESSAGES)
        .populate('sender', 'name')
        .populate('chat', 'isGroup name participants');

    const messagesByChat = new Map();
    for (const msg of messages) {
        const chatId = msg.chat?._id?.toString();
        if (!chatId) continue;
        if (!messagesByChat.has(chatId)) {
            messagesByChat.set(chatId, []);
        }
        messagesByChat.get(chatId).push(msg);
    }

    const contextBlocks = [];
    for (const chat of chats) {
        const chatId = chat._id.toString();
        const chatMessages = messagesByChat.get(chatId) || [];
        if (chatMessages.length === 0) continue;

        const chatTitle = chat.isGroup
            ? chat.name
            : (chat.participants.find(p => p._id.toString() !== userId.toString())?.name || 'Direct Chat');

        const orderedMessages = chatMessages.reverse().slice(-5);
        const messageLines = orderedMessages.map((msg) => {
            const senderName = msg.sender?.name || 'Unknown';
            const trimmedContent = (msg.content || '').slice(0, MAX_MESSAGE_LENGTH);
            return `- ${senderName}: ${trimmedContent}`;
        });

        contextBlocks.push(`Chat: ${chatTitle}\n${messageLines.join('\n')}`);
    }

    return contextBlocks.join('\n\n');
};

const buildPrompt = ({ message, mode, targetLanguage, chatContext }) => {
    const systemText = [
        "You are Cohort AI, a helpful assistant inside a private chat app.",
        "Use provided chat context only when relevant to the user's request.",
        "Never claim you accessed chats unless chat context is included.",
        "Keep responses concise and practical.",
    ].join(' ');

    let userRequest = message;
    if (mode === 'translate') {
        const language = normalizeLanguage(targetLanguage);
        userRequest = [
            `Translate the following text to ${language}.`,
            "Preserve names, emojis, and formatting as-is.",
            "Keep the tone natural for native speakers.",
            "Return only the translation.",
            "",
            "Text:",
            message
        ].join('\n');
    }

    if (!chatContext) {
        return `${systemText}\n\nUser request:\n${userRequest}`;
    }

    return [
        systemText,
        "Recent chat context:",
        chatContext,
        "User request:",
        userRequest
    ].join('\n\n');
};

// AI Chat Endpoint
router.post('/chat', protect, async (req, res) => {
    try {
        const { message, includeChats = false, mode = 'chat', targetLanguage } = req.body;
        const { apiKey: geminiApiKey, model: geminiModel } = getGeminiConfig();

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: 'Message is required.' });
        }

        if (!['chat', 'translate'].includes(mode)) {
            return res.status(400).json({ message: 'Invalid mode. Use chat or translate.' });
        }

        if (!geminiApiKey) {
            return res.status(503).json({ message: 'AI is not configured. Missing GEMINI_API_KEY.' });
        }

        const resolvedModel = await resolveModelForGenerateContent({
            apiKey: geminiApiKey,
            configuredModel: geminiModel
        });

        const chatContext = includeChats ? await buildChatContext(req.user._id) : '';
        const prompt = buildPrompt({ message, mode, targetLanguage, chatContext });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent?key=${geminiApiKey}`;
        const response = await axios.post(url, {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 1024
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const replyParts = response.data?.candidates?.[0]?.content?.parts || [];
        const reply = replyParts.map(part => part.text || '').join('').trim() || 'Sorry, I could not generate a response.';

        res.json({
            reply,
            mode,
            model: resolvedModel,
            targetLanguage: mode === 'translate' ? normalizeLanguage(targetLanguage) : null,
            usedChatContext: Boolean(chatContext)
        });

    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message || 'Server error';
        res.status(status).json({ message: 'AI request failed', error: message });
    }
});

export default router;
