const express = require('express');
const router = express.Router();
const { Trash, Session } = require('../models');
const { authenticate, isAdmin } = require('../middleware');

router.get('/', authenticate, isAdmin, (req, res) => {
  try {
    const items = Trash.find();
    const total = items.length;
    res.json({ items, total });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', authenticate, isAdmin, (req, res) => {
  try { Trash.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/empty', authenticate, isAdmin, (req, res) => {
  try { Trash.deleteMany(); res.json({ message: 'Emptied' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/:id/restore', authenticate, isAdmin, (req, res) => {
  try {
    const item = Trash.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    Session.create({ trackingCode: item.trackingCode, visitorId: item.originalId || 'restored', ip: item.systemData?.ip || '', browser: item.systemData?.browser || '', deviceType: 'Desktop' });
    Trash.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restored' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;