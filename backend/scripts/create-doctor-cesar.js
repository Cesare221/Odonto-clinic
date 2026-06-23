import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tenta carregar .env.production se existir, senão usa .env
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '..', '.env.production')
  : path.join(__dirname, '..', '.env');

dotenv.config({ path: envPath });

const createDoctorCesar = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado ao MongoDB');

    // Verifica se já existe um usuário com o email
    const existingUser = await User.findOne({ email: 'cesar@clinica.com' });
    
    if (existingUser) {
      console.log('✓ Dr. Cesar já existe no sistema');
      console.log('  ID:', existingUser._id);
      console.log('  Nome:', existingUser.name);
      console.log('  Email:', existingUser.email);
      console.log('  Role:', existingUser.role);
      await mongoose.connection.close();
      return;
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

    console.log('✓ Dr. Cesar criado com sucesso!');
    console.log('  ID:', doctorCesar._id);
    console.log('  Nome:', doctorCesar.name);
    console.log('  Email:', doctorCesar.email);
    console.log('  Senha:', 'Cesar@123');
    console.log('  Role:', doctorCesar.role);

    await mongoose.connection.close();
    console.log('\n✓ Concluído');
  } catch (error) {
    console.error('✗ Erro ao criar Dr. Cesar:', error.message);
    process.exit(1);
  }
};

createDoctorCesar();
