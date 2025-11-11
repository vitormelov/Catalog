# 🔥 Configuração do Firebase

Siga estes passos para configurar o Firebase no seu projeto:

## 1. Criar Projeto no Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite um nome para o projeto (ex: "minha-colecao-mangas")
4. Siga as instruções para criar o projeto

## 2. Configurar Authentication

1. No menu lateral, clique em **Authentication**
2. Clique em **Começar**
3. Vá na aba **Sign-in method**
4. Clique em **Email/Password**
5. Ative a opção e clique em **Salvar**

## 3. Configurar Firestore Database

1. No menu lateral, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Começar no modo de teste** (para desenvolvimento)
4. Escolha uma localização (ex: us-central)
5. Clique em **Ativar**

### Configurar Regras de Segurança

1. Vá em **Firestore Database** > **Regras**
2. Substitua as regras por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function para verificar se o documento pertence ao usuário
    function isOwner() {
      return request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    function isCreatingOwner() {
      return request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Regras para coleções
    match /collections/{collectionId} {
      // Permitir leitura se o documento pertence ao usuário
      allow read: if request.auth != null && isOwner();
      // Permitir escrita se o documento pertence ao usuário
      allow update, delete: if request.auth != null && isOwner();
      // Permitir criação se o userId no documento corresponde ao usuário autenticado
      allow create: if isCreatingOwner();
    }
    
    // Regras para grupos (dentro de coleções)
    match /groups/{groupId} {
      allow read: if request.auth != null && isOwner();
      allow update, delete: if request.auth != null && isOwner();
      allow create: if isCreatingOwner();
    }
    
    // Regras para mangás (dentro de grupos)
    match /mangaCollection/{mangaId} {
      allow read: if request.auth != null && isOwner();
      allow update, delete: if request.auth != null && isOwner();
      allow create: if isCreatingOwner();
    }
  }
}
```

**IMPORTANTE:** Essas regras verificam o `userId` em cada documento. Para que as queries funcionem, você DEVE sempre usar `where('userId', '==', userId)` nas suas queries. O Firestore verifica cada documento retornado pela query contra essas regras.

Se ainda tiver problemas, use temporariamente estas regras mais permissivas (apenas para desenvolvimento):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **ATENÇÃO:** As regras acima permitem que qualquer usuário autenticado leia/escreva qualquer documento. Use apenas para testar e depois volte para as regras seguras acima.

**IMPORTANTE:** Copie essas regras exatamente como estão acima e cole no Firebase Console. A verificação `resource == null` permite que queries funcionem, mas como você sempre usa `where('userId', '==', userId)` nas queries, apenas documentos do usuário autenticado serão retornados.

**Nota:** Se você receber um erro sobre índices compostos ao criar coleções, o Firestore pode solicitar a criação de um índice. Clique no link do erro para criar o índice automaticamente, ou crie manualmente em **Firestore Database** > **Índices**.

3. Clique em **Publicar**

## 4. Obter Credenciais do Firebase

1. No menu lateral, clique no ícone de engrenagem ⚙️ > **Configurações do projeto**
2. Role até a seção **Seus apps**
3. Se não houver um app web, clique no ícone `</>` para adicionar
4. Digite um nome para o app (ex: "web-app")
5. Copie as credenciais que aparecem

## 5. Configurar no Projeto

1. Abra o arquivo `src/firebase/config.js`
2. Substitua as credenciais:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## 6. Testar a Configuração

1. Execute `npm run dev`
2. Tente criar uma conta
3. Se funcionar, a configuração está correta!

## ⚠️ Importante

- **Nunca** commite as credenciais do Firebase no Git
- O arquivo `src/firebase/config.js` já está no `.gitignore`
- Para produção, considere usar variáveis de ambiente

## 🚀 Próximos Passos

Após configurar o Firebase, você pode:
- Criar sua primeira conta
- Buscar mangás
- Criar coleções e grupos
- Adicionar mangás à sua coleção

