# 📊 DIAGRAMA - Fluxo de Vendas de Afiliados (CORRETO)

## 🔴 ANTES (Problemático)

```
┌──────────────────┐
│ Cliente no Site  │
└────────┬─────────┘
         │
         │ 1. Aplica cupom AFIL10
         ▼
┌────────────────────────────┐
│ CheckoutButton.tsx         │
│                            │
│ ❌ createAffiliateSale()   │ ← Chamado ANTES do checkout
│    - orderId: ''           │   (ERRO: orderId vazio!)
│    - clickId: undefined    │   (ERRO: Firestore rejeita)
│                            │
│ Collection: affiliate_sales│ ← Collection que NÃO EXISTE
└────────┬───────────────────┘
         │
         │ 2. startCheckout()
         ▼
┌────────────────────────────┐
│ Webhook N8N                │
│                            │
│ ❌ Não registra afiliado   │
│ ❌ Cria apenas em 'sales'  │
│    mas SEM affiliateId     │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Firestore                  │
│                            │
│ Collection: affiliate_sales│
│  ❌ Doc com orderId vazio  │
│                            │
│ Collection: sales          │
│  ❌ Sem affiliateId        │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ MyAffiliationTab           │
│                            │
│ getAffiliateSales()        │
│ ❌ Busca affiliate_sales   │
│ ❌ Retorna vazio           │
│                            │
│ UI: "Nenhuma venda" 🔴     │
└────────────────────────────┘
```

---

## ✅ DEPOIS (Correto)

```
┌──────────────────┐
│ Cliente no Site  │
└────────┬─────────┘
         │
         │ 1. Aplica cupom AFIL10
         ▼
┌─────────────────────────────────────────────────┐
│ CheckoutButton.tsx                              │
│                                                 │
│ ✅ NÃO cria affiliate sale aqui                 │
│                                                 │
│ startCheckout(userData, discount)               │
│   │                                             │
│   └─> Monta externalReference:                 │
│       {                                         │
│         type: "AFFILIATE_COMMISSION",           │
│         affiliateId: "abc123",                  │
│         couponCode: "AFIL10",                   │
│         commissionValue: 15.50                  │
│       }                                         │
└────────┬────────────────────────────────────────┘
         │
         │ 2. POST /n8n-webhook
         ▼
┌─────────────────────────────────────────────────┐
│ N8N Webhook                                     │
│                                                 │
│ Node "16. Prepare Analytics"                    │
│ ✅ Parseia externalReference                    │
│ ✅ Extrai affiliateId                           │
│ ✅ Extrai couponCode                            │
│                                                 │
│ Node "17. Create Sale Analytics"                │
│ ✅ Cria registro em 'sales' com:                │
│    - affiliateId: "abc123" ✅                   │
│    - affiliateCouponCode: "AFIL10" ✅           │
│    - hasAffiliate: true                         │
│    - affiliateCommission: 15.50                 │
└────────┬────────────────────────────────────────┘
         │
         │ 3. Salva no Firestore
         ▼
┌─────────────────────────────────────────────────┐
│ Firestore                                       │
│                                                 │
│ Collection: sales                               │
│ ┌─────────────────────────────────────────┐     │
│ │ Document ID: auto-generated             │     │
│ │ {                                       │     │
│ │   orderId: "order-1730304000000",       │     │
│ │   companyId: "store456",                │     │
│ │   userId: "user789",                    │     │
│ │   grossValue: 155.00,                   │     │
│ │   netValue: 140.00,                     │     │
│ │   platformFee: 15.00,                   │     │
│ │   hasAffiliate: true,                   │     │
│ │   affiliateCommission: 15.50,           │     │
│ │   affiliateId: "abc123",         ✅ NOVO│     │
│ │   affiliateCouponCode: "AFIL10", ✅ NOVO│     │
│ │   paymentStatus: "CONFIRMED",           │     │
│ │   saleDate: "2025-11-03T...",           │     │
│ │   createdAt: "2025-11-03T..."           │     │
│ │ }                                       │     │
│ └─────────────────────────────────────────┘     │
└────────┬────────────────────────────────────────┘
         │
         │ 4. Usuário acessa perfil
         ▼
┌─────────────────────────────────────────────────┐
│ MyAffiliationTab                                │
│                                                 │
│ getAffiliateSales(affiliateId: "abc123")        │
│   │                                             │
│   └─> Query Firestore:                         │
│       collection('sales')                       │
│       .where('affiliateId', '==', 'abc123')     │
│       .orderBy('saleDate', 'desc')              │
│                                                 │
│ ✅ Retorna vendas do afiliado                   │
│                                                 │
│ UI: Lista com vendas ✅                         │
│ ┌───────────────────────────────────────┐       │
│ │ 📦 Venda #order-1730304000000         │       │
│ │ 💰 R$ 155,00                          │       │
│ │ 💵 Comissão: R$ 15,50                 │       │
│ │ 📅 03/11/2025                         │       │
│ │ ✅ Confirmado                         │       │
│ └───────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Comparação Detalhada

### ❌ ANTES

| Etapa | O que acontecia | Problema |
|-------|-----------------|----------|
| 1. Checkout | `createAffiliateSale()` chamado | `orderId` vazio, `clickId` undefined |
| 2. Firestore | Salva em `affiliate_sales` | Collection não existe oficialmente |
| 3. Webhook N8N | Cria em `sales` sem `affiliateId` | Não associa à afiliação |
| 4. Frontend | Busca `affiliate_sales` | Collection vazia ou inexistente |
| **Resultado** | **Histórico vazio** | ❌ Não funciona |

### ✅ DEPOIS

| Etapa | O que acontece | Benefício |
|-------|----------------|-----------|
| 1. Checkout | Apenas monta `externalReference` | Sem criar registro prematuro |
| 2. Webhook N8N | Parseia `externalReference` e cria em `sales` | `orderId` sempre preenchido |
| 3. Firestore | `sales` com `affiliateId` + `affiliateCouponCode` | Tudo em uma collection |
| 4. Frontend | Busca `sales` filtrando por `affiliateId` | Encontra vendas corretamente |
| **Resultado** | **Histórico completo** | ✅ Funciona perfeitamente |

---

## 📋 Estrutura de Dados

### Collection: `sales`

```typescript
{
  // Identificadores
  orderId: string              // "order-1730304000000"
  companyId: string            // "store456"
  userId: string               // "user789"
  
  // Valores financeiros
  grossValue: number           // 155.00 (valor bruto)
  netValue: number             // 140.00 (valor líquido)
  platformFee: number          // 15.00 (taxa da plataforma)
  
  // Informações de pagamento
  paymentMethod: string        // "CREDIT_CARD" | "PIX" | "BOLETO"
  paymentStatus: string        // "CONFIRMED" | "PENDING" | "RECEIVED"
  paidAt: Date                 // Data do pagamento
  
  // Produtos
  itemsCount: number           // 2 (quantidade de itens)
  products: Product[]          // Array de produtos comprados
  
  // 🎯 AFILIADO (Campos principais)
  hasAffiliate: boolean        // true (se tem afiliado)
  affiliateCommission: number  // 15.50 (valor da comissão)
  affiliateId: string          // "abc123" ✅ NOVO
  affiliateCouponCode: string  // "AFIL10" ✅ NOVO
  
  // Timestamps
  createdAt: Date              // Data de criação
  saleDate: Date               // Data da venda
  
  // Metadata
  source: string               // "webhook_payment_confirmed"
  webhookId: string            // ID do webhook
}
```

---

## 🎯 Índice Necessário no Firestore

Para a query funcionar, você precisa criar este índice composto:

```
Collection: sales
Fields:
  - affiliateId (Ascending)
  - saleDate (Descending)
