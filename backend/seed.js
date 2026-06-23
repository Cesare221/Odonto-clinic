import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

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

async function ensureDemoUser(userData) {
  const existingUser = await User.findOne({
    $or: [{ role: userData.role }, { email: userData.email }],
  });

  if (existingUser) {
    console.log(`${userData.role} ja existe: ${existingUser.email}`);
    return existingUser;
  }

  const createdUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    isActive: true,
  });

  console.log(`${userData.role} criado:`);
  console.log(`  Email: ${createdUser.email}`);
  console.log('  Senha: [definida no .env ou padrao]');

  return createdUser;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    for (const userData of demoUsers) {
      await ensureDemoUser(userData);
    }

    process.exit(0);
  } catch (err) {
    console.error('Erro no seed:', err.message);
    process.exit(1);
  }
}

seed();

