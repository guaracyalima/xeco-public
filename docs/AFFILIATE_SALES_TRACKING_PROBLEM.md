# 🔴 PROBLEMA: Histórico de Vendas do Afiliado Não Aparece

## 📊 Resumo Executivo

O histórico de vendas do afiliado não está sendo exibido corretamente porque:

1. ❌ Registros estão sendo criados NO MOMENTO ERRADO (antes do checkout)
2. ❌ `orderId` está VAZIO nos registros
3. ❌ Status nunca é atualizado de PENDING para CONFIRMED
4. ❌ Falta implementar criação pelo N8N após sucesso do pagamento

---

## 🔍 Fluxo ATUAL (Problemático)

```
┌────────────────────────────────────────────────────────────────┐
│ MOMENTO 1: Cliente Clica em "Finalizar Pedido"                 │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ CheckoutButton.tsx (linha 104)                                 │
│                                                                 │
│ ❌ PROBLEMA: createAffiliateSale() é chamado ANTES do checkout │
│                                                                 │
│ await createAffiliateSale(                                     │
│   discount.affiliate,                                          │
│   '',  ◄── ❌ orderId VAZIO (order ainda não existe!)         │
│   email,                                                       │
│   subtotalAmount,                                              │
│   couponCode                                                   │
│ )                                                              │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ 💾 Firestore: collection "affiliate_sales"                     │
│                                                                 │
│ Documento criado com:                                          │
│ {                                                              │
│   affiliateId: "abc123",        ✅ OK                         │
│   storeId: "store456",          ✅ OK                         │
│   orderId: "",                  ❌ VAZIO!                     │
│   customerEmail: "...",         ✅ OK                         │
│   orderValue: 100,              ✅ OK                         │
│   commissionValue: 5,           ✅ OK                         │
│   status: "PENDING",            ❌ Nunca muda                 │
│   paymentStatus: "PENDING"      ❌ Nunca muda                 │
│ }                                                              │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ MOMENTO 2: startCheckout()                                     │
│                                                                 │
│ - Cria a order no Firestore                                    │
│ - Envia para N8N webhook                                       │
│ - N8N processa pagamento Asaas                                 │
│ - N8N atualiza order com asaasPaymentId                        │
│                                                                 │
│ ❌ N8N NÃO cria registro em affiliate_sales                    │
│ ❌ Registro anterior não é atualizado com orderId              │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ MOMENTO 3: Usuário vê "Minhas Afiliações"                      │
│                                                                 │
│ MyAffiliationTab.tsx chama:                                    │
│   getAffiliateSales(affiliateId)                               │
│                                                                 │
│ Query Firestore:                                               │
│   WHERE affiliateId == "abc123"                                │
│   ORDER BY saleDate DESC                                       │
│                                                                 │
│ ❓ Possíveis problemas:                                        │
│   1. Registros existem mas affiliateId está errado             │
│   2. Índice composto faltando no Firestore                     │
│   3. Collection vazia (createAffiliateSale falhou)             │
│   4. Permissões do Firestore bloqueando leitura                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Diagnóstico Detalhado

### Problema 1: Timing Incorreto

**Atual:**
```
createAffiliateSale() → startCheckout() → N8N → Asaas
      ↑
      Chamado ANTES da order existir
```

**Correto:**
```
startCheckout() → N8N → Asaas → createAffiliateSale()
                                        ↑
                                  Chamado DEPOIS da order existir