```

### Como criar:

#### Opção 1: Via Firebase Console
```
1. Firebase Console
2. Firestore Database
3. Indexes
4. Composite
5. Create Index
   - Collection: sales
   - Field 1: affiliateId (Ascending)
   - Field 2: saleDate (Descending)
6. Create
```

#### Opção 2: Via CLI
```bash
firebase firestore:indexes:create sales \
  --field affiliateId:ASCENDING \
  --field saleDate:DESCENDING
```

---

## 🧪 Como Testar

### 1️⃣ Verificar que o erro clickId foi corrigido

```bash
# Fazer uma compra de teste
# Não deve mais aparecer erro de "clickId: undefined"
```

### 2️⃣ Verificar estrutura no Firestore

```
Firebase Console > Firestore > sales

Procure por documento mais recente (com hasAffiliate: true)
Deve ter os campos:
✅ affiliateId
✅ affiliateCouponCode
```

### 3️⃣ Testar no perfil do afiliado

```
1. Login com conta do afiliado
2. Ir em Perfil > Minhas Afiliações
3. Verificar se a venda aparece na lista
```

---

## ✅ Checklist de Implementação

### Frontend (Next.js) - ✅ CONCLUÍDO
- [x] Corrigir erro `clickId: undefined`
- [x] Remover `createAffiliateSale()` do `CheckoutButton.tsx`
- [x] Atualizar `affiliateService.ts` para buscar de `sales`
- [x] Remover import de `affiliate-sales-service.ts`

### Backend (N8N) - ⏳ PENDENTE (você precisa fazer)
- [ ] Abrir workflow "webhook-confirm-payment-complete"
- [ ] Atualizar node "16. Prepare Analytics" com novo código
- [ ] Atualizar node "17. Create Sale Analytics" - adicionar colunas
- [ ] Salvar e ativar workflow

### Firestore - ⏳ PENDENTE
- [ ] Criar índice composto (affiliateId + saleDate)

---

## 📝 Arquivos Modificados

### ✅ Modificados:
1. `src/lib/affiliate-sales-service.ts`
   - Corrigido: `clickId` só é adicionado se não for undefined

2. `src/services/affiliateService.ts`
   - Alterado: Busca de `affiliate_sales` → `sales`
   - Mapeamento de campos atualizado

3. `src/components/checkout/CheckoutButton.tsx`
   - Removido: Bloco `createAffiliateSale()`
   - Removido: Import de `affiliate-sales-service`

### 📄 Criados:
1. `docs/AFFILIATE_SALES_FIX_FINAL.md`
   - Documentação completa da solução
   - Código para copiar no N8N

---

**Status:** ✅ Frontend corrigido / ⏳ Aguardando atualização N8N  
**Próximo passo:** Copiar código do `docs/AFFILIATE_SALES_FIX_FINAL.md` para o N8N
