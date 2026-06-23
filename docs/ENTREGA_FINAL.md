# Entrega Final - Clínica Odonto

Data de fechamento: 05/06/2026

## Status geral

Projeto preparado para demonstração e validação interna com:

- interface desktop refinada;
- login com identidade visual corporativa;
- agenda, fila, pacientes, atendimento e financeiro integrados;
- remarcação pública com pré-reserva e aprovação interna;
- documentação de apoio para operação e aprovação.

## Estrutura do projeto

- `frontend/`: interface React + Vite
- `backend/`: API Node.js + Express
- `tests/`: testes automatizados
- `docs/`: dossiês, homologação e material de entrega

## Credenciais demo

- Administrador
  - E-mail: `admin@clinica.com`
  - Senha: `admin123`

- Recepção
  - E-mail: `recepcao@clinica.com`
  - Senha: `recepcao123`

Observação:
- As credenciais são garantidas pelo comando `npm run seed`.

## Como rodar

```bash
npm install
npm run seed
npm run dev
```

Para reiniciar a base de demonstração com pacientes e fila de teste:

```bash
npm run reset:demo
```

URLs locais:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Comandos principais

```bash
npm run frontend
npm run backend
npm run backend:dev
npm run test
npm run lint
npm run build
```

## Fluxos principais validados

- login por perfil;
- dashboard operacional;
- agenda e cadastro de paciente;
- ficha do paciente e atendimento;
- confirmação pública;
- remarcação pública com seleção de dia e horário;
- aprovação interna da remarcação.

## Como funciona a aprovação da remarcação

Quando a recepção ou o administrador clica para aprovar a remarcação:

- o sistema não cria uma nova consulta;
- o mesmo agendamento existente é movido para o novo horário;
- a pré-reserva é encerrada;
- o horário antigo deixa de ser o horário ativo da consulta.

Na prática, a consulta é remarcada automaticamente.

## Validação técnica final

Última rodada validada com sucesso:

- `npm run lint`
- `npm run test`
- `npm run build`

## Arquivos de apoio para apresentação

- [README.md](C:/Users/Usuario/Desktop/clinica/clinica-odonto/README.md)
- [docs/dossie-aprovacao.html](C:/Users/Usuario/Desktop/clinica/clinica-odonto/docs/dossie-aprovacao.html)

## Checklist rápido de apresentação

1. Rodar `npm run seed`
2. Rodar `npm run dev`
3. Entrar com perfil `recepcao`
4. Mostrar agenda, fila e confirmações
5. Mostrar remarcação pública e aprovação interna
6. Entrar com perfil `admin`
7. Mostrar a visão completa, inclusive financeiro e usuários
