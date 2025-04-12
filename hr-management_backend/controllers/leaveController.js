const Leave = require('../models/Leave');

// Create leave request
exports.createLeave = async (req, res) => {
  try {
    const { employeeId, employeeName, leaveType, startDate, endDate, reason } = req.body;
    
    // Validate required fields
    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Calculate days between dates
    const days = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      employeeId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      user: req.user.id, // Get user from auth token
      status: 'Pending'
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all leaves (admin)
exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().populate('user', 'name email');
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leaves for specific user
exports.getUserLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.params.userId });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update leave status (admin)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.status(200).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel leave request
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.status(200).json({ message: 'Leave request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};