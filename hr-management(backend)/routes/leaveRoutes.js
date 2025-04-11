const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const auth = require('../middleware/auth');  // Changed from authMiddleware to auth

// Apply auth middleware to all routes
router.use(auth);  // Changed from authMiddleware to auth

// Create leave request
router.post('/', leaveController.createLeave);

// Get user's leaves
router.get('/user/:userId', leaveController.getUserLeaves);

// Update leave status (admin)
router.patch('/:id/status', leaveController.updateLeaveStatus);

// Cancel leave request
router.delete('/:id', leaveController.cancelLeave);

// Add this new route before other routes
router.get('/', leaveController.getAllLeaves);

module.exports = router;