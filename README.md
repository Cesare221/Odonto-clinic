# 🦷 CliniDent - Sistema de Gestão Odontológica

<div align="center">
  
  ![Node.js](https://img.shields.io/badge/Node.js-22.x-green?style=for-the-badge&logo=node.js)
  ![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)
  ![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green?style=for-the-badge&logo=mongodb)
  ![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

  **Sistema completo de gestão para clínicas odontológicas**
  
  [Demo ao Vivo](https://clinica-odonto-ashy.vercel.app) · [Reportar Bug](https://github.com/Cesare221/Odonto-clinic/issues) · [Solicitar Feature](https://github.com/Cesare221/Odonto-clinic/issues)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Screenshots](#-screenshots)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Deploy](#-deploy)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)
- [Contato](#-contato)

---

## 🎯 Sobre o Projeto

CliniDent é um sistema completo de gestão para clínicas odontológicas que moderniza e simplifica o dia a dia da sua clínica. Desenvolvido com as mais recentes tecnologias web, oferece uma experiência fluida tanto para profissionais quanto para pacientes.

### Por que CliniDent?

- ⏰ **Economize Tempo**: Automatize agendamentos e confirmações
- 📊 **Visão Completa**: Acompanhe métricas e finanças em tempo real
- 🔒 **Seguro**: Autenticação robusta com JWT e 2FA
- 📱 **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- 🌐 **Agendamento Online**: Pacientes podem agendar diretamente
- 🎨 **Interface Moderna**: Design intuitivo e profissional

---

## ✨ Funcionalidades

### 📅 Gestão de Agenda
- ✅ Visualização mensal e semanal
- ✅ Agendamento online público para clientes
- ✅ Seleção de dentista
- ✅ Confirmação automática de consultas
- ✅ Sistema de reagendamento
- ✅ Bloqueio de horários indisponíveis
- ✅ Notificações e lembretes

### 👥 Gestão de Pacientes
- ✅ Cadastro completo com validação de CPF
- ✅ Histórico completo de consultas
- ✅ Odontograma interativo
- ✅ Registro de tratamentos e sessões
- ✅ Upload de documentos e imagens
- ✅ Busca avançada

### 💰 Controle Financeiro
- ✅ Dashboard de receitas
- ✅ Registro de transações
- ✅ Relatórios por período
- ✅ Controle de pagamentos
- ✅ Visualização de débitos pendentes

### 👨‍⚕️ Gestão de Equipe
- ✅ Cadastro de dentistas e recepcionistas
- ✅ Controle de permissões por função
- ✅ Autenticação segura (JWT + 2FA)
- ✅ Logs de atividades

### 🎨 Interface & UX
- ✅ Design responsivo e moderno
- ✅ Menu sanduíche adaptativo
- ✅ Tema azul profissional
- ✅ Animações suaves
- ✅ Feedback visual em tempo real

---

## 🛠️ Tecnologias

### Backend
- **Runtime**: Node.js 22.x
- **Framework**: Express.js 5.x
- **Banco de Dados**: MongoDB com Mongoose
- **Autenticação**: JWT + Refresh Tokens
- **Validação**: Zod
- **Segurança**: Helmet, bcryptjs, express-rate-limit
- **2FA**: Speakeasy + QRCode

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Roteamento**: React Router v6
- **Requisições HTTP**: Axios
- **Estilização**: Tailwind CSS (via inline styles)
- **Ícones**: Lucide React
- **Notificações**: Sonner
- **Animações**: Framer Motion

### DevOps & Deploy
- **Backend**: Railway
- **Frontend**: Vercel
- **CI/CD**: GitHub Actions (deploy automático)
- **Hospedagem DB**: MongoDB Atlas

---

## 📸 Screenshots

### Dashboard Principal
<!-- Adicione uma imagem do dashboard aqui -->
![Dashboard](docs/images/dashboard.png)

*Visão geral com métricas em tempo real, fila de atendimento e próximos agendamentos*

---

### Agenda Mensal e Semanal
<!-- Adicione imagens da agenda aqui -->
![Agenda Mensal](docs/images/agenda-mensal.png)
![Agenda Semanal](docs/images/agenda-semanal.png)

*Visualização completa da agenda com calendário interativo*

---

### Agendamento Online Público
<!-- Adicione imagem do agendamento público aqui -->
![Agendamento Público](docs/images/agendamento-publico.png)

*Interface para clientes agendarem consultas diretamente*

---

### Gestão de Pacientes
<!-- Adicione imagem da lista de pacientes aqui -->
![Pacientes](docs/images/pacientes.png)

*Cadastro completo com busca e filtros avançados*

---

### Controle Financeiro
<!-- Adicione imagem do financeiro aqui -->
![Financeiro](docs/images/financeiro.png)

*Dashboard financeiro com gráficos e relatórios*

---

### Menu Mobile Responsivo
<!-- Adicione imagem do menu mobile aqui -->
![Menu Mobile](docs/images/menu-mobile.png)

*Interface adaptada para dispositivos móveis*

---

## 🚀 Instalação

### Pré-requisitos

- Node.js >= 22.0.0
- MongoDB (local ou Atlas)
- npm ou yarn

### Clone o Repositório

```bash
git clone https://github.com/Cesare221/Odonto-clinic.git
cd Odonto-clinic
```

### Instalação Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente no arquivo .env
npm run dev
```

### Instalação Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Configure a URL da API no arquivo .env
npm run dev
```

---

## ⚙️ Configuração

### Backend (.env)

```env
# Servidor
PORT=5000
NODE_ENV=development

# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/clinica_odonto

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=seu_refresh_token_secret_aqui
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS (opcional)
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📖 Uso

### Iniciar Desenvolvimento

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Popular Banco de Dados

```bash
cd backend
npm run seed
```

### Usuário Padrão Após Seed

- **Email**: admin@clinica.com
- **Senha**: admin123
- **Função**: Administrador

### Scripts Disponíveis

#### Backend
```bash
npm start              # Servidor produção
npm run dev            # Servidor desenvolvimento
npm run seed           # Popular banco com dados exemplo
npm run reset:demo     # Resetar dados de demonstração
```

#### Frontend
```bash
npm run dev            # Servidor desenvolvimento
npm run build          # Build para produção
npm run preview        # Preview do build de produção
npm run lint           # Verificar código
```

---

## 🌐 Deploy

### Backend no Railway

1. Crie uma conta no [Railway](https://railway.app)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `REFRESH_TOKEN_SECRET`
   - `REFRESH_TOKEN_EXPIRES_IN`
   - `NODE_ENV=production`
4. Deploy automático a cada push na branch `main`

### Frontend na Vercel

1. Crie uma conta na [Vercel](https://vercel.com)
2. Importe o repositório do GitHub
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicione variável de ambiente:
   - `VITE_API_URL=https://seu-backend.railway.app/api`
5. Deploy automático a cada push

### MongoDB Atlas

1. Crie um cluster no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Configure acesso de rede (IP Whitelist)
3. Crie um usuário de banco de dados
4. Obtenha a string de conexão
5. Adicione no Railway como `MONGODB_URI`

---

## 🗺️ Roadmap

### Em Desenvolvimento
- [ ] Sistema de notificações por email
- [ ] Relatórios em PDF
- [ ] Integração com WhatsApp Business
- [ ] App mobile (React Native)
- [ ] Dashboard de analytics avançado

### Planejado
- [ ] Integração com sistemas de pagamento (Stripe, PagSeguro)
- [ ] Prontuário eletrônico completo
- [ ] Assinatura digital de documentos
- [ ] Sistema de avaliações e feedback
- [ ] Multi-idiomas (i18n)

Veja os [issues abertos](https://github.com/Cesare221/Odonto-clinic/issues) para uma lista completa de funcionalidades propostas e bugs conhecidos.

---

## 🤝 Contribuindo

Contribuições são o que fazem a comunidade open source um lugar incrível para aprender, inspirar e criar. Qualquer contribuição é **muito apreciada**.

### Como Contribuir

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use ESLint e Prettier
- Siga os padrões de commit convencionais
- Adicione testes quando aplicável
- Atualize a documentação

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## 📞 Contato

**Cesar Delmondes**

- GitHub: [@Cesare221](https://github.com/Cesare221)
- Email: cesar.delmondes0@gmail.com

**Link do Projeto**: [https://github.com/Cesare221/Odonto-clinic](https://github.com/Cesare221/Odonto-clinic)

---

## 🙏 Agradecimentos

- [Node.js](https://nodejs.org/)
- [React](https://reactjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Railway](https://railway.app/)
- [Vercel](https://vercel.com/)

---

<div align="center">
  
  **⭐ Se este projeto te ajudou, considere dar uma estrela! ⭐**
  
  Desenvolvido com ❤️ por [Cesar Delmondes](https://github.com/Cesare221)

</div>
