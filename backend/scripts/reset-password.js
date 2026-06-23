import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import readline from 'node:readline';

dotenv.config({ path: '../.env' });

const User = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  refreshTokens: []
}, { timestamps: true });

User.index({ email: 1 });

const UserModel = mongoose.model('User', User);

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado!');

    const users = await UserModel.find({});
    
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado.');
    } else {
      console.log('\nUsuários encontrados:');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
    }

    const email = process.argv[2];
    const newPassword = process.argv[3] || 'mudar123';

    if (!email) {
      console.log('\nUso: node scripts/reset-password.js <email> [nova-senha]');
      console.log('Exemplo: node scripts/reset-password.js admin@email.com senha123');
      console.log('\nSenha padrão: mudar123');
      await mongoose.connection.close();
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await UserModel.updateOne(
      { email },
      { $set: { password: hashedPassword, isActive: true } }
    );

    if (result.matchedCount === 0) {
      console.log(`\nUsuário com email "${email}" não encontrado.`);
      console.log('\nDeseja criar um novo usuário admin? (y/n)');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('', (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y') {
          createAdmin(email, newPassword);
        } else {
          mongoose.connection.close();
        }
      });
    } else {
      console.log(`\nSenha redefinida com sucesso para "${email}"!`);
      console.log(`Nova senha: ${newPassword}`);
      console.log('Lembre-se de fazer login com as novas credenciais.');
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

async function createAdmin(email, password) {
  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await UserModel.create({
      name: 'Administrador',
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    console.log('\nUsuário admin criado com sucesso!');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Erro ao criar usuário:', error.message);
    process.exit(1);
  }
}

resetPassword();
