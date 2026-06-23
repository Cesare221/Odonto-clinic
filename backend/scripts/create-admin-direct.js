import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './.env' });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  refreshTokens: []
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB conectado!\n');

    const users = await User.find({});
    
    if (users.length > 0) {
      console.log('Usuários encontrados:');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
      console.log('');
    }

    const adminEmail = 'admin@clinica.com';
    const adminPassword = 'admin123';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Usuário admin já existe: ${adminEmail}`);
      console.log(`Senha: ${adminPassword}`);
    } else {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await User.create({
        name: 'Administrador',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });

      console.log('✓ Novo usuário admin criado!');
    }

    console.log('\n=== CREDENCIAIS ===');
    console.log(`Email: ${adminEmail}`);
    console.log(`Senha: ${adminPassword}`);
    console.log('===================\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Erro:', error.message);
    console.log('\nVerifique sua conexão com MongoDB Atlas.');
    process.exit(1);
  }
}

createAdmin();