```

### Problema 2: Dados Incompletos

| Campo | Frontend (Atual) | N8N (Deveria ter) |
|-------|-----------------|-------------------|
| `orderId` | `""` ❌ | `order.id` ✅ |
| `orderValue` | `subtotalAmount` ⚠️ | `finalTotal` ✅ |
| `status` | `PENDING` (nunca muda) ❌ | `CONFIRMED` após Asaas ✅ |
| `paymentStatus` | `PENDING` (nunca muda) ❌ | `PAID` após confirmação ✅ |
| `asaasPaymentId` | Não existe ❌ | `pay_xxx` ✅ |

### Problema 3: Falta de Atualização

Após criar o registro com `orderId` vazio, nada atualiza esse registro depois.

**Não existe código que:**
- Busque o registro por `customerEmail` e `couponCode`
- Atualize com o `orderId` correto
- Mude status de PENDING → CONFIRMED
- Mude paymentStatus de PENDING → PAID

---

## 📋 Checklist de Diagnóstico

Vamos descobrir EXATAMENTE onde está o problema:

### ✅ Passo 1: Verificar se Registros Estão Sendo Criados

Abra o Firebase Console:
```
https://console.firebase.google.com/
→ Seu Projeto
→ Firestore Database
→ Collection: affiliate_sales
```

**Perguntas:**
1. ❓ A collection `affiliate_sales` existe?
2. ❓ Há documentos dentro dela?
3. ❓ Se sim, quais campos estão preenchidos?
4. ❓ O campo `orderId` está vazio?

### ✅ Passo 2: Verificar Logs do Frontend

No console do navegador durante checkout:

```javascript
// CheckoutButton.tsx deveria logar:
console.log('✅ Affiliate sale created:', {
  saleId: saleDoc.id,
  affiliateId: affiliate.id,
  orderId: orderId, // ← Este está vazio?
  commissionValue: commissionValue
})
```

**Procure por:**
- ✅ "Affiliate sale created"
- ❌ "Erro ao criar registro de venda do afiliado"

### ✅ Passo 3: Verificar affiliateId

No componente `MyAffiliationTab.tsx`, adicione log:

```typescript
console.log('🔍 Buscando vendas para affiliateId:', affiliate.id)
```

Compare com os `affiliateId` dos documentos no Firestore.

**Devem ser EXATAMENTE IGUAIS** (case-sensitive).

### ✅ Passo 4: Verificar Índices do Firestore

A query usa:
```typescript
where('affiliateId', '==', affiliateId)
orderBy('saleDate', 'desc')
```

**No Firebase Console:**
```
Firestore → Indexes → Composite
```

Deve ter índice:
- Collection: `affiliate_sales`
- Fields: `affiliateId` (Ascending), `saleDate` (Descending)
- Status: Enabled ✅

Se não existir, criar:
```
firebase firestore:indexes:create affiliate_sales \
  --field affiliateId:ASCENDING \
  --field saleDate:DESCENDING
```

### ✅ Passo 5: Testar Query Manualmente

No Firebase Console:
```
Firestore → affiliate_sales → Filter

Adicionar filtro:
  Field: affiliateId
  Operator: ==
  Value: [cole o ID do seu affiliate]
```

**Resultados esperados:**
- Se aparecer documentos → Problema está no código React
- Se não aparecer nada → Problema está na criação dos registros

---

## 🎯 Soluções Propostas

### 🔧 Solução 1: Remover Criação do Frontend (RECOMENDADO)

**O QUE FAZER:**
1. ❌ REMOVER chamada `createAffiliateSale()` do `CheckoutButton.tsx`
2. ✅ IMPLEMENTAR criação no N8N após sucesso do Asaas

**VANTAGENS:**
- ✅ `orderId` sempre preenchido
- ✅ Status correto desde o início
- ✅ Único ponto de criação (N8N)
- ✅ Dados mais precisos

**Onde implementar no N8N:**

```javascript
// Após receber sucesso do Asaas
// Node: "Create Affiliate Sale Record"

const affiliateData = $('Prepare Payment Data').item.json.affiliateData;

if (affiliateData && affiliateData.id) {
  return {
    collection: 'affiliate_sales',
    document: {
      affiliateId: affiliateData.id,
      storeId: $('Get Company Data').item.json.id,
      orderId: $('Prepare Payment Data').item.json.orderId,
      asaasPaymentId: $('Call Asaas API').item.json.id,
      customerEmail: $('Prepare Payment Data').item.json.customer.email,
      orderValue: $('Prepare Payment Data').item.json.totalAmount,
      commissionValue: affiliateData.commissionValue,
      commissionRate: affiliateData.commissionRate,
      couponUsed: affiliateData.couponCode,
      saleDate: new Date(),
      status: 'CONFIRMED',
      paymentStatus: 'PENDING', // Muda para PAID quando webhook Asaas confirmar
      createdAt: new Date()
    }
  };
}
```

### 🔧 Solução 2: Manter Frontend + Adicionar Atualização (Alternativa)

**O QUE FAZER:**
1. ✅ Manter `createAffiliateSale()` no frontend
2. ✅ Adicionar código para ATUALIZAR registro no N8N

**DESVANTAGENS:**
- ⚠️ Dois pontos de falha
- ⚠️ Complexidade extra
- ⚠️ Possibilidade de registros duplicados

**Código de atualização no N8N:**

```javascript
// Node: "Update Affiliate Sale with OrderId"

