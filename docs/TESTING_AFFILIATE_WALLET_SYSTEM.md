# 🧪 Guia de Testes - Sistema de Afiliados com Wallet Management

## 📋 Pré-requisitos

1. ✅ Servidor dev rodando: `npm run dev`
2. ✅ Firebase configurado (.env.local com credenciais)
3. ✅ Pelo menos 1 empresa ativa no Firestore
4. ✅ Usuário de teste com CPF/CNPJ cadastrado

---

## 🎯 Cenários de Teste

### **Cenário 1: Afiliado SEM empresa própria (conta pessoal nova)**

Este é o caso mais simples - afiliado não tem franquia.

#### **Passo a Passo:**

```bash
# 1. Crie o convite de teste
node scripts/create-test-affiliate-invite.js

# 2. Copie o link gerado (exemplo):
# http://localhost:3000/affiliate/accept?token=abc123...
```

#### **3. Abra o link no navegador**

**Estado esperado: NÃO LOGADO**
- ✅ Deve mostrar tela de login
- ✅ Botões "Fazer Login" e "Criar Conta"
- ✅ Detalhes do convite visíveis

**4. Faça login com usuário SEM empresa**
```
Email: teste@email.com
Senha: sua-senha
```

**5. Clique em "Aceitar Convite"**

**Estado esperado: PROCESSANDO**
- ✅ Botão muda para "Aceitando convite..."
- ✅ Loading spinner aparece

**Estado esperado: SUCESSO**
- ✅ Tela de parabéns aparece
- 🟩 **Box VERDE**: "Conta Pessoal Ativa"
- ✅ Mensagem: "Suas comissões serão depositadas na sua conta pessoal Asaas"
- ✅ Informações da parceria mostradas
- ✅ Botão "Ir para Painel de Afiliado"

**6. Clique em "Ir para Painel de Afiliado"**

**Estado esperado: DASHBOARD**
- ✅ Redireciona para `/perfil?tab=afiliacao`
- ✅ Card da empresa aparece
- ✅ Código do cupom visível
- ✅ Estatísticas zeradas (0 vendas)
- ❌ **NÃO deve ter aviso amarelo** (wallet não é compartilhada)

---

### **Cenário 2: Afiliado QUE JÁ TEM empresa (wallet compartilhada)**

Este é o caso crítico que o sistema foi feito para resolver!

#### **Preparação:**

```javascript
// No Firebase Console, verifique:
// 1. Empresa X tem:
//    - walletId: "wallet-abc-123"
//    - document_number: "12345678900" (CPF do dono)

// 2. Usuário Y (que vai aceitar convite):
//    - document_number: "12345678900" (MESMO CPF da empresa X!)
```

#### **Teste:**

**1. Crie convite para empresa DIFERENTE da que o usuário possui**
```bash
node scripts/create-test-affiliate-invite.js
# Isso vai criar convite para empresa A
```

**2. Abra link e faça login com usuário que é DONO da empresa B**
- Importante: Empresa B tem o MESMO CPF/CNPJ do usuário
- Mas o convite é para ser afiliado da empresa A

**3. Aceite o convite**

**Estado esperado: SUCESSO COM AVISO**
- ✅ Tela de parabéns aparece
- 🟨 **Box AMARELO**: "Conta Compartilhada com Franquia"
- ✅ Mensagem: "Suas comissões desta afiliação estão sendo depositadas na conta digital da sua franquia **[Nome da Empresa B]**"
- ✅ Explicação sobre limitação da Asaas
- ✅ Orientação para verificar extrato da empresa

**4. Vá para o dashboard**

**Estado esperado: AVISO PERMANENTE**
- ✅ Card da afiliação aparece
- 🟨 **Box AMARELO permanente** no topo do card
- ✅ Texto: "Conta Compartilhada com Franquia"
- ✅ Mostra nome da empresa própria
- ✅ Instrução para verificar extrato

---

### **Cenário 3: Convite Inválido/Expirado**

#### **Teste 1: Token inválido**
```bash
# Abra URL com token falso
http://localhost:3000/affiliate/accept?token=token-invalido-123
```

**Estado esperado:**
- ❌ Ícone de erro vermelho
- ❌ Mensagem: "Convite não encontrado"
- ✅ Botão "Voltar ao Início"

#### **Teste 2: Convite já usado**
```bash
# 1. Aceite um convite normalmente
# 2. Tente abrir o mesmo link novamente
```

**Estado esperado:**
- ❌ Mensagem: "Convite já foi utilizado"

#### **Teste 3: Convite expirado**
```javascript
// No Firestore, edite o convite:
{
  expiresAt: Timestamp do passado
}
```

**Estado esperado:**
- ❌ Mensagem: "Convite expirado"

