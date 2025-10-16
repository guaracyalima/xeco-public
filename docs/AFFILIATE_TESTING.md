# Teste do Sistema de Afiliados

## 🧪 Como Testar

### 1. Criar um Convite de Teste no Firestore

Adicione este documento na collection `affiliate_invitations`:

```json
{
  "email": "teste@exemplo.com",
  "emailSentId": "pending",
  "expiresAt": "2025-10-25T23:52:16-03:00",
  "inviteToken": "8a144e6655db30822b555d93800198ba0633049646248513672d29d85c07adbd",
  "inviteUrl": "http://localhost:3000/affiliate/accept?token=8a144e6655db30822b555d93800198ba0633049646248513672d29d85c07adbd",
  "message": "Bem-vindo ao nosso programa de afiliados!",
  "recipientName": "Usuário Teste",
  "resentCount": 0,
  "status": "PENDING",
  "storeId": "store-123",
  "storeName": "Marina Biquínis",
  "storeOwnerName": "Admin"
}
```

### 2. Testar o Fluxo

1. **Acesse a URL do convite:**
   ```
   http://localhost:3000/affiliate/accept?token=8a144e6655db30822b555d93800198ba0633049646248513672d29d85c07adbd
   ```

2. **Digite o email:** `teste@exemplo.com`

3. **Clique em "Aceitar Convite"**

### 3. Verificar Resultados

Após aceitar o convite, verifique:

#### ✅ Firebase Auth
- Novo usuário criado com email `teste@exemplo.com`
- Senha: `Mudar123#`

#### ✅ Collection `users`
- Documento criado com `requiresPasswordChange: true`

#### ✅ Collection `affiliated`
- Novo registro com:
  - `user`: ID do usuário criado
  - `invite_code`: Código único gerado (8 caracteres)
  - `active`: "SIM"
  - `company_relationed`: "store-123"
  - `email`: "teste@exemplo.com"

#### ✅ Collection `affiliate_invitations`
- Status alterado para "ACCEPTED"
- Campo `acceptedAt` adicionado

### 4. Casos de Teste

#### ✅ Convite Válido
- Token correto + Email correto = Sucesso

#### ❌ Token Inválido
- Token inexistente = Erro "Token ou email inválido"

#### ❌ Email Incorreto
- Token correto + Email diferente = Erro "Token ou email inválido"

#### ❌ Convite Expirado
- Data `expiresAt` no passado = Erro "Este convite expirou"

#### ❌ Convite Já Usado
- Status "ACCEPTED" = Erro "Este convite já foi utilizado"

#### ❌ Afiliado Duplicado
- Mesmo email já é afiliado da mesma loja = Erro "Este email já está cadastrado como afiliado"

### 5. URLs de Teste

#### Página Principal
```
http://localhost:3000/affiliate/accept
```

#### Com Token Pre-preenchido
```
http://localhost:3000/affiliate/accept?token=8a144e6655db30822b555d93800198ba0633049646248513672d29d85c07adbd
```

### 6. Dados para Múltiplos Testes

Crie convites com diferentes status para testar todos os cenários:

```json
// Convite Válido
{
  "email": "valido@teste.com",
  "inviteToken": "token_valido_123",
  "status": "PENDING",
  "expiresAt": "2025-12-31T23:59:59-03:00",
  "storeId": "store-123",
  "storeName": "Loja Teste"
}

// Convite Expirado
{
  "email": "expirado@teste.com", 
  "inviteToken": "token_expirado_123",
  "status": "PENDING",
  "expiresAt": "2025-01-01T00:00:00-03:00",
  "storeId": "store-123",
  "storeName": "Loja Teste"
}

// Convite Já Aceito
{
  "email": "aceito@teste.com",
  "inviteToken": "token_aceito_123", 
  "status": "ACCEPTED",
  "expiresAt": "2025-12-31T23:59:59-03:00",
  "storeId": "store-123",
  "storeName": "Loja Teste"
}
```

### 7. Verificação Manual

Após cada teste, verifique manualmente:

1. **Console do Navegador** - Logs de erro/sucesso
2. **Firebase Console** - Novos documentos criados
3. **Firestore Rules** - Permissões funcionando
4. **Email** - Funcionalidade de reset de senha (se configurada)

### 8. Limpeza Após Testes

Para refazer os testes:

1. Delete o documento do `affiliated` criado
2. Delete o usuário do Firebase Auth
3. Delete o documento da collection `users`
4. Restaure o status do convite para "PENDING"

Isso permite retestar o mesmo convite múltiplas vezes.