# CoffeeMaker

Ferramenta interna para sorteio justo de:

- quem prepara o café;
- quem limpa a máquina de café.

O sistema usa rodadas independentes por tipo de sorteio, garantindo que cada colaborador seja escolhido apenas uma vez por rodada.

## Tecnologias

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- Firebase Firestore

## Configuração local

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env.local` com base em `.env.example`:

```bash
cp .env.example .env.local
```

3. Preencha as variáveis do Firebase:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

4. Execute em desenvolvimento:

```bash
npm run dev
```

## Coleções no Firestore

- `employees`
- `draws`
- `rounds`

## Regras principais

- Dois sorteios independentes: café (`coffee`) e limpeza (`clean`).
- Cada colaborador pode ser sorteado apenas uma vez por rodada.
- Ao finalizar todos os colaboradores, uma nova rodada é criada automaticamente.
- Sorteio rejeitado (ausente) não é salvo no histórico.
- Sorteio aceito é salvo em `draws` com `accepted: true`.

## Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente do Firebase na Vercel.
4. Faça o deploy.
