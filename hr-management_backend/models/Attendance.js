const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  enteredTime: {
    type: Date,
    required: true
  },
  outTime: {
    type: Date
  },
  enteredLocation: {
    type: String,
    required: true
  },
  outLocation: {
    type: String
  },
  farDistance: {
    type: Number
  },
  totalHoursWorked: {
    type: Number
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);