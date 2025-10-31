# Fluxo de Criação de Conta Asaas para Afiliados

## Visão Geral

Quando um afiliado aceita um convite mas não possui conta Asaas (walletId), o sistema precisa criar uma nova conta para que ele possa receber suas comissões.

## Fluxo Completo

### 1. Usuário Aceita Convite
- Acessa `/activate-affiliate`
- Preenche email e token do convite
- Clica em "Aceitar Convite"

### 2. Sistema Verifica Wallet
```typescript
// Em affiliate-service.ts
- Busca dados do usuário pelo CPF/CNPJ
- Chama determineAffiliateWallet()
- Se não existe wallet → lança REQUIRES_ASAAS_ACCOUNT_CREATION
- Se usuário não tem fullName/phone → retorna erro especial
```

### 3. Exibe Formulário de Criação
```tsx
// AffiliateAcceptForm detecta o erro e muda step
if (response.message === 'REQUIRES_ASAAS_ACCOUNT_CREATION') {
  setStep('asaas-account')
  // Mostra AsaasAccountForm
}
```

### 4. Usuário Preenche Dados Asaas
O formulário `AsaasAccountForm` coleta:

**Campos Obrigatórios:**
- `name`: Nome completo (CPF) ou Razão Social (CNPJ)
- `mobilePhone`: Celular/WhatsApp
- `address`, `addressNumber`, `province`, `postalCode`: Endereço completo
- `birthDate`: Data de nascimento (apenas para CPF)
- `companyType`: Tipo de empresa (apenas para CNPJ)
  - MEI
  - LIMITED (LTDA)
  - INDIVIDUAL
  - ASSOCIATION

**Campos Opcionais:**
- `loginEmail`: Email de login (default: email principal)
- `phone`: Telefone fixo
- `site`: Website
- `incomeValue`: Renda mensal
- `complement`: Complemento do endereço

### 5. Frontend Chama API Local
```typescript
// AffiliateAcceptForm.tsx
const response = await fetch('/api/affiliate/create-asaas-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(accountData)
})
```

### 6. API Route Chama n8n
```typescript
// /api/affiliate/create-asaas-account/route.ts
const N8N_WEBHOOK_URL = process.env.N8N_ASAAS_ACCOUNT_WEBHOOK_URL

fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify(accountData)
})
```

### 7. n8n Cria Conta no Asaas

**Webhook Trigger:**
- URL: `https://primary-production-9acc.up.railway.app/webhook-test/xeco-create-asaas-account`
- Method: POST

**Payload Recebido:**
```json
{
  "name": "João da Silva",
  "email": "joao@example.com",
  "loginEmail": "joao@example.com",
  "cpfCnpj": "12345678901",
  "birthDate": "1990-05-15",
  "companyType": null,
  "phone": null,
  "mobilePhone": "11999999999",
  "site": "https://example.com",
  "incomeValue": 5000,
  "address": "Rua Fernando Orlandi",
  "addressNumber": "544",
  "complement": null,
  "province": "Jardim Pedra Branca",
  "postalCode": "14079-452"
}
```

**n8n Workflow - Passos:**

1. **Receive Webhook** (Trigger)
   - Recebe dados do payload

2. **Validate Data** (Function)
   ```javascript
   // Valida campos obrigatórios
   const { name, email, cpfCnpj, mobilePhone, address, addressNumber, province, postalCode } = $json
   
   const isCPF = cpfCnpj.replace(/\D/g, '').length === 11
   const isCNPJ = cpfCnpj.replace(/\D/g, '').length === 14
   
   // CPF precisa de birthDate
   if (isCPF && !birthDate) {
     throw new Error('birthDate obrigatório para CPF')
   }
   
   // CNPJ precisa de companyType
   if (isCNPJ && !companyType) {
     throw new Error('companyType obrigatório para CNPJ')
   }
   
   return { valid: true, data: $json }
   ```

3. **Create Asaas Account** (HTTP Request)
   ```
   Method: POST
   URL: https://api-sandbox.asaas.com/v3/accounts
   Headers:
     access_token: ${{ secrets.ASAAS_API_KEY }}
     Content-Type: application/json
   Body:
   {
     "name": "{{ $json.name }}",
     "email": "{{ $json.email }}",
     "loginEmail": "{{ $json.loginEmail }}",
     "cpfCnpj": "{{ $json.cpfCnpj }}",
     "birthDate": "{{ $json.birthDate }}",
     "companyType": "{{ $json.companyType }}",
     "phone": "{{ $json.phone }}",
     "mobilePhone": "{{ $json.mobilePhone }}",
     "site": "{{ $json.site }}",
     "incomeValue": {{ $json.incomeValue }},
     "address": "{{ $json.address }}",
     "addressNumber": "{{ $json.addressNumber }}",
     "complement": "{{ $json.complement }}",
     "province": "{{ $json.province }}",
     "postalCode": "{{ $json.postalCode }}"
   }
   ```

4. **Save to Firebase** (HTTP Request)
   ```
   Method: POST
   URL: https://firestore.googleapis.com/v1/projects/{{ $env.FIREBASE_PROJECT_ID }}/databases/(default)/documents/affiliate_asaas_accounts
   Headers:
     Authorization: Bearer {{ $env.FIREBASE_TOKEN }}
     Content-Type: application/json
   Body:
   {
     "fields": {
       "userId": { "stringValue": "{{ $json.userId }}" },
       "walletId": { "stringValue": "{{ $json.walletId }}" },
       "accountId": { "stringValue": "{{ $json.id }}" },
       "cpfCnpj": { "stringValue": "{{ $json.cpfCnpj }}" },
       "createdAt": { "timestampValue": "{{ $now.toISO() }}" }
     }
   }
   ```

