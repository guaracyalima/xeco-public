# Configuração do Google OAuth no Firebase

## ✅ Implementação Concluída

O login social com Google foi implementado com sucesso no sistema Xeco Public. 

### Arquivos Modificados

1. **`/src/lib/firebase.ts`**
   - Adicionado `GoogleAuthProvider` do Firebase Auth
   - Exportado `googleProvider` configurado com `prompt: 'select_account'`

2. **`/src/app/login/page.tsx`**
   - Adicionada função `handleGoogleSignIn()` com:
     - Login via popup do Google
     - Criação automática de perfil no Firestore (se novo usuário)
     - Redirecionamento para URL de retorno
     - Tratamento de erros completo
   - Adicionado botão "Continuar com Google" com o logo oficial
   - Adicionado divisor visual "Ou continue com e-mail"

### Funcionalidades Implementadas

✅ Login com popup do Google  
✅ Criação automática de perfil no Firestore para novos usuários  
✅ Reutilização de perfil existente para usuários recorrentes  
✅ Redirecionamento para página de retorno após login  
✅ Suporte a ações pendentes (ex: adicionar favorito)  
✅ Logging completo para debug  
✅ Tratamento de erros robusto  
✅ UI responsiva com logo oficial do Google  

---

## 🔧 Configuração Necessária no Firebase Console

Para que o login com Google funcione em produção, você precisa configurá-lo no Firebase Console:

### Passo 1: Acessar Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto (Xeco Public)

### Passo 2: Habilitar Google Sign-In

1. No menu lateral, clique em **"Authentication"** (Autenticação)
2. Clique na aba **"Sign-in method"** (Método de login)
3. Encontre **"Google"** na lista de provedores
4. Clique em **"Google"** para editar
5. Ative o toggle **"Enable"** (Ativar)
6. Configure:
   - **Nome público do projeto**: "Xeco" (ou o nome que preferir)
   - **Email de suporte**: seu email de contato
7. Clique em **"Save"** (Salvar)

### Passo 3: Configurar Domínios Autorizados

1. Ainda em **Authentication > Sign-in method**
2. Role até **"Authorized domains"** (Domínios autorizados)
3. Verifique se os seguintes domínios estão na lista:
   - `localhost` (para desenvolvimento)
   - Seu domínio de produção (ex: `xeco.com.br`)
