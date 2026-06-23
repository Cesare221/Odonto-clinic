import axios from 'axios';

async function createAdminUser() {
  const userData = {
    name: 'Administrador',
    email: 'admin@clinica.com',
    password: 'admin123',
    role: 'admin',
  };

  try {
    console.log('Tentando criar usuário administrador...');
    await axios.post('http://localhost:5000/api/auth/register', userData);
    console.log('Usuário criado com sucesso!');
    console.log('Email:', userData.email);
    console.log('Senha:', userData.password);
    console.log('\nFaça login com estas credenciais.');
  } catch (error) {
    if (error.response) {
      console.log('Erro:', error.response.data.message || error.response.data);
    } else {
      console.log('Erro: Não foi possível conectar ao servidor.');
      console.log('Certifique-se de que o backend está em execução (`npm run backend` ou `npm run dev`).');
    }
  }
}

createAdminUser();

