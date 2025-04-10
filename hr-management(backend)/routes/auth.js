const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
  
    console.log('📩 Signup payload:', { name, email, password });  // Log incoming data
  
    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: 'User already exists' });
  
      user = new User({ name, email, password });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      await user.save();  // <== error likely happening here
  
      const payload = { user: { id: user.id } };
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
  
    } catch (err) {
      console.error('❌ Signup error:', err.message);  // Add this
      res.status(500).send('Server error');
    }
  });
  

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   GET /api/auth/me (protected)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