4. Se precisar adicionar um domínio:
   - Clique em **"Add domain"**
   - Digite o domínio (sem https://)
   - Clique em **"Add"**

### Passo 4: Obter Client ID (Opcional - Para Configurações Avançadas)

Se você quiser personalizar o OAuth ou usar em outras plataformas:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto do Firebase
3. Vá em **"APIs & Services" > "Credentials"**
4. Você verá os **OAuth 2.0 Client IDs** criados automaticamente pelo Firebase
5. Aqui você pode:
   - Adicionar origens JavaScript autorizadas
   - Adicionar URIs de redirecionamento autorizados
   - Obter o Client ID e Client Secret

---

## 🧪 Testando o Login com Google

### Ambiente de Desenvolvimento (localhost)

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:3000/login`

3. Clique no botão **"Continuar com Google"**

4. Selecione uma conta Google no popup

5. Verifique:
   - ✅ Popup do Google abre corretamente
   - ✅ Após selecionar conta, popup fecha
   - ✅ Redirecionamento para página inicial (ou returnUrl)
   - ✅ Ícone de perfil no header mostra que está logado
   - ✅ No console do navegador, veja os logs:
     ```
     🔵 Iniciando login com Google...
     ✅ Login com Google bem-sucedido: email@example.com
     📝 Criando novo perfil de usuário no Firestore... (se novo usuário)
     ✅ Perfil criado com sucesso
     🔄 Redirecionando para: /
     ```

6. Verifique no Firestore:
   - Acesse Firebase Console > Firestore Database
   - Collection `users`
   - Deve haver um documento com o UID do usuário Google
   - Campos preenchidos:
     - `email`: email da conta Google
     - `display_name`: nome da conta Google
     - `photo_url`: foto de perfil do Google
     - `completed_profile`: "NAO" (usuário pode completar depois)

### Ambiente de Produção

1. Faça deploy da aplicação para produção

2. Certifique-se de que o domínio de produção está em **Authorized domains**

3. Acesse `https://seudominio.com/login`

4. Teste o fluxo completo de login com Google

---

## 🐛 Troubleshooting

### Erro: "This app is not yet verified by Google"

**Causa**: Google mostra este aviso para apps OAuth que ainda não foram verificados.

**Solução**:
- Para desenvolvimento/teste: Clique em "Advanced" > "Go to [App Name] (unsafe)"
- Para produção: [Solicite verificação do app no Google Cloud Console](https://support.google.com/cloud/answer/7454865)

### Erro: "popup_closed_by_user"

**Causa**: Usuário fechou o popup antes de completar o login.

**Solução**: Normal, não requer ação. Usuário pode tentar novamente.

### Erro: "auth/unauthorized-domain"

**Causa**: Domínio não está na lista de domínios autorizados.

**Solução**: 
1. Adicione o domínio em Firebase Console > Authentication > Settings > Authorized domains
2. Para domínios personalizados, pode levar alguns minutos para propagar

### Erro: "auth/popup-blocked"

**Causa**: Navegador bloqueou o popup.

**Solução**: 
- Instrua o usuário a permitir popups para o site
- Alternativa: Implementar `signInWithRedirect` em vez de `signInWithPopup` (requer mudança no código)

### Erro: Perfil não é criado no Firestore

**Causa**: Permissões do Firestore podem estar bloqueando a escrita.

**Solução**:
1. Verifique as regras do Firestore:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && request.auth.uid == userId;
         allow update: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

---

## 📱 Responsividade

O botão do Google foi desenvolvido para ser totalmente responsivo:

- **Mobile**: Botão ocupa largura total, ícone e texto centralizados
- **Desktop**: Botão com largura controlada, hover effects suaves
- **Tablet**: Adapta-se automaticamente

---

## 🎨 Design

O botão segue as diretrizes oficiais do Google:

- Logo oficial com cores corretas (azul, verde, amarelo, vermelho)
- Texto "Continuar com Google" (padrão do Google)
- Fundo branco com borda cinza
- Hover state com fundo cinza claro
- Disabled state com opacidade reduzida

---

## 🔐 Segurança

- **OAuth 2.0**: Protocolo seguro de autenticação
- **Popup isolado**: Credenciais nunca passam pelo seu app
- **Token seguro**: Firebase gera token JWT automaticamente
- **Domínios autorizados**: Apenas domínios aprovados podem usar o OAuth
- **HTTPS obrigatório**: Produção requer HTTPS (localhost não precisa)

---

## 📊 Analytics (Futuro)

Para rastrear conversão de login com Google, adicione eventos analytics:

```typescript
// Em handleGoogleSignIn, após login bem-sucedido:
logEvent(analytics, 'login', {
  method: 'google'
})

// Para novo usuário:
logEvent(analytics, 'sign_up', {
  method: 'google'
})
```

---

## 🚀 Próximos Passos Sugeridos

1. **Verificar app no Google Cloud Console** (para produção)
2. **Adicionar Apple Sign-In** (para usuários iOS)
3. **Adicionar Facebook Login** (se relevante para o público)
4. **Implementar One-Tap Sign-In** (login com um clique, sem popup)
5. **Adicionar Google Sign-In Button oficial** (SDK do Google)

---

## 📚 Referências

- [Firebase Authentication - Google](https://firebase.google.com/docs/auth/web/google-signin)
- [Google Sign-In Branding Guidelines](https://developers.google.com/identity/branding-guidelines)
- [Firebase Authentication Best Practices](https://firebase.google.com/docs/auth/web/best-practices)

---

## ✅ Checklist de Implementação

- [x] Importar `GoogleAuthProvider` e `signInWithPopup` do Firebase Auth
- [x] Criar e exportar `googleProvider` em firebase.ts
- [x] Implementar função `handleGoogleSignIn` na página de login
- [x] Adicionar botão "Continuar com Google" na UI
- [x] Adicionar logo oficial do Google no botão
- [x] Implementar criação automática de perfil no Firestore
- [x] Adicionar verificação de perfil existente
- [x] Implementar redirecionamento após login
- [x] Adicionar tratamento de erros
- [x] Adicionar logging para debug
- [x] Testar em ambiente de desenvolvimento
- [ ] Configurar Google Sign-In no Firebase Console (VOCÊ PRECISA FAZER)
- [ ] Adicionar domínio de produção aos domínios autorizados
- [ ] Testar em produção
- [ ] Solicitar verificação do app no Google (para produção)

---

**Data de Implementação**: 2025-06-XX  
**Desenvolvedor**: GitHub Copilot  
**Status**: ✅ Código Implementado - ⏳ Aguardando Configuração Firebase Console