---

### **Cenário 4: Validação de Dados**

#### **Teste 1: Usuário sem CPF cadastrado**

**Preparação:**
```javascript
// No Firestore, usuário sem document_number:
{
  email: "sem-cpf@email.com",
  fullName: "Usuário Teste",
  // document_number: undefined ❌
}
```

**Estado esperado:**
- ❌ Erro: "Usuário não possui CPF/CNPJ cadastrado. Por favor, complete seu perfil antes de aceitar o convite."

#### **Teste 2: Usuário sem nome completo**
```javascript
{
  email: "sem-nome@email.com",
  document_number: "12345678900",
  // fullName: undefined ❌
}
```

**Estado esperado:**
- ❌ Erro: "Dados incompletos. Por favor, complete seu perfil (nome completo e email) antes de aceitar o convite."

---

## 🔍 Verificação no Firestore

### **Após aceitar convite com sucesso:**

#### **1. Collection: `affiliated`**
```javascript
{
  id: "aff_abc123",
  user: "userId_123",
  company_relationed: "companyId_xyz",
  walletId: "wallet-id-aqui",
  walletSource: "personal" | "company", // ← VERIFICAR
  ownCompanyId: "companyId_do_afiliado" | undefined, // ← SE wallet compartilhada
  commissionRate: 10,
  active: true,
  email: "afiliado@email.com",
  name: "Nome do Afiliado",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Validações:**
- ✅ `walletSource` deve ser "personal" OU "company"
- ✅ Se `walletSource === "company"`, `ownCompanyId` DEVE existir
- ✅ `walletId` deve corresponder ao da empresa própria se compartilhado

#### **2. Collection: `affiliate_invitations`**
```javascript
{
  status: "ACCEPTED", // ← Mudou de PENDING
  acceptedAt: Timestamp, // ← Novo campo
  acceptedBy: "userId_123", // ← Novo campo
  affiliatedId: "aff_abc123" // ← Novo campo
}
```

#### **3. Collection: `affiliate_asaas_accounts` (se conta nova criada)**
```javascript
{
  userId: "userId_123",
  walletId: "wallet-novo-123",
  accountId: "asaas-account-id",
  cpfCnpj: "12345678900",
  createdAt: Timestamp
}
```

---

## 🛠️ Testes de API Diretamente

### **Teste 1: Validar Convite**
```bash
# Substitua TOKEN_AQUI pelo token real
curl http://localhost:3000/api/affiliate/validate-invite?token=TOKEN_AQUI
```

**Resposta esperada (sucesso):**
```json
{
  "storeId": "comp_123",
  "storeName": "Loja Teste",
  "storeOwnerName": "João Silva",
  "commissionRate": 10,
  "message": "Seja nosso afiliado!",
  "expiresAt": "2025-11-30T00:00:00.000Z",
  "recipientEmail": "teste@email.com"
}
```

**Resposta esperada (erro):**
```json
{
  "error": "Convite não encontrado"
}
```

### **Teste 2: Aceitar Convite**
```bash
curl -X POST http://localhost:3000/api/affiliate/accept-invite \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_AQUI",
    "userId": "USER_ID_AQUI"
  }'
```

**Resposta esperada (sucesso - wallet pessoal):**
```json
{
  "success": true,
  "affiliateId": "aff_abc123",
  "walletSource": "personal",
  "companyName": null,
  "message": "Suas comissões serão depositadas na sua conta pessoal Asaas"
}
```

**Resposta esperada (sucesso - wallet compartilhada):**
```json
{
  "success": true,
  "affiliateId": "aff_abc123",
  "walletSource": "company",
  "companyName": "Minha Franquia XPTO",
  "message": "Suas comissões serão depositadas na conta da sua franquia \"Minha Franquia XPTO\""
}
```

---

## 🧪 Teste do ExternalReference no Checkout

### **Cenário: Compra com cupom de afiliado**

**1. Crie um cupom para o afiliado:**
```javascript
// Firestore → coupons
{
  code: "AFIL10",
  affiliateId: "aff_abc123",
  discountPercentage: 10,
  isActive: true,
  expiresAt: Timestamp futuro
}
```

**2. Faça uma compra usando o cupom:**
- Adicione produtos ao carrinho
- Aplique cupom "AFIL10"
- Finalize checkout

**3. Inspecione o payload enviado ao N8N:**

Procure nos logs do servidor por:
```
🏷️ ExternalReference com dados de afiliado:
```

Você deve ver algo como:
```json
"{\"type\":\"AFFILIATE_COMMISSION\",\"affiliateId\":\"aff_abc123\",\"companyId\":\"comp_xyz\",\"couponCode\":\"AFIL10\",\"orderId\":\"order-123\",\"commissionRate\":10,\"commissionValue\":15.50}"
```

**4. Parse manual para validar:**
```javascript
const ref = '{"type":"AFFILIATE_COMMISSION",...}'
const parsed = JSON.parse(ref)

