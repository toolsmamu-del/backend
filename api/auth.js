const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authenticate } = require('../middleware');

router.post('/signup', async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    if (User.findOne({ email })) return res.status(400).json({ message: 'Email exists' });
    if (User.findOne({ username })) return res.status(400).json({ message: 'Username exists' });
    User.create({ fullName, username, email, password, role: 'user', status: 'pending' });
    res.status(201).json({ message: 'Signup successful. Wait for admin approval.' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.status === 'pending') return res.status(403).json({ message: 'Pending approval' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Blocked' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7*24*60*60*1000 });
    res.json({ user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, trackingCode: user.trackingCode || '' }, token });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/logout', (req, res) => { res.clearCookie('token'); res.json({ message: 'Logged out' }); });

router.get('/me', authenticate, (req, res) => { res.json(req.user); });

router.put('/profile', authenticate, async (req, res) => {
  try {
    const u = User.findByIdAndUpdate(req.user._id, req.body);
    res.json(u);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Wrong password' });
    const hash = await bcrypt.hash(newPassword, 12);
    User.findByIdAndUpdate(req.user._id, { password: hash });
    res.json({ message: 'Password updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;