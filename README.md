# API de Gerenciamento de Cartões — Backend

## Visão Geral
- API Node.js/Express com MongoDB para sincronizar e expor dados de Open Finance.
- Job de sincronização periódico e endpoint manual para disparo.
- Rotas de consulta protegidas por JWT com segurança estrita por CPF.

## Variáveis de Ambiente (.env)
- `PORT` — porta da API (default `4000`).
- `MONGODB_URI` — string de conexão do MongoDB.
- `JWT_SECRET` — segredo para assinar tokens JWT.
- `JWT_EXPIRE` — tempo de expiração do token (ex.: `48h`).
- `ENABLE_SYNC_JOB` — `true|false` para habilitar job periódico.
- `OPENFINANCE_SYNC_CRON` — expressão CRON do job (ex.: `0 * * * *`).
- `FINANCIAL_INSTITUTION_API_URL_1` — base da API fornecedora.
- `FINANCIAL_INSTITUTION_API_KEY_1` — API key da fornecedora.
- `FINANCIAL_INSTITUTION_TIMEOUT_1` — timeout de chamadas (ms), ex.: `5000`.

## Autenticação
- `POST /api/auth`
  - Body: `{ "email": "...", "senha": "..." }`
  - Resposta: `{ "token": "<JWT>" }`
  - O JWT inclui `id`, `email` e `cpf`. O middleware anexa `req.LoggedUser.cpf`.

- `POST /api/user`
  - Body: `{ "nome": "...", "cpf": "...", "email": "...", "senha": "..." }`
  - Resposta: `201` em sucesso.

## Sincronização
- Automática (job): habilitada quando `ENABLE_SYNC_JOB = true`. Agenda conforme `OPENFINANCE_SYNC_CRON` (padrão `0 * * * *`). Executa sincronização completa: instituições, consents, clientes, contas e transações.
- Manual (endpoints):
  - `POST /api/sync` — protegido; dispara imediatamente a sincronização completa.
  - `POST /api/institutions/sync` — protegido; sincroniza apenas instituições financeiras.

## Rotas de Consulta (Protegidas)
Todas exigem `Authorization: Bearer <token>` e aplicam segurança por CPF: o `cpf` do token deve ser igual ao CPF dos dados consultados. O CPF não é enviado como query.

- `GET /api/customers/me`
  - Resposta: `{ success: true, data: Customer }` ou `404` se não houver cliente para o CPF.
  - Critérios de aceitação: retorna exatamente o cliente cujo CPF = token.

- `GET /api/accounts/me`
  - Resposta: `{ success: true, data: Account[] }` (apenas contas `credit-card` sincronizadas).
  - Critérios de aceitação: lista contas vinculadas ao cliente do CPF do token.

- `GET /api/transactions/me?page=<n>&limit=<m>`
  - Resposta: `{ success: true, data: { items, page, limit, total, totalPages } }`.
  - Paginação opcional; ordenado por `date` desc.
  - Critérios de aceitação: retorna transações das contas do cliente do CPF do token.

## Instituições
- `GET /api/institutions` — lista IFs ativas.
- `POST /api/institutions/sync` — força sincronização das IFs.
- `GET /api/institutions/me` — protegido; retorna diretamente a lista de IFs vinculadas ao CPF do token (sem wrapper de sucesso). Em ausência de consentimentos ativos retorna `[]`. Em erro, a API responde apenas com a mensagem (string) e o código HTTP correspondente.

## Guia de Uso de Endpoints (com exemplos)

### Autenticação
- `POST /api/auth`
  - Corpo: `{ "email": "user@example.com", "senha": "secret" }`
  - Resposta (200): `{ "token": "<JWT>" }`
  - Exemplo `curl`:
    - `curl -X POST http://localhost:4000/api/auth -H "Content-Type: application/json" -d '{"email":"user@example.com","senha":"secret"}'`

