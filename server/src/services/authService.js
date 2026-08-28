const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const EmailAccount = require('../models/EmailAccount');
const { createNotification } = require('./activityService');

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}

async function register({ name, email, password }) {
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    lastLogin: new Date(),
  });

  await createNotification({
    owner: user._id,
    type: 'success',
    title: 'Welcome to MailSense AI!',
    message: 'Your account has been created successfully. Connect your Gmail account to get started.',
    link: '/accounts',
  });

  const token = generateToken(user);
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
    token,
  };
}

async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const connectedAccounts = await EmailAccount.find({ owner: userId, isConnected: true })
    .select('provider emailAddress displayName avatarUrl isConnected isSandbox lastSyncedAt createdAt');

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    connectedAccounts,
  };
}

module.exports = {
  register,
  login,
  getUserProfile,
  generateToken,
};
