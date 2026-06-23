import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import AppointmentSlotLock from '../models/AppointmentSlotLock.js';
import Transaction from '../models/Transaction.js';
import TreatmentSession from '../models/TreatmentSession.js';

dotenv.config();

const demoUsers = [
  {
    role: 'admin',
    name: process.env.ADMIN_NAME || 'Administrador',
    email: process.env.ADMIN_EMAIL || 'admin@clinica.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  {
    role: 'receptionist',
    name: process.env.RECEPTION_NAME || 'Recepção',
    email: process.env.RECEPTION_EMAIL || 'recepcao@clinica.com',
    password: process.env.RECEPTION_PASSWORD || 'recepcao123',
  },
];

const demoPatients = [
  {
    name: 'Camila Borges',
    cpf: '123.456.789-01',
    phone: '62991111111',
    email: 'camila.borges@demo.com',
    profession: 'Analista financeira',
    gender: 'Feminino',
  },
  {
    name: 'Larissa Monteiro',
    cpf: '123.456.789-02',
    phone: '62992222222',
    email: 'larissa.monteiro@demo.com',
    profession: 'Professora',
    gender: 'Feminino',
  },
  {
    name: 'Cesar Almeida',
    cpf: '123.456.789-03',
    phone: '62993333333',
    email: 'cesar.almeida@demo.com',
    profession: 'Empresário',
    gender: 'Masculino',
  },
  {
    name: 'Marina Costa',
    cpf: '123.456.789-04',
    phone: '62994444444',
    email: 'marina.costa@demo.com',
    profession: 'Arquiteta',
    gender: 'Feminino',
  },
];

const createSlot = (baseDate, hour, minute = 0, durationMinutes = 30) => {
  const start = new Date(baseDate);
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start, end };
};

async function ensureDemoUser(userData) {
  let user = await User.findOne({ email: userData.email }).select('+password');

  if (!user) {
    user = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      isActive: true,
    });
    return user;
  }

  user.name = userData.name;
  user.role = userData.role;
  user.isActive = true;
  user.password = userData.password;
  await user.save();
  return user;
}

async function resetDemoData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado ao MongoDB');

  const [adminUser] = await Promise.all(demoUsers.map(ensureDemoUser));

  await Promise.all([
    AppointmentSlotLock.deleteMany({}),
    Transaction.deleteMany({}),
    TreatmentSession.deleteMany({}),
    Appointment.deleteMany({}),
    Patient.deleteMany({}),
  ]);

  const createdPatients = await Patient.insertMany(
    demoPatients.map((patient) => ({
      ...patient,
      createdBy: adminUser._id,
      address: {
        cep: '74460-050',
        street: 'Rua Cruz de Malta',
        number: '2',
        complement: 'Não informado',
        neighborhood: 'Jardim Petropolis',
        city: 'Goiânia',
        state: 'GO',
      },
      medicalHistory: [],
      dentalNotes: '',
      isActive: true,
    }))
  );

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const slots = [
    {
      patient: createdPatients[0],
      ...createSlot(today, 9, 0),
      type: 'routine',
      procedure: 'Limpeza e profilaxia',
      statusConfirmacao: 'confirmado',
      attendanceStatus: 'waiting',
      title: `Consulta - ${createdPatients[0].name}`,
    },
    {
      patient: createdPatients[1],
      ...createSlot(today, 10, 30),
      type: 'eval',
      procedure: 'Avaliação inicial',
      statusConfirmacao: 'pendente',
      attendanceStatus: 'waiting',
      title: `Consulta - ${createdPatients[1].name}`,
    },
    {
      patient: createdPatients[2],
      ...createSlot(today, 14, 0),
      type: 'emergency',
      procedure: 'Revisão clínica',
      statusConfirmacao: 'confirmado',
      attendanceStatus: 'waiting',
      title: `Consulta - ${createdPatients[2].name}`,
    },
    {
      patient: createdPatients[3],
      ...createSlot(tomorrow, 15, 30),
      type: 'aesthetic',
      procedure: 'Avaliação estética',
      statusConfirmacao: 'pendente',
      attendanceStatus: 'waiting',
      title: `Consulta - ${createdPatients[3].name}`,
    },
  ];

  await Appointment.insertMany(
    slots.map((slot) => ({
      title: slot.title,
      patient: slot.patient._id,
      doctor: adminUser._id,
      start: slot.start,
      end: slot.end,
      type: slot.type,
      procedure: slot.procedure,
      patientPhone: slot.patient.phone,
      status: 'scheduled',
      statusConfirmacao: slot.statusConfirmacao,
      attendanceStatus: slot.attendanceStatus,
      notes: '',
      reminderSent: false,
    }))
  );

  console.log('Base demo reiniciada com sucesso.');
  console.log(`Pacientes recriados: ${createdPatients.length}`);
  console.log('Fila do dia recriada com 3 consultas para hoje e 1 consulta futura.');

  await mongoose.disconnect();
}

resetDemoData().catch(async (error) => {
  console.error('Falha ao reiniciar a base demo:', error.message);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});