console.log(parsed.type) // "AFFILIATE_COMMISSION"
console.log(parsed.affiliateId) // "aff_abc123"
console.log(parsed.commissionValue) // 15.50
```

---

## 📊 Checklist de Validação

### **Interface:**
- [ ] Tela de loading aparece ao validar token
- [ ] Erro mostrado se token inválido
- [ ] Login/Cadastro aparecem se não autenticado
- [ ] Detalhes do convite visíveis
- [ ] Botão aceitar funciona
- [ ] Box verde OU amarelo aparece conforme caso
- [ ] Dashboard mostra afiliação corretamente
- [ ] Aviso amarelo permanente se wallet compartilhada

### **Dados:**
- [ ] Registro criado em `affiliated`
- [ ] Campo `walletSource` preenchido corretamente
- [ ] Campo `ownCompanyId` presente se necessário
- [ ] Convite marcado como ACCEPTED
- [ ] Conta Asaas criada se necessário (verificar logs)

### **Lógica:**
- [ ] Detecta empresa do afiliado por CPF/CNPJ
- [ ] Reutiliza wallet se empresa existe
- [ ] Cria nova conta se não existe
- [ ] Validações de dados funcionam
- [ ] ExternalReference contém dados corretos

### **ExternalReference:**
- [ ] Venda SEM afiliado: externalReference = orderId simples
- [ ] Venda COM afiliado: externalReference = JSON com metadados
- [ ] JSON parseável e válido
- [ ] Valores de comissão corretos

---

## 🐛 Troubleshooting

### **Problema: "Cannot find module firebase-admin"**
```bash
npm install firebase-admin
```

### **Problema: Convite não aparece no Firestore**
- Verifique credenciais do Firebase no .env.local
- Rode o script com: `node --trace-warnings scripts/create-test-affiliate-invite.js`

### **Problema: "Usuário não possui CPF cadastrado"**
```javascript
// Atualize o usuário no Firestore:
{
  document_number: "12345678900",
  fullName: "Nome Completo",
  email: "email@teste.com"
}
```

### **Problema: Wallet não é detectada**
- Verifique se empresa tem `walletId` ou `asaasWalletId`
- Verifique se `document_number` da empresa === do usuário
- Confira logs do servidor: `🔍 Verificando wallet existente para documento...`

### **Problema: ExternalReference vazio**
- Verifique se cupom tem `affiliateId`
- Confira se splits.affiliateAmount > 0
- Veja logs: `💰 Calculando splits...`

---

## 📸 Screenshots Esperados

### **1. Tela de Aceitação (Não Logado):**
```
┌────────────────────────────────┐
│   🎁                           │
│   Convite de Afiliado          │
│                                │
│ Detalhes do Convite:           │
│ Empresa: Loja ABC              │
│ Comissão: 10%                  │
│                                │
│ [  Fazer Login  ]              │
│ [  Criar Conta  ]              │
└────────────────────────────────┘
```

### **2. Tela de Sucesso (Wallet Pessoal):**
```
┌────────────────────────────────┐
│  🎉 PARABÉNS! 🎉               │
│  Você agora é um afiliado!     │
│                                │
│  ✅ Conta Pessoal Ativa        │
│  Suas comissões serão          │
│  depositadas na sua conta      │
│  pessoal Asaas.                │
│                                │
│  📊 Informações da Parceria    │
│  Empresa: Loja ABC             │
│  Comissão: 10%                 │
│                                │
│  [ Ir para Painel de Afiliado ]│
└────────────────────────────────┘
```

### **3. Tela de Sucesso (Wallet Compartilhada):**
```
┌────────────────────────────────┐
│  🎉 PARABÉNS! 🎉               │
│  Você agora é um afiliado!     │
│                                │
│  ⚠️ Conta Compartilhada        │
│  Suas comissões serão          │
│  depositadas na conta da sua   │
│  franquia "Minha Loja".        │
│  💰 Verifique o extrato da     │
│  sua empresa.                  │
│                                │
│  [ Ir para Painel de Afiliado ]│
└────────────────────────────────┘
```

---

## ✅ Critérios de Sucesso

Teste passou se:
1. ✅ Todos os 4 cenários funcionam corretamente
2. ✅ Avisos corretos aparecem (verde vs amarelo)
3. ✅ Dados salvos corretamente no Firestore
4. ✅ ExternalReference contém dados quando tem afiliado
5. ✅ Dashboard mostra aviso permanente quando necessário

---

**Última atualização:** 30/10/2025  
**Versão:** 1.0
