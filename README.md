# Auren — Agendamento de exames e laudos

Desafio técnico: aplicação web para uma clínica agendar exames, cadastrar laudos e
disponibilizá-los para os pacientes.

Interface baseada no design system "Auren" (`Design System/`) — paleta, tipografia
(Georgia + Inter), componentes, telas de referência e identidade visual (logo e
favicon em `Design System/Auren-Logo/`), produzido com o **Codex**. Toda a
implementação (backend, frontend e testes) foi feita nesta sessão com o
**Claude Code**.

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

**Por que monorepo (e não dois repositórios separados):** a prática comum de
"clean code"/arquitetura é isolar frontend e backend em repositórios próprios
— cada um com seu ciclo de release, seu dono, seu CI, evoluindo
independentemente. Isso faz todo sentido quando são times e serviços
diferentes, com cadências de deploy diferentes. Não é o caso aqui: é uma
entrega única, de uma pessoa, onde front e back nascem, evoluem e são
avaliados juntos — e o próprio enunciado pede explicitamente "um repositório
ou arquivo compactado". Nesse contexto, monorepo ganha na prática:

- **Um clone, uma entrega.** Quem for avaliar não precisa achar, clonar e
  sincronizar dois repositórios pra ter o projeto rodando.
- **Commits atômicos.** Uma mudança de contrato na API (ex.: um campo novo no
  JSON de resposta) e o ajuste correspondente no frontend entram no mesmo
  commit — não tem risco de um repositório ficar "na frente" do outro, nem
  PR de um lado quebrando silenciosamente o outro.
- **Zero perda no deploy.** Vercel e Render suportam apontar pra uma
  subpasta (`frontend/`, `backend/`) de um monorepo normalmente — não existe
  trade-off real de infraestrutura aqui, só ganho de simplicidade.
- **Sem overhead de coordenação.** Dois repositórios exigiriam dois remotes,
  possivelmente duas pipelines de CI e versionamento cruzado (qual tag do
  backend é compatível com qual tag do frontend?) — custo real que não compra
  nada de valor num projeto de 3 dias, uma pessoa só.

Ou seja: a razão de separar em múltiplos repositórios é desacoplar o que
evolui em velocidades e por donos diferentes. Aqui não evolui — então pagar
o custo de separação sem o benefício que ela existe pra dar seria a escolha
pior, não a mais "limpa".

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

## Lighthouse

100/100/100/100 (Performance, Acessibilidade, Boas práticas, SEO) no build de
produção do frontend, auditado contra `/login` (a página de entrada):

```bash
cd frontend
npm run build
npm run preview -- --port 4173          # serve o build de produção
npx lighthouse http://localhost:4173/login --view
```

O que foi preciso ajustar pra chegar em 100 (não é só maquiagem pro número —
cada item abaixo é uma correção real):

- **`<main>` ausente na tela de login** quebrava o landmark único de
  acessibilidade — adicionado.
- **`GET /api/auth/me` respondia `401`** quando não havia sessão — e todo
  carregamento da SPA chama esse endpoint pra saber se o usuário já está
  logado, então era um `401` esperado em toda visita à tela de login,
  logado no console do navegador pelo próprio Chrome (não pelo nosso
  código). Mudamos a rota pra responder sempre `200` com `user: null`
  quando não há sessão — não é um recurso protegido sendo negado, é uma
  checagem de "quem sou eu" que pode legitimamente não ter resposta. `401`
  continua reservado pra quando uma rota protegida de verdade é chamada sem
  token.
- **Code splitting por rota** (`React.lazy`) — reduz o JS não usado em cada
  página, exceto a de login, que foi deixada fora do split de propósito: como
  é a primeira coisa que quase todo mundo vê, o round-trip extra pra buscar
  o chunk dela sob demanda prejudicava o LCP mais do que o bundle principal
  economizava.
- **`<link rel="preload">` pra logo da tela de login** — ela é o maior
  elemento visível (LCP) na primeira visita; sem o preload, o navegador só
  descobre essa imagem depois de baixar e rodar o JavaScript.
- **`meta description` e `robots.txt`** adicionados (faltavam).

