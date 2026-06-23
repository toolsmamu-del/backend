const express = require('express');
const router = express.Router();
const { User, Session } = require('../models');
const { authenticate, isAdmin } = require('../middleware');

router.get('/kpi', authenticate, isAdmin, (req, res) => {
  try {
    const totalUsers = User.countDocuments({ status: 'active' });
    const totalSessions = Session.countDocuments();
    const mobileClicks = Session.countDocuments({ deviceType: 'Mobile' });
    const desktopClicks = Session.countDocuments({ deviceType: 'Desktop' });
    res.json({ totalUsers, totalSessions, mobileClicks, desktopClicks });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/user-conversion', authenticate, isAdmin, (req, res) => {
  try {
    const users = User.find({ status: 'active' });
    const data = users.map(u => {
      const sessions = Session.find().filter(s => s.trackingCode === u.trackingCode);
      return { userId: u._id, fullName: u.fullName, email: u.email, mobileClicks: sessions.filter(s => s.deviceType === 'Mobile').length, desktopClicks: sessions.filter(s => s.deviceType === 'Desktop').length, totalSessions: sessions.length };
    });
    res.json(data);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;