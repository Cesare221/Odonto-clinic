import mongoose from 'mongoose';

const medicalHistorySchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, enum: ['sim', 'nao'], required: true },
  detail: { type: String, default: '' },
});

const addressSchema = new mongoose.Schema({
  cep: { type: String, trim: true },
  street: { type: String, trim: true },
  number: { type: String, trim: true },
  complement: { type: String, trim: true },
  neighborhood: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true, maxlength: 2 },
});

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do paciente e obrigatorio'],
    trim: true,
  },
  cpf: {
    type: String,
    required: [true, 'CPF e obrigatorio'],
    unique: true,
    trim: true,
    match: [/\d{3}\.\d{3}\.\d{3}-\d{2}/, 'CPF deve estar no formato 000.000.000-00'],
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email invalido'],
  },
  birthdate: { type: Date },
  rg: { type: String, trim: true },
  gender: { type: String, enum: ['Masculino', 'Feminino', 'Outro', 'Nao informado'], default: 'Nao informado' },
  maritalStatus: { type: String, trim: true },
  profession: { type: String, trim: true },
  address: addressSchema,
  medicalHistory: [medicalHistorySchema],
  dentalNotes: { type: String, trim: true },
  odontogram: {
    type: Map,
    of: new mongoose.Schema({
      status: { type: String, required: true },
      note: { type: String, default: '' },
      dateUpdated: { type: Date, default: Date.now },
    }),
    default: {},
  },
  treatmentHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TreatmentSession',
  }],
  lastVisit: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

patientSchema.index({ name: 'text', cpf: 'text', email: 'text' });
patientSchema.index({ createdBy: 1 });

export default mongoose.model('Patient', patientSchema);
