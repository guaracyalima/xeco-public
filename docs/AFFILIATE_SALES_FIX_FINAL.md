# 🔧 FIX DEFINITIVO - Sistema de Vendas de Afiliados

## 📋 Resumo do Problema

### ❌ **Problemas Identificados:**
1. Collection `affiliate_sales` não existe (erro conceitual)
2. Collection `sales` existe mas não tem `affiliateId`
3. Erro `clickId: undefined` no Firestore
4. Frontend cria registro antes do checkout (timing errado)

### ✅ **Solução:**
1. ✅ Corrigir erro `clickId` undefined
2. ✅ Usar collection `sales` (já existe)
3. ✅ Adicionar `affiliateId` na collection `sales`
4. ✅ Extrair `affiliateId` do `externalReference` no webhook
5. ✅ Atualizar frontend para buscar da collection `sales`

---

## 🔧 **PARTE 1: Código para N8N Webhook**

### **Node: "16. Prepare Analytics" - CÓDIGO ATUALIZADO**

Substitua o código JavaScript do node "16. Prepare Analytics" por este:

```javascript
// 📊 FASE 8: Criar Analytics Sale com suporte a Afiliado
const order = $node['4. Validate Idempotency'].json.order;
const payment = $node['1. Validate Webhook'].json.body.payment;
const stockResults = $node['13. Aggregate Stock Results'].json;

console.log('📊 Criando registro de venda para analytics...');

// 🎯 Extrair dados do afiliado do externalReference
let affiliateId = null;
let couponCode = null;

if (payment.externalReference) {
  try {
    const parsed = JSON.parse(payment.externalReference);
    if (parsed.type === 'AFFILIATE_COMMISSION') {
      affiliateId = parsed.affiliateId;
      couponCode = parsed.couponCode;
      console.log('✅ Venda de afiliado detectada:', {
        affiliateId,
        couponCode,
        commission: parsed.commissionValue
      });
    }
  } catch (e) {
    console.log('ℹ️ externalReference não é JSON de afiliado');
  }
}

// Determinar se tem afiliado
const hasAffiliate = payment.split && payment.split.length > 0;
const affiliateCommission = hasAffiliate ? (payment.split?.[0]?.totalValue || 0) : 0;

return [{
  json: {
    // IDs
    orderId: order._id,
    companyId: order.companyId,
    userId: order.userId,
    
    // Valores
    grossValue: payment.value,
    netValue: payment.netValue,
    platformFee: payment.value - payment.netValue,
    
    // Pagamento
    paymentMethod: payment.billingType,
    paymentStatus: payment.status,
    paidAt: payment.clientPaymentDate,
    
    // Produtos
    itemsCount: order.items?.length || 0,
    products: order.items?.map(item => ({
      productId: item.productId || item.id,
      quantity: item.quantity || item.requestedQuantity,
      unitPrice: item.unitPrice,
      total: item.itemTotal
    })) || [],
    
    // 🎯 AFILIADO (ATUALIZADO)
    hasAffiliate: hasAffiliate,
    affiliateCommission: affiliateCommission,
    affiliateId: affiliateId,           // ✅ NOVO CAMPO
    affiliateCouponCode: couponCode,     // ✅ NOVO CAMPO
    
    // Timestamps
    createdAt: new Date().toISOString(),
    saleDate: payment.confirmedDate,
    
    // Metadata
    source: 'webhook_payment_confirmed',
    webhookId: $node['1. Validate Webhook'].json.body.id
  }
}];
```

---

### **Node: "17. Create Sale Analytics" - ATUALIZAR COLUMNS**

No node "17. Create Sale Analytics", atualize o campo `columns` para:

```
orderId,companyId,userId,grossValue,netValue,platformFee,paymentMethod,paymentStatus,paidAt,itemsCount,products,hasAffiliate,affiliateCommission,affiliateId,affiliateCouponCode,createdAt,saleDate,source,webhookId
```

**Campos adicionados:**
- `affiliateId`
- `affiliateCouponCode`

---

## 🎯 **PARTE 2: Estrutura da Collection `sales`**

