const express = require('express');
const router = express.Router();
const { Link } = require('../models');
const { authenticate, isAdmin } = require('../middleware');

router.get('/', authenticate, (req, res) => {
  try {
    const { category } = req.query;
    const links = Link.find(category ? { category } : {});
    res.json(links);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', authenticate, isAdmin, (req, res) => {
  try {
    const link = Link.create(req.body);
    res.status(201).json(link);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/:id', authenticate, isAdmin, (req, res) => {
  try {
    const link = Link.findByIdAndUpdate(req.params.id, req.body);
    if (!link) return res.status(404).json({ message: 'Not found' });
    res.json(link);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', authenticate, isAdmin, (req, res) => {
  try {
    Link.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/categories', authenticate, (req, res) => {
  try {
    res.json(Link.distinct('category'));
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;