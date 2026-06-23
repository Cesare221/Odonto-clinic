import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Transaction from '../models/Transaction.js';
import TreatmentSession from '../models/TreatmentSession.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/apiError.js';

const sanitizeAppointment = (appointment) => {
  const safeAppointment = { ...appointment };

  delete safeAppointment.confirmToken;
  delete safeAppointment.confirmacaoResponderIp;
  delete safeAppointment.confirmacaoResponderUserAgent;

  return safeAppointment;
};

export const createDoctorCesarPublic = asyncHandler(async (req, res) => {
  // Verifica se já existe
  const existingUser = await User.findOne({ email: 'cesar@clinica.com' });
  
  if (existingUser) {
    return res.status(200).json({
      status: 'success',
      message: 'Dr. Cesar já existe no sistema',
      data: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  }

  // Cria o hash da senha
  const hashedPassword = await bcrypt.hash('Cesar@123', 10);

  // Cria o Dr. Cesar
  const doctorCesar = await User.create({
    name: 'Dr. Cesar',
    email: 'cesar@clinica.com',
    password: hashedPassword,
    role: 'doctor',
    isActive: true,
  });

  res.status(201).json({
    status: 'success',
    message: 'Dr. Cesar criado com sucesso',
    data: {
      id: doctorCesar._id,
      name: doctorCesar.name,
      email: doctorCesar.email,
      role: doctorCesar.role,
    },
  });
});

export const createDoctorCesar = asyncHandler(async (req, res) => {
  // Verifica se já existe
  const existingUser = await User.findOne({ email: 'cesar@clinica.com' });
  
  if (existingUser) {
    return res.status(200).json({
      status: 'success',
      message: 'Dr. Cesar já existe no sistema',
      data: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  }

  // Cria o hash da senha
  const hashedPassword = await bcrypt.hash('Cesar@123', 10);

  // Cria o Dr. Cesar
  const doctorCesar = await User.create({
    name: 'Dr. Cesar',
    email: 'cesar@clinica.com',
    password: hashedPassword,
    role: 'doctor',
    isActive: true,
  });

  res.status(201).json({
    status: 'success',
    message: 'Dr. Cesar criado com sucesso',
    data: {
      id: doctorCesar._id,
      name: doctorCesar.name,
      email: doctorCesar.email,
      role: doctorCesar.role,
    },
  });
});

export const exportBackup = asyncHandler(async (req, res) => {
  const [
    users,
    patients,
    appointments,
    transactions,
    treatmentSessions,
  ] = await Promise.all([
    User.find().select('-password -refreshTokens -twoFactorSecret').lean(),
    Patient.find().lean(),
    Appointment.find().lean(),
    Transaction.find().lean(),
    TreatmentSession.find().lean(),
  ]);

  res.status(200).json({
    status: 'success',
    exportedAt: new Date().toISOString(),
    exportedBy: req.user.userId,
    data: {
      users,
      patients,
      appointments: appointments.map(sanitizeAppointment),
      transactions,
      treatmentSessions,
    },
  });
});