5. **Return Success** (Respond to Webhook)
   ```json
   {
     "success": true,
     "walletId": "{{ $node['Create Asaas Account'].json.walletId }}",
     "accountId": "{{ $node['Create Asaas Account'].json.id }}",
     "message": "Conta Asaas criada com sucesso"
   }
   ```

6. **Error Handler** (IF node com Error Workflow)
   ```json
   {
     "success": false,
     "error": "{{ $json.error.message }}",
     "details": "{{ $json.error }}"
   }
   ```

### 8. Frontend Recebe Resposta

**Sucesso:**
```json
{
  "success": true,
  "walletId": "acct_xxxxxxxxxxxx",
  "accountId": "xxxxxxxxxxxx",
  "message": "Conta Asaas criada com sucesso"
}
```

**Erro:**
```json
{
  "success": false,
  "error": "Nome inválido",
  "details": { ... }
}
```

### 9. Frontend Reativa Convite com walletId

```typescript
// AffiliateAcceptForm.tsx
const confirmResponse = await confirmAffiliateInvitation({
  ...formData,
  walletId: data.walletId  // ← Passa o walletId criado
})
```

### 10. Affiliate Service Cria Registro
```typescript
// affiliate-service.ts
// Detecta que providedWalletId existe, pula criação
if (!providedWalletId) {
  // ... tentaria criar
} else {
  walletId = providedWalletId  // Usa o fornecido
}

// Salva afiliado com walletId
await addDoc(affiliatesRef, {
  user: userId,
  walletId: walletId,  // ✅ Preenchido
  // ... outros campos
})
```

### 11. Sucesso Final
- Afiliado cadastrado com `walletId` ✅
- Pode receber comissões ✅
- Dashboard mostra status OK ✅

## Variáveis de Ambiente

```bash
# .env.local
N8N_ASAAS_ACCOUNT_WEBHOOK_URL=https://primary-production-9acc.up.railway.app/webhook-test/xeco-create-asaas-account
```

## Tratamento de Erros

### 1. Dados Incompletos
```typescript
if (!name || !mobilePhone || !address) {
  return { success: false, error: 'Dados obrigatórios faltando' }
}
```

### 2. Erro do Asaas
```typescript
if (asaasResponse.status !== 200) {
  return {
    success: false,
    error: asaasResponse.data.errors[0].description
  }
}
```

### 3. n8n Offline
```typescript
try {
  const response = await fetch(N8N_WEBHOOK_URL)
} catch (error) {
  return {
    success: false,
    error: 'Serviço temporariamente indisponível'
  }
}
```

### 4. Frontend Mostra Sugestões
```tsx
if (!data.success) {
  // Mostra erro ao usuário
  setError(data.error)
  
  // Sugere ações:
  // - Verifique os dados
  // - Tente novamente
  // - Entre em contato com suporte
}
```

## Diagrama de Fluxo

```
┌─────────────────┐
│ Usuário aceita  │
│     convite     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Sistema verifica│
│   walletId      │
└────────┬────────┘
         │
         ▼
   ┌────────────┐
   │ Tem wallet?│
   └─────┬──────┘
         │
    ┌────┴────┐
    │ NÃO     │ SIM
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│Mostra  │ │Cria    │
│Form    │ │afiliado│
│Asaas   │ │direto  │
└───┬────┘ └────────┘
    │
    ▼
┌────────────┐
│Usuário     │
│preenche    │
│dados       │
└─────┬──────┘
      │
      ▼
┌─────────────┐
│Frontend →   │
│API Route    │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│API Route →   │
│n8n Webhook   │
└──────┬───────┘
       │
       ▼
┌───────────────┐
│n8n →          │
│Asaas API      │
└──────┬────────┘
       │
       ▼
┌───────────────┐
│Asaas retorna  │
│walletId       │
└──────┬────────┘
       │
       ▼
┌───────────────┐
│n8n →          │
│Frontend       │
└──────┬────────┘
       │
       ▼
┌───────────────┐
│Frontend →     │
│confirmInvite  │
│com walletId   │
└──────┬────────┘
       │
       ▼
┌───────────────┐
│Afiliado criado│
│com walletId ✅│
└───────────────┘
```

## Exemplo Completo

### Request n8n
```json
{
  "name": "João da Silva",
  "email": "joao@example.com",
  "loginEmail": "joao@example.com",
  "cpfCnpj": "12345678901",
  "birthDate": "1990-05-15",
  "mobilePhone": "11999999999",
  "address": "Rua Fernando Orlandi",
  "addressNumber": "544",
  "province": "Jardim Pedra Branca",
  "postalCode": "14079-452"
}
```

### Response n8n (Sucesso)
```json
{
  "success": true,
  "walletId": "acct_a1b2c3d4e5f6",
  "accountId": "cus_000012345678",
  "message": "Conta Asaas criada com sucesso"
}
```

### Response n8n (Erro)
```json
{
  "success": false,
  "error": "CPF inválido",
  "details": {
    "field": "cpfCnpj",
    "message": "CPF deve conter 11 dígitos"
  }
}
```

## Checklist de Implementação n8n

- [ ] Criar workflow "Create Asaas Account"
- [ ] Configurar webhook trigger
- [ ] Adicionar validação de dados
- [ ] Integrar com Asaas API
- [ ] Salvar em Firebase (opcional - pode ser feito no backend)
- [ ] Testar com CPF
- [ ] Testar com CNPJ
- [ ] Configurar error handling
- [ ] Adicionar logging
- [ ] Deploy e testar em produção
