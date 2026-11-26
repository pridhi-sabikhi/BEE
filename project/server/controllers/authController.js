const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (username && !/^[a-zA-Z0-9._-]{3,30}$/.test(username.trim())) {
      return res.status(400).json({ message: 'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens' });
    }

    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(username ? [{ username: username.trim().toLowerCase() }] : []),
      ],
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already in use' });
    }

    const user = await User.create({ name, username, email, password });
    const token = generateToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};
