# Auren — Agendamento de exames e laudos

Desafio técnico: aplicação web para uma clínica agendar exames, cadastrar laudos e
disponibilizá-los para os pacientes. Design baseado no design system "Auren"
(`Design System/`).

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + React Router
- **Backend:** Node.js + TypeScript + Fastify + Prisma (SQLite) + JWT (cookie httpOnly) + bcrypt
- **Testes:** Vitest (backend), via `fastify.inject` — sem servidor HTTP real subindo

## Estrutura do repositório

```
backend/   API (Fastify + Prisma)
frontend/  SPA (Vite + React)
render.yaml, frontend/vercel.json   configuração de deploy
```

## Como rodar localmente

Requisitos: Node.js 20+ e npm.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run db:seed
npm run dev
```

A API sobe em `http://localhost:3333`. `npm run prisma:migrate` cria o arquivo
SQLite (`backend/dev.db`) e aplica o schema; `npm run db:seed` carrega os dados
fictícios (veja [Contas de demonstração](#contas-de-demonstração)).

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

A aplicação sobe em `http://localhost:5173` e já aponta para a API local via
`VITE_API_URL` (definido em `frontend/.env`).

## Rodando os testes

```bash
cd backend
npm test
```

Usa um banco SQLite separado e descartável (`backend/test.db`, recriado a cada
execução via `prisma migrate deploy`) — nunca toca em `dev.db`. Cobre os 5
cenários obrigatórios do desafio, entre outros:

| Cenário do desafio | Teste |
|---|---|
| 1. Duas tentativas simultâneas no mesmo horário | `tests/appointments.test.ts` → "accepts only one of two concurrent bookings..." |
| 2. Paciente acessa laudo de outro paciente | `tests/reports.test.ts` → "denies a patient access to another patient's published report" |
| 3. Paciente acessa rascunho | `tests/reports.test.ts` → "never exposes a draft report's content to the patient" |
| 4. Laudo publicado fica disponível pro paciente certo | `tests/reports.test.ts` → "makes a published report available to the owning patient" |
| 5. Agendamento no passado é rejeitado | `tests/appointments.test.ts` → "rejects scheduling in the past" |

## Contas de demonstração

Todas com a senha `Auren@123` (gerada pelo seed, sem segredo real envolvido):

| Papel | E-mail |
|---|---|
| Equipe da clínica | `equipe@auren.com` |
| Paciente | `ana.costa@auren.com` |
| Paciente | `bruno.mendes@auren.com` |
| Paciente | `clara.ribeiro@auren.com` |
| Paciente | `daniel.santos@auren.com` |

O seed também cria um agendamento ativo, um com laudo publicado, um com laudo
em rascunho e um cancelado — pra já nascer com estados variados pra explorar.

A equipe da clínica pode cadastrar novos pacientes a qualquer momento — pela
tela "Pacientes" no menu lateral, ou direto no fluxo de agendamento (atalho
"+ Cadastrar novo paciente"). O cadastro já define a senha de acesso do
paciente ao portal (`POST /api/patients`).

## Variáveis de ambiente

Exemplos sem segredos reais em `backend/.env.example` e `frontend/.env.example`.
`backend/.env.test` também está versionado de propósito — só tem um segredo
fictício (`test-only-secret-...`), pra `npm test` funcionar sem setup extra.

**Backend**

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do Prisma (`file:./dev.db` por padrão) |
| `JWT_SECRET` | Segredo de assinatura do JWT — gere um valor próprio em qualquer ambiente real |
| `PORT` | Porta da API (padrão 3333; o Render injeta a sua própria em produção) |
| `NODE_ENV` | `development` / `test` / `production` |
| `CORS_ORIGIN` | Origin exata liberada a chamar a API com cookies |

**Frontend**

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API |

## Deploy

- **Frontend → Vercel:** importar o repositório com *Root Directory* = `frontend`,
  framework Vite (auto-detectado). Definir `VITE_API_URL` apontando pra URL da
  API no Render. `frontend/vercel.json` já cuida do rewrite de SPA (rotas como
  `/agenda` não devem cair em 404 num reload).
- **Backend → Render:** `render.yaml` na raiz descreve o serviço (Blueprint).
  Alternativamente, criar manualmente um Web Service com *Root Directory* =
  `backend`, build `npm install && npm run build`, start `npm run start:render`.
  Definir `CORS_ORIGIN` com a URL publicada no Vercel depois do primeiro deploy
  do frontend.
- **Cold start do plano free do Render:** o serviço dorme após inatividade.
  `GET /api/health` existe justamente pra isso — configure um ping gratuito
  (ex.: [UptimeRobot](https://uptimerobot.com) ou [cron-job.org](https://cron-job.org),
  a cada 5–10 min) apontando pra essa rota durante o período de avaliação. Isso é
  uma conveniência pro deploy ao vivo; o caminho local acima continua sendo a
  forma oficial de rodar e avaliar o projeto.

## Decisões técnicas

- **Fuso horário:** toda a aplicação trata data/hora no fuso fixo
  `America/Sao_Paulo` (UTC−3, sem horário de verão desde 2019 no Brasil) — ver
  `backend/src/lib/timezone.ts`. A API sempre recebe/retorna o instante em UTC
  (ISO 8601) mais `date`/`time` já convertidos pro fuso da clínica, pra nunca
  depender do fuso do navegador de quem está usando.
- **Concorrência no agendamento:** a trava contra dois agendamentos no mesmo
  horário não é um "check antes de inserir" na aplicação (que teria uma janela
  de corrida) — é uma constraint `UNIQUE` no banco sobre uma coluna `slotKey`
  (o instante ISO enquanto o agendamento está ativo; vira `NULL` ao cancelar,
  liberando o horário). Duas requisições simultâneas competem pelo mesmo
  `INSERT`; o SQLite garante que só uma vence, a outra recebe `409`. É isso que
  o teste do cenário 1 verifica de verdade, com duas chamadas em paralelo.
- **SQLite em todos os ambientes, inclusive produção:** cogitei Postgres
  gerenciado no deploy, mas o Prisma 7 não permite trocar o `provider` do
  datasource por variável de ambiente — exigiria manter dois schemas e duas
  pastas de migrations. Pelo prazo do desafio, optei por manter SQLite também
  no Render, mitigando o disco efêmero com `npm run start:render`
  (`prisma migrate deploy` + reseed automático só se o banco estiver vazio) a
  cada boot — se o disco for zerado, a demo se autorrecupera sozinha em vez de
  quebrar.
- **Sala única, horário fixo:** não veio especificado no desafio, então assumi
  expediente 08:00–18:00, slots de 30 min (`backend/src/lib/clinic-config.ts`).
- **Autorização sempre no backend:** cada rota valida o papel do usuário via
  middleware (`requireRole`), e os filtros de dado (agendamento/laudo do
  paciente certo) acontecem na camada de serviço, não só na tela — testado
  diretamente contra a API nos testes automatizados, não só pela UI.
- **Rascunho de laudo some pro paciente, não só "não aparece na lista":** o
  endpoint retorna `404` tanto pra um laudo inexistente quanto pra um rascunho
  ou um laudo de outro paciente — nunca confirma a existência de algo que o
  paciente não deveria ver.

## Limitações e pendências

- O filtro de paciente na agenda da clínica é um `<select>` com os pacientes
  cadastrados (correspondência exata), não uma busca livre por nome como no
  protótipo visual — o contrato atual da API filtra por `patientId`, não por
  texto.
- Não existe uma tela de "todos os laudos" pra clínica (só o laudo vinculado a
  cada agendamento, via tela de detalhe) — o desafio pede "abrir um
  agendamento e cadastrar um laudo", que está coberto; uma listagem geral
  seria um adicional razoável, mas fora do escopo descrito.
- `publish()` não impede publicar um laudo cujo agendamento foi cancelado
  depois do laudo criado como rascunho — o desafio só proíbe *cadastrar* laudo
  em agendamento cancelado, não trata esse caso específico de edge.
- Sem rate limiting ou proteção extra contra força bruta no login — fora do
  escopo pedido ("mecanismo simples de autenticação").

## Tempo dedicado

~1h de sessão (desenvolvimento assistido por IA via Claude Code — "vibe
coding", como pedido no enunciado — cobrindo decisão de arquitetura,
modelagem, API, testes, frontend e este README). Ajuste este número conforme
o tempo real que você dedicou acompanhando e revisando a sessão, já que é essa
a métrica que o enunciado pede.
