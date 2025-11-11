# 📚 Minha Coleção de Mangás

Uma aplicação web moderna para gerenciar sua coleção de mangás, desenvolvida com React e Firebase.

## 🚀 Funcionalidades

- **Busca de Mangás**: Integração com a Jikan API para buscar informações sobre mangás
- **Coleções**: Organize seus mangás em coleções personalizadas
- **Grupos**: Crie grupos para categorizar seus mangás
- **Gerenciamento de Volumes**: Registre quais volumes você possui, com preços e datas de compra
- **Avaliações**: Dê notas aos seus mangás favoritos
- **Estatísticas**: Acompanhe o investimento total em suas coleções e grupos
- **Autenticação**: Sistema de login e cadastro seguro com Firebase Authentication

## 🛠️ Tecnologias

- **React** - Biblioteca JavaScript para construção de interfaces
- **Firebase** - Backend como serviço (Firestore + Authentication)
- **Jikan API** - API não oficial do MyAnimeList para dados de mangás
- **React Router** - Roteamento para aplicações React
- **Vite** - Build tool moderna e rápida

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd Catalog
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative o Authentication (Email/Password)
   - Crie um banco de dados Firestore
   - Copie as credenciais do Firebase
   - Edite `src/firebase/config.js` e substitua as credenciais

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🔧 Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative o **Authentication**:
   - Vá em Authentication > Sign-in method
   - Ative "Email/Password"
4. Crie um banco de dados **Firestore**:
   - Vá em Firestore Database
   - Crie o banco em modo de produção ou teste
   - Configure as regras de segurança (veja abaixo)
5. Copie as credenciais do projeto:
   - Vá em Project Settings > General
   - Role até "Your apps" e copie as credenciais
   - Cole em `src/firebase/config.js`

### Regras do Firestore

Configure as regras do Firestore para permitir que usuários leiam e escrevam apenas seus próprios dados:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.jsx      # Layout principal
│   ├── MangaCard.jsx   # Card de exibição de mangá
│   └── ...
├── contexts/           # Contextos React
│   └── AuthContext.jsx # Contexto de autenticação
├── firebase/           # Configuração do Firebase
│   └── config.js
├── pages/              # Páginas da aplicação
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── SearchManga.jsx
│   └── ...
├── services/           # Serviços e APIs
│   ├── firestoreService.js
│   └── mangaApi.js
└── App.jsx             # Componente principal
```

## 🎯 Como Usar

1. **Cadastre-se**: Crie uma conta com email e senha
2. **Busque Mangás**: Use a barra de busca para encontrar mangás na API
3. **Adicione à Coleção**: Clique em "Adicionar à Coleção" e preencha os detalhes
4. **Organize**: Crie coleções e grupos para organizar seus mangás
5. **Registre Volumes**: Marque quais volumes você possui, com preços e datas
6. **Acompanhe**: Veja estatísticas e custos totais no dashboard

## 📝 Estrutura de Dados

### Coleção
- `name`: Nome da coleção
- `description`: Descrição (opcional)
- `userId`: ID do usuário
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

### Grupo
- `name`: Nome do grupo
- `description`: Descrição (opcional)
- `userId`: ID do usuário
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

### Mangá na Coleção
- `mangaId`: ID do mangá na API
- `title`: Título do mangá
- `titleEnglish`: Título em inglês
- `imageUrl`: URL da imagem
- `collectionId`: ID da coleção (opcional)
- `groupId`: ID do grupo (opcional)
- `rating`: Nota do usuário (0-10)
- `notes`: Observações
- `volumes`: Array de volumes
  - `volumeNumber`: Número do volume
  - `owned`: Se possui o volume
  - `price`: Preço pago
  - `purchaseDate`: Data da compra
- `userId`: ID do usuário
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

## 🚀 Deploy

Para fazer deploy no Firebase Hosting:

```bash
npm run build
firebase init hosting
firebase deploy
```

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
