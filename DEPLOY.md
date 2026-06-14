# Deploy na Vercel — Trackeando

## Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Repositório Git (GitHub, GitLab ou Bitbucket) com o código do projeto
- Projeto Firebase já configurado (`src/firebase/config.js`)

## 1. Enviar o código para o Git

```bash
git add .
git commit -m "Preparar deploy na Vercel"
git push
```

## 2. Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório do projeto
3. A Vercel detecta **Vite** automaticamente. Confirme:

| Campo | Valor |
|-------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

4. Clique em **Deploy**

Não é necessário configurar variáveis de ambiente — o Firebase já está em `src/firebase/config.js`.

## 3. Firebase — domínios autorizados

Após o deploy, o login pode falhar se o domínio da Vercel não estiver autorizado.

1. Abra o [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Authentication** → **Settings** → **Authorized domains**
3. Adicione:
   - `seu-projeto.vercel.app` (URL gerada pela Vercel)
   - Seu domínio customizado, se usar um

## 4. Firestore

Garanta que as regras do Firestore estão publicadas (veja `FIREBASE_RULES.txt`).

## 5. Domínio customizado (opcional)

Na Vercel: **Project** → **Settings** → **Domains** → adicione seu domínio e siga o DNS indicado.

Lembre de adicionar o domínio também no Firebase (passo 3).

## Testar localmente antes do deploy

```bash
npm run build
npm run preview
```

Acesse `http://localhost:4173` e teste login, rotas (`/my-mangas`, `/ranking`, etc.) e navegação direta pela URL.

## Arquivos de deploy

- `vercel.json` — redireciona rotas do React Router para `index.html` (evita erro 404 ao atualizar a página)
- `package.json` — script `build` gera a pasta `dist`
