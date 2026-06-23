import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Schema base para criação e atualização automática de timestamps
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais que 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [8, 'Senha deve ter no mínimo 8 caracteres'],
    select: false // Nunca retorna a senha em queries por padrão
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'receptionist'],
    default: 'doctor'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  refreshTokens: [{ // Rastreamento de refresh tokens para invalidação
    token: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Hash da senha antes de salvar
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para adicionar refresh token
userSchema.methods.addRefreshToken = async function(token) {
  this.refreshTokens.push({ token, createdAt: new Date() });
  // Limita a 5 tokens armazenados por usuário
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  await this.save();
};

// Método para remover refresh token específico
userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  await this.save();
};

export default mongoose.model('User', userSchema);
