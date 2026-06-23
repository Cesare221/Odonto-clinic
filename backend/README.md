# Backend

API e regras de negócio do sistema Clínica Odonto.

## Responsabilidades

- autenticação e perfis
- agenda e confirmações
- pacientes, prontuário e atendimento
- financeiro e persistência

## Execução

```bash
npm run backend
```

## Desenvolvimento

```bash
npm run backend:dev
```

## Produção

Este backend está preparado para publicar em Railway com banco no MongoDB Atlas.

Variáveis principais:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `PUBLIC_APP_URL`
- `CLIENT_URLS`

Exemplo de `CLIENT_URLS`:

```env
CLIENT_URLS=http://localhost:5173,https://clinica-odonto-ashy.vercel.app,https://clinica-odonto-*.vercel.app
```