### Cadastro de Usuário
- `POST /api/user`
  - Corpo: `{ "nome": "Tester", "cpf": "51869958004", "email": "user@example.com", "senha": "secret" }`
  - Respostas:
    - Sucesso (201): `{ "message": "Usuário criado" }` (ou similar)
    - Conflito (409): `{ "error": "E-mail já cadastrado" }` (exemplo)

### Cliente (por CPF do token)
- `GET /api/customers/me`
  - Headers: `Authorization: Bearer <token>`
  - Respostas:
    - Sucesso (200): `{ "success": true, "data": { "_id": "cus_001", "nome": "Tester", "cpf": "51869958004", ... } }`
    - CPF ausente (403): `{ "success": false, "error": "Acesso negado: CPF não presente no token." }`
    - Não encontrado (404): `{ "success": false, "error": "Cliente não encontrado para o CPF do token." }`

### Contas (por CPF do token)
- `GET /api/accounts/me`
  - Headers: `Authorization: Bearer <token>`
  - Respostas:
    - Sucesso (200): `{ "success": true, "data": [ { "_id": "acc_001", "type": "credit-card", ... }, ... ] }`
    - CPF ausente (403): `{ "success": false, "error": "Acesso negado: CPF não presente no token." }`
    - Não encontrado (404): `{ "success": false, "error": "Nenhuma conta encontrada para o CPF do token." }`

### Transações (por CPF do token)
- `GET /api/transactions/me?page=<n>&limit=<m>`
  - Headers: `Authorization: Bearer <token>`
  - Respostas:
    - Sucesso (200): `{ "success": true, "data": { "items": [ { "_id": "txn_001", "date": "2025-01-15", ... } ], "page": 1, "limit": 20, "total": 3, "totalPages": 1 } }`
    - Erro (500): `{ "success": false, "error": "Erro ao consultar transações.", "details": "mensagem" }`

### Instituições (lista geral)
- `GET /api/institutions`
  - Headers: `Authorization: Bearer <token>`
  - Resposta (200): `[ { "id": "if_001", "nome": "bnk_001", "status": true } ]`
  - Erro (500): `{ "message": "Erro interno ao buscar instituições." }`

### Instituições do Usuário (por CPF do token)
- `GET /api/institutions/me`
  - Headers: `Authorization: Bearer <token>`
  - Respostas:
    - Sucesso (200): `[ { "id": "if_001", "nome": "bnk_001", "status": true } ]`
    - Sem consentimentos ativos (200): `[]`
    - Erros:
      - CPF ausente (403): `"CPF ausente no token."`
      - Cliente não encontrado (404): `"Cliente não encontrado para este CPF."`
      - Falha interna (500): `"Erro interno ao buscar instituições do usuário."`

### Sincronização Manual
- `POST /api/sync`
  - Headers: `Authorization: Bearer <token>`
  - Resposta (200): `{ "message": "Sincronização executada", "result": { ...relatório... } }`
  - Erro (500): `{ "error": "Falha ao executar sincronização", "details": "mensagem" }`

- `POST /api/institutions/sync`
  - Headers: `Authorization: Bearer <token>`
  - Respostas:
    - Sucesso (200): `{ "message": "Sincronização concluída com sucesso.", "details": { created, updated, errors, syncDate } }`
    - Timeout/IF offline (504): `{ "message": "Gateway Timeout: ...", "error": "mensagem" }`
    - Falha interna (500): `{ "message": "Erro interno ao sincronizar instituições." }`

## Padrão de Respostas (novas rotas)
- Sucesso: `{ success: true, data: ... }`.
- Erro: `{ success: false, error: "mensagem", details?: "..." }`.
- Códigos: `200/201`, `401` (token inválido), `403` (CPF ausente ou acesso negado), `404` (não encontrado), `409` (conflito), `500` (erro interno).

## Segurança por CPF
- O CPF é incluído no JWT no login e propagado pelo middleware.
- As consultas usam exclusivamente o CPF do token; rotas não aceitam CPF como parâmetro.

## Execução
- Instalar dependências: `npm install`
- Desenvolvimento: `npm start`
- Variáveis de ambiente devem estar definidas antes de iniciar.