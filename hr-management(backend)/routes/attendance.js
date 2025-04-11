const express = require('express');
    const auth = require('../middleware/auth');
    const Attendance = require('../models/Attendance');
    const router = express.Router();

    // @route   POST /api/attendance/clock-in
    router.post('/clock-in', auth, async (req, res) => {
    const { employeeId, employeeName, enteredLocation } = req.body;

    try {
        // Get start and end of current day
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Check if attendance already exists for today
        const existingAttendance = await Attendance.findOne({
        user: req.user.id,
        enteredTime: {
            $gte: startOfDay,
            $lt: endOfDay
        }
        });

        if (existingAttendance) {
        return res.status(400).json({ 
            success: false,
            msg: 'You have already registered your attendance for today',
            existingRecord: {
            id: existingAttendance._id,
            enteredTime: existingAttendance.enteredTime,
            enteredLocation: existingAttendance.enteredLocation
            }
        });
        }

        const newAttendance = new Attendance({
        employeeId,
        employeeName,
        enteredTime: new Date(),
        enteredLocation,
        user: req.user.id
        });

        await newAttendance.save();
        res.json({
        success: true,
        msg: 'Attendance registered successfully',
        record: newAttendance
        });
    } catch (err) {
        console.error('❌ Clock-in error:', err.message);
        res.status(500).json({
        success: false,
        msg: 'Server error',
        error: err.message
        });
    }
    });

    // @route   PUT /api/attendance/clock-out/:id
    router.put('/clock-out/:id', auth, async (req, res) => {
    const { outLocation, farDistance } = req.body;

    try {
        // Validate ID parameter exists
        if (!req.params.id) {
        return res.status(400).json({
            success: false,
            msg: 'Attendance ID is required in the URL'
        });
        }

        let attendance = await Attendance.findById(req.params.id);
        if (!attendance) {
        return res.status(404).json({ 
            success: false,
            msg: 'Attendance record not found'
        });
        }

        // Calculate total hours worked
        const outTime = new Date();
        const enteredTime = attendance.enteredTime;
        const totalHours = (outTime - enteredTime) / (1000 * 60 * 60); // Convert ms to hours

        attendance.outTime = outTime;
        attendance.outLocation = outLocation;
        attendance.farDistance = farDistance;
        attendance.totalHoursWorked = totalHours;

        await attendance.save();
        res.json({
            success: true,
            msg: 'Clock-out recorded successfully',
            record: attendance
        });
    } catch (err) {
        console.error('❌ Clock-out error:', err.message);
        res.status(500).json({
            success: false,
            msg: 'Server error',
            error: err.message
        });
    }
    });

    // @route   GET /api/attendance
    router.get('/', auth, async (req, res) => {
    try {
        const attendances = await Attendance.find({ user: req.user.id }).sort({ enteredTime: -1 });
        res.json(attendances);
    } catch (err) {
        console.error('❌ Get attendance error:', err.message);
        res.status(500).send('Server error');
    }
    });

    module.exports = router;