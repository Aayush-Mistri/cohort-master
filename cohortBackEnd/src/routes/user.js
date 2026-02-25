import express from 'express';
import protect from '../middleware/auth-middleware.js';
import User from '../models/user-model.js';
import upload from '../middleware/upload-middleware.js';

const router = express.Router();

const getRelationshipStatus = (currentUser, targetUserId) => {
  const id = targetUserId.toString();
  if ((currentUser.friends || []).some((friendId) => friendId.toString() === id)) {
    return 'friend';
  }
  if ((currentUser.outgoingFriendRequests || []).some((friendId) => friendId.toString() === id)) {
    return 'requested';
  }
  if ((currentUser.incomingFriendRequests || []).some((friendId) => friendId.toString() === id)) {
    return 'incoming';
  }
  return 'none';
};

// GET /api/user/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePic: user.profilePic,
        interests: user.interests || [],
        whoAmI: user.whoAmI || '',
        aboutInfo: user.aboutInfo || '',
        education: user.education || '',
        onboardingCompleted: Boolean(user.onboardingCompleted),
        friendsCount: (user.friends || []).length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/user/profile - Update profile
router.put('/profile', protect, upload.single('profilePic'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.bio = req.body.bio ?? user.bio;
    user.whoAmI = req.body.whoAmI ?? user.whoAmI;
    user.aboutInfo = req.body.aboutInfo ?? user.aboutInfo;
    user.education = req.body.education ?? user.education;

    if (typeof req.body.interests === 'string') {
      user.interests = req.body.interests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    if (req.body.username && req.body.username !== user.username) {
      const usernameExists = await User.findOne({ username: req.body.username.toLowerCase() });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = req.body.username.toLowerCase();
    }

    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      profilePic: updatedUser.profilePic,
      interests: updatedUser.interests || [],
      whoAmI: updatedUser.whoAmI || '',
      aboutInfo: updatedUser.aboutInfo || '',
      education: updatedUser.education || '',
      onboardingCompleted: Boolean(updatedUser.onboardingCompleted)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/user/onboarding - Complete onboarding details after auth
router.post('/onboarding', protect, async (req, res) => {
  try {
    const { name, whoAmI, aboutInfo, education, interests } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name && typeof name === 'string') user.name = name.trim();
    if (whoAmI && typeof whoAmI === 'string') user.whoAmI = whoAmI.trim();
    if (aboutInfo && typeof aboutInfo === 'string') user.aboutInfo = aboutInfo.trim();
    if (education && typeof education === 'string') user.education = education.trim();

    if (Array.isArray(interests)) {
      user.interests = interests
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 20);
    } else if (typeof interests === 'string') {
      user.interests = interests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    user.onboardingCompleted = true;
    await user.save();

    res.json({ message: 'Onboarding saved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/user - Search users and return relationship status
router.get('/', protect, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const currentUser = await User.findById(req.user._id).select(
      'friends outgoingFriendRequests incomingFriendRequests'
    );

    const query = {
      _id: { $ne: req.user._id }
    };

    if (q) {
      query.$or = [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name username email profilePic')
      .limit(limit)
      .sort({ username: 1 });

    const enriched = users.map((user) => ({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      relationship: getRelationshipStatus(currentUser, user._id)
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/user/friends - Friend-only list for chat creation
router.get('/friends', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('friends', 'name username email profilePic');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const friends = (currentUser.friends || []).map((user) => ({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      relationship: 'friend'
    }));
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/user/friend-requests - Pending incoming/outgoing requests
router.get('/friend-requests', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate('incomingFriendRequests', 'name username profilePic')
      .populate('outgoingFriendRequests', 'name username profilePic');

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      incoming: currentUser.incomingFriendRequests || [],
      outgoing: currentUser.outgoingFriendRequests || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/user/friend-request/:username - Send request by username
router.post('/friend-request/:username', protect, async (req, res) => {
  try {
    const username = String(req.params.username || '').toLowerCase();
    const targetUser = await User.findOne({ username });
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found.' });
    }
    if (targetUser._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ message: 'You cannot add yourself.' });
    }

    const alreadyFriends = (currentUser.friends || []).some((id) => id.toString() === targetUser._id.toString());
    if (alreadyFriends) {
      return res.status(400).json({ message: 'You are already friends.' });
    }

    const alreadyRequested = (currentUser.outgoingFriendRequests || []).some((id) => id.toString() === targetUser._id.toString());
    if (alreadyRequested) {
      return res.status(400).json({ message: 'Friend request already sent.' });
    }

    currentUser.outgoingFriendRequests.push(targetUser._id);
    targetUser.incomingFriendRequests.push(currentUser._id);
    await currentUser.save();
    await targetUser.save();

    res.json({ message: `Friend request sent to @${targetUser.username}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/user/friend-request/:userId/accept - Accept incoming request
router.post('/friend-request/:userId/accept', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id);
    const requester = await User.findById(userId);

    if (!currentUser || !requester) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const hasIncoming = (currentUser.incomingFriendRequests || []).some((id) => id.toString() === requester._id.toString());
    if (!hasIncoming) {
      return res.status(400).json({ message: 'No incoming request from this user.' });
    }

    currentUser.incomingFriendRequests = currentUser.incomingFriendRequests.filter((id) => id.toString() !== requester._id.toString());
    requester.outgoingFriendRequests = requester.outgoingFriendRequests.filter((id) => id.toString() !== currentUser._id.toString());

    if (!(currentUser.friends || []).some((id) => id.toString() === requester._id.toString())) {
      currentUser.friends.push(requester._id);
    }
    if (!(requester.friends || []).some((id) => id.toString() === currentUser._id.toString())) {
      requester.friends.push(currentUser._id);
    }

    await currentUser.save();
    await requester.save();

    res.json({ message: `You are now friends with @${requester.username}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/user/friend-request/:userId/reject - Reject incoming request
router.post('/friend-request/:userId/reject', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id);
    const requester = await User.findById(userId);

    if (!currentUser || !requester) {
      return res.status(404).json({ message: 'User not found.' });
    }

    currentUser.incomingFriendRequests = currentUser.incomingFriendRequests.filter((id) => id.toString() !== requester._id.toString());
    requester.outgoingFriendRequests = requester.outgoingFriendRequests.filter((id) => id.toString() !== currentUser._id.toString());

    await currentUser.save();
    await requester.save();

    res.json({ message: 'Friend request rejected.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/user/check-username/:username - Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const normalized = username.toLowerCase();

    const existingUser = await User.findOne({ username: normalized });
    if (!existingUser) {
      return res.json({ available: true, username: normalized });
    }

    const suggestions = [];
    for (let i = 1; i <= 8 && suggestions.length < 3; i++) {
      const suggestion = `${normalized}${i}`;
      const exists = await User.findOne({ username: suggestion });
      if (!exists) suggestions.push(suggestion);
    }

    while (suggestions.length < 3) {
      const randomNum = Math.floor(Math.random() * 1000);
      const suggestion = `${normalized}${randomNum}`;
      if (suggestions.includes(suggestion)) continue;
      const exists = await User.findOne({ username: suggestion });
      if (!exists) suggestions.push(suggestion);
    }

    res.json({
      available: false,
      username: normalized,
      suggestions: suggestions.slice(0, 3)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
