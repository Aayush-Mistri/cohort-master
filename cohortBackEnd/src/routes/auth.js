import express from 'express';
import User  from '../models/user-model.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const normalizedUsername = String(username || '').toLowerCase().trim();
    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!name || !normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password
    });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET not set' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        onboardingCompleted: Boolean(user.onboardingCompleted)
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET not set' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        onboardingCompleted: Boolean(user.onboardingCompleted)
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