```typescript
interface Sale {
  // IDs
  orderId: string
  companyId: string
  userId: string
  
  // Valores
  grossValue: number
  netValue: number
  platformFee: number
  
  // Pagamento
  paymentMethod: string
  paymentStatus: string
  paidAt: Date
  
  // Produtos
  itemsCount: number
  products: Product[]
  
  // Afiliado
  hasAffiliate: boolean
  affiliateCommission: number
  affiliateId?: string           // ✅ NOVO - ID do afiliado (se houver)
  affiliateCouponCode?: string   // ✅ NOVO - Código do cupom usado
  
  // Timestamps
  createdAt: Date
  saleDate: Date
  
  // Metadata
  source: string
  webhookId: string
}
```

---

## 📊 **PARTE 3: Fluxo Correto**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Cliente usa cupom de afiliado                           │
│    Exemplo: AFIL10                                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: startCheckout()                                │
│    Monta externalReference com:                             │
│    {                                                        │
│      type: "AFFILIATE_COMMISSION",                          │
│      affiliateId: "abc123",                                 │
│      couponCode: "AFIL10",                                  │
│      commissionValue: 15.50                                 │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. N8N Webhook recebe pagamento confirmado                 │
│    Node "16. Prepare Analytics"                             │
│    - Parseia externalReference                              │
│    - Extrai affiliateId                                     │
│    - Extrai couponCode                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Node "17. Create Sale Analytics"                        │
│    Cria registro em Firestore > sales:                     │
│    {                                                        │
│      orderId: "order-123",                                  │
│      companyId: "store456",                                 │
│      hasAffiliate: true,                                    │
│      affiliateCommission: 15.50,                            │
│      affiliateId: "abc123",        ✅ NOVO                  │
│      affiliateCouponCode: "AFIL10" ✅ NOVO                  │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend: MyAffiliationTab                               │
│    getAffiliateSales(affiliateId)                           │
│    - Busca collection "sales"                               │
│    - Filtra por affiliateId                                 │
│    - ✅ Retorna vendas do afiliado                          │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ **Checklist de Implementação**

### **N8N (Railway/Cloud):**
- [ ] Abrir workflow "webhook-confirm-payment-complete"
- [ ] Localizar node "16. Prepare Analytics"
- [ ] Substituir código JavaScript pelo novo código acima
- [ ] Localizar node "17. Create Sale Analytics"
- [ ] Atualizar campo `columns` com os novos campos
- [ ] Salvar workflow
- [ ] Ativar workflow

### **Frontend (Next.js):**
- [x] Corrigir erro `clickId: undefined` em `affiliate-sales-service.ts`
- [ ] Atualizar `affiliateService.ts` para buscar da collection `sales`
- [ ] Remover referências à collection `affiliate_sales`

---

## 🧪 **Como Testar**

### **1. Fazer uma compra com cupom de afiliado:**
```
1. Login com usuário teste
2. Adicionar produto ao carrinho
3. Aplicar cupom de afiliado (ex: AFIL10)
4. Finalizar checkout
5. Pagar (PIX ou cartão de teste)
```

### **2. Verificar no Firestore:**
```
Firebase Console > Firestore > sales

Deve aparecer documento com:
- hasAffiliate: true
- affiliateCommission: valor da comissão
- affiliateId: ID do afiliado ✅
- affiliateCouponCode: código do cupom ✅
```

### **3. Verificar no perfil do afiliado:**
```
1. Login com conta do afiliado
2. Ir em Perfil > Minhas Afiliações
3. ✅ Deve mostrar a venda na lista
```

---

## 🚨 **Debugging**

### **Logs do N8N:**
```javascript
// No node "16. Prepare Analytics"
console.log('📊 Dados do afiliado:', {
  hasAffiliate,
  affiliateId,
  couponCode,
  commission: affiliateCommission
});
```

### **Logs do Frontend:**
```javascript
// Em affiliateService.ts > getAffiliateSales()
console.log('🔍 Buscando vendas:', {
  affiliateId,
  collection: 'sales',
  totalEncontrado: sales.length
});
```

---

## 📝 **Diferenças da Solução Anterior**

| Antes | Depois |
|-------|--------|
| Collection `affiliate_sales` | Collection `sales` |
| Frontend cria registro | N8N cria registro |
| `clickId` obrigatório | `clickId` opcional |
| Sem `affiliateId` em `sales` | Com `affiliateId` em `sales` |
| Timing errado | Timing correto (após pagamento) |

---

**Data:** 3 de novembro de 2025  
**Status:** ✅ Pronto para implementação  
**Próximo passo:** Atualizar código N8N e testar
