const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Decoded token:', decoded);  // Add this
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);  // Add this
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
