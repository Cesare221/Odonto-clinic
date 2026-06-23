import mongoose from 'mongoose';

const procedureSchema = new mongoose.Schema({
  category: { type: String, required: true },
  procedure: { type: String, required: true },
  price: { type: Number, default: 0 }
}, { _id: true });

const toothUpdateSchema = new mongoose.Schema({
  tooth: { type: String, required: true },
  status: { type: String, required: true },
  note: { type: String, default: '' }
}, { _id: true });

const anamnesisSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, enum: ['sim', 'nao'], required: true },
  detail: { type: String, default: '' }
}, { _id: true });

const treatmentSessionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Procedimentos realizados
  procedures: [procedureSchema],
  
  // Odontograma aplicado nesta sessão
  teethUpdates: [toothUpdateSchema],
  
  // Anamnese realizada
  anamnesis: [anamnesisSchema],
  
  // Evolução clínica gerada pelo médico ou IA
  evolution: {
    type: String,
    default: ''
  },
  
  // Orientações pós-operatórias
  postOpInstructions: {
    type: String,
    default: ''
  },
  
  // Fotos ou documentos da sessão
  attachments: [{
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Valor total do atendimento
  totalValue: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'cancelled'],
    default: 'in-progress'
  }
}, {
  timestamps: true
});

treatmentSessionSchema.index({ patient: 1 });
treatmentSessionSchema.index({ doctor: 1 });
treatmentSessionSchema.index({ date: -1 });

export default mongoose.model('TreatmentSession', treatmentSessionSchema);
