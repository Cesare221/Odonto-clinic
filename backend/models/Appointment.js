import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titulo do agendamento e obrigatorio'],
    trim: true,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  start: {
    type: Date,
    required: [true, 'Data e hora de inicio sao obrigatorias'],
  },
  end: {
    type: Date,
    required: [true, 'Data e hora de fim sao obrigatorias'],
  },
  type: {
    type: String,
    enum: ['eval', 'routine', 'surgery', 'ortho', 'aesthetic', 'emergency'],
    default: 'routine',
  },
  typeLabel: {
    type: String,
    default: '',
  },
  procedure: {
    type: String,
    default: '',
  },
  patientPhone: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
  },
  attendanceStatus: {
    type: String,
    enum: ['waiting', 'in-progress', 'done', 'pre_reserved'],
    default: 'waiting',
  },
  notes: {
    type: String,
    default: '',
  },
  statusConfirmacao: {
    type: String,
    enum: ['pendente', 'confirmado', 'recusado', 'remarcar'],
    default: 'pendente',
  },
  confirmacaoObservacao: {
    type: String,
    default: '',
  },
  confirmToken: {
    type: String,
    default: '',
  },
  confirmTokenExpiresAt: {
    type: Date,
    default: null,
  },
  confirmTokenUsedAt: {
    type: Date,
    default: null,
  },
  confirmacaoRespondedAt: {
    type: Date,
    default: null,
  },
  confirmacaoResponderIp: {
    type: String,
    default: '',
  },
  confirmacaoResponderUserAgent: {
    type: String,
    default: '',
  },
  confirmacaoTratadaAt: {
    type: Date,
    default: null,
  },
  confirmacaoTratadaBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  rescheduleRequest: {
    requestedAt: {
      type: Date,
      default: null,
    },
    requestedStart: {
      type: Date,
      default: null,
    },
    requestedEnd: {
      type: Date,
      default: null,
    },
    requestSource: {
      type: String,
      default: '',
    },
    requestStatus: {
      type: String,
      enum: ['pending_review', 'approved', 'adjusted', 'released'],
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNote: {
      type: String,
      default: '',
    },
    finalStart: {
      type: Date,
      default: null,
    },
    finalEnd: {
      type: Date,
      default: null,
    },
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

appointmentSchema.index({ start: 1 });
appointmentSchema.index({ doctor: 1, start: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ attendanceStatus: 1, start: 1 });
appointmentSchema.index({ statusConfirmacao: 1, updatedAt: -1 });
appointmentSchema.index({ doctor: 1, 'rescheduleRequest.requestStatus': 1 });

export default mongoose.model('Appointment', appointmentSchema);
