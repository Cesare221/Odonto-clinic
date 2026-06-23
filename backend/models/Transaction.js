import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true
  },
  value: {
    type: Number,
    required: [true, 'Valor é obrigatório']
  },
  type: {
    type: String,
    enum: ['receita', 'despesa'],
    required: true
  },
  category: {
    type: String,
    default: 'Outros'
  },
  date: {
    type: Date,
    required: true
  },
  // Referência ao paciente, se aplicável
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  // Referência à sessão de atendimento
  treatmentSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TreatmentSession'
  },
  // ID do usuário (médico/dentista) que registrou
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'debit', 'pix', 'insurance', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Índices financeiros
// Transaction indexes for efficient queries
transactionSchema.index({ date: -1 });
transactionSchema.index({ registeredBy: 1 });
transactionSchema.index({ type: 1 });

export default mongoose.model('Transaction', transactionSchema);