const couponCode = $('Prepare Payment Data').item.json.couponCode;
const customerEmail = $('Prepare Payment Data').item.json.customer.email;

if (couponCode) {
  // Busca registro por email + coupon
  const salesRef = admin.firestore().collection('affiliate_sales');
  const query = salesRef
    .where('customerEmail', '==', customerEmail)
    .where('couponUsed', '==', couponCode)
    .where('orderId', '==', '')
    .limit(1);
  
  const snapshot = await query.get();
  
  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await salesRef.doc(docId).update({
      orderId: $('Prepare Payment Data').item.json.orderId,
      asaasPaymentId: $('Call Asaas API').item.json.id,
      status: 'CONFIRMED',
      updatedAt: new Date()
    });
  }
}
```

---

## 🚨 Debugging Imediato

Para descobrir o problema AGORA, adicione estes logs:

### 1. Em `CheckoutButton.tsx` (linha 104):

```typescript
if (discount?.affiliate) {
  console.log('🎯 [DEBUG] Criando affiliate sale:', {
    affiliateId: discount.affiliate.id,
    email: firebaseUser?.email,
    subtotal: subtotalAmount,
    coupon: discount.coupon.code
  });
  
  try {
    const result = await createAffiliateSale(
      discount.affiliate,
      '',
      firebaseUser?.email || '',
      subtotalAmount,
      discount.coupon.code
    );
    
    console.log('✅ [DEBUG] Affiliate sale criada:', result);
  } catch (saleError) {
    console.error('❌ [DEBUG] Erro ao criar affiliate sale:', saleError);
  }
}
```

### 2. Em `MyAffiliationTab.tsx` (linha 48):

```typescript
const sales = await getAffiliateSales(affiliate.id)

console.log('🔍 [DEBUG] Vendas buscadas:', {
  affiliateId: affiliate.id,
  totalVendas: sales.length,
  vendas: sales
});
```

### 3. Em `affiliateService.ts` (getAffiliateSales):

```typescript
export async function getAffiliateSales(affiliateId: string): Promise<AffiliateSale[]> {
  try {
    console.log('🔍 [DEBUG] Query affiliate_sales:', {
      collection: 'affiliate_sales',
      affiliateId: affiliateId
    });
    
    const salesRef = collection(db, 'affiliate_sales')
    const q = query(
      salesRef, 
      where('affiliateId', '==', affiliateId),
      orderBy('saleDate', 'desc'),
      limit(100)
    )
    
    const querySnapshot = await getDocs(q)
    
    console.log('🔍 [DEBUG] Resultado da query:', {
      total: querySnapshot.docs.length,
      docs: querySnapshot.docs.map(d => d.data())
    });
    
    // ... resto do código
  }
}
```

---

## 📊 Resultado Esperado Após Fix

Quando tudo estiver funcionando:

```
FIRESTORE: affiliate_sales
├─ doc_1: {
│    affiliateId: "abc123",
│    storeId: "store456",
│    orderId: "ORD_789",           ✅ PREENCHIDO
│    asaasPaymentId: "pay_xyz",    ✅ NOVO CAMPO
│    customerEmail: "cliente@email.com",
│    orderValue: 95.00,            ✅ Valor final (com desconto)
│    commissionValue: 4.75,
│    commissionRate: 5,
│    couponUsed: "GUAR620",
│    saleDate: 2025-11-03,
│    status: "CONFIRMED",          ✅ ATUALIZADO
│    paymentStatus: "PAID",        ✅ ATUALIZADO
│    createdAt: 2025-11-03
│  }
└─ doc_2: { ... }
```

**MyAffiliationTab mostrará:**
- ✅ Lista de vendas completa
- ✅ Email dos clientes
- ✅ Valores corretos
- ✅ Status confirmado
- ✅ Comissões calculadas

---

## 🎬 Próximos Passos

1. **AGORA:** Execute os debugs acima e compartilhe os logs
2. **DEPOIS:** Decidir entre Solução 1 ou 2
3. **IMPLEMENTAR:** Código no N8N
4. **TESTAR:** Checkout completo com cupom de afiliado
5. **VALIDAR:** Histórico aparecendo corretamente

---

**Status:** 🔴 Aguardando diagnóstico com logs para determinar causa raiz exata
