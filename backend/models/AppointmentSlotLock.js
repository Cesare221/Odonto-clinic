import mongoose from 'mongoose';

const appointmentSlotLockSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

appointmentSlotLockSchema.index(
  { doctor: 1, start: 1, end: 1 },
  { unique: true, name: 'unique_doctor_slot_lock' }
);

export default mongoose.model('AppointmentSlotLock', appointmentSlotLockSchema);