Única ressalva consciente: `robots.txt` libera indexação (`Allow: /`) porque
é isso que o audit de SEO pontua como correto — num deploy real de um
portal de paciente com dados sensíveis atrás de login, o mais comum seria
bloquear indexação (`<meta name="robots" content="noindex">`), mas isso
reduziria a nota de SEO. Fica registrado como trade-off deliberado, não
como descuido.

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
| Paciente (+ 8 outros) | `<nome.sobrenome>@auren.com` — 12 pacientes no total |

O seed gera uma agenda relativa à data em que roda (não datas fixas), pra
nunca nascer desatualizada:

- **Hoje + os próximos 10 dias úteis** (fins de semana pulados): agenda bem
  preenchida (~metade dos horários do dia ocupados, variando qual metade a
  cada dia), com alguns horários livres pra demonstrar o fluxo de agendar, e
  2 agendamentos já cancelados espalhados no meio.
- **Os 5 dias úteis anteriores a hoje**: exames já realizados, todos com
  laudo. O dia útil mais recente (o "ontem") fica com laudo em rascunho; os
  anteriores, publicados — ~33 laudos no total, a maioria publicada.

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
- **Agenda em visão de dia:** separada em duas seções pra não virar uma tabela
  gigante — a lista de agendamentos do dia (curta, só o que existe de verdade)
  e, abaixo, uma grade compacta de "chips" com os horários livres (mesmo
  padrão visual do seletor de horário da tela de Agendar), cada um já levando
  pro formulário de novo agendamento com data/horário preenchidos. Os cards de
  estatística (exames agendados, horários livres, sala) seguem o design
  system. "Buscar por nome" filtra os agendamentos do dia no cliente (sem
  campo livre no contrato da API) e, enquanto ativo, esconde a grade de
  horários livres pra focar na busca.
- **Central de laudos:** lista a partir dos agendamentos (não dos laudos), pra
  mostrar também os exames que ainda não têm laudo cadastrado ("Sem laudo" →
  "Cadastrar"). Só mostra exames que já aconteceram (ou que já têm laudo,
  por garantia) — um exame futuro "sem laudo" ainda é só prematuro, não uma
  pendência real, e agendamentos cancelados ficam de fora porque não podem
  receber laudo. Cada linha mostra "Exame · Paciente" e abre o mesmo fluxo de
  edição/leitura usado a partir da Agenda.
- **Badge de situação não é só o status do agendamento:** pra clínica, um
  agendamento com laudo em rascunho mostra "Rascunho" (não "Agendado") — fica
  claro que o exame já foi realizado. Pro paciente, que nunca pode saber se
  existe rascunho, a mesma situação aparece como "Aguardando laudo",
  calculado só a partir da data do exame (que ele já vê de qualquer forma) e
  de o laudo estar publicado ou não — nunca a partir da existência do
  rascunho em si.
- **Cadastro de paciente define a senha de acesso:** sem envio de e-mail no
  escopo do desafio, a equipe da clínica define a senha provisória na hora do
  cadastro (`POST /api/patients`) e repassa pro paciente por fora do sistema.
- **Logo e favicon:** vêm de `Design System/Auren-Logo/` (variantes principal
  e negativa, kit de favicon pronto) — não foram recriados do zero.
- **Paciente não agenda o próprio exame, de propósito.** O PDF descreve
  agendar como ação da *equipe da clínica* (seção 4.1) e lista pro *paciente*
  (seção 4.3) só consultar agendamentos e ler laudos publicados — não criar
  agendamento. Cogitamos adicionar o autoagendamento como funcionalidade
  extra, mas decidimos manter fiel ao escopo literal do enunciado em vez de
  ampliar a superfície do desafio.

## Limitações e pendências

- `publish()` não impede publicar um laudo cujo agendamento foi cancelado
  depois do laudo criado como rascunho — o desafio só proíbe *cadastrar* laudo
  em agendamento cancelado, não trata esse caso específico de edge.
- Sem rate limiting ou proteção extra contra força bruta no login — fora do
  escopo pedido ("mecanismo simples de autenticação").

## Tempo dedicado

~3h de sessão com o Claude Code (desenvolvimento assistido por IA — "vibe
coding", como pedido no enunciado — cobrindo decisão de arquitetura,
modelagem, API, testes, frontend, revisões de UX contra o design system e
este README), mais ~1h à parte no Codex produzindo o design system e as
logos. Ajuste esses números conforme o tempo real que você dedicou
acompanhando e revisando as sessões, já que é essa a métrica que o enunciado
pede.
