# 🎯 FIX SIMPLES - affiliateId no Webhook

## 🔍 **Descoberta**

O `affiliateId` **JÁ ESTÁ SENDO SALVO NA ORDER** quando ela é criada!

```typescript
// src/app/api/checkout/create-payment/route.ts linha 244
const orderData = {
  // ... outros campos
  affiliateId: affiliate?.id || null,  // ✅ JÁ SALVA AQUI!
  // ... outros campos
}
```

## ✅ **Solução Correta**

No webhook N8N, a order já vem com o `affiliateId`. Só precisa pegar de lá!

### **Node "15. Prepare Analytics" - CÓDIGO CORRETO:**

```javascript
// 📊 FASE 9: Criar Analytics Sale
const order = $node['4. Validate Idempotency1'].json.order;
const payment = $node['1. Validate Webhook1'].json.body.payment;

console.log('📊 Criando registro de venda para analytics...');

// 🎯 Pega affiliateId direto da order (já foi salvo quando order foi criada)
const affiliateId = order.affiliateId || null;
const couponCode = order.couponCode || null;

// Log para debug
if (affiliateId) {
  console.log('✅ Venda de afiliado detectada:', {
    affiliateId,
    couponCode,
    orderId: order._id
  });
} else {
  console.log('ℹ️ Venda direta (sem afiliado)');
}

// Determinar se tem afiliado
const hasAffiliate = payment.split && payment.split.length > 0;
const affiliateCommission = hasAffiliate ? (payment.split?.[0]?.totalValue || 0) : 0;

return [{
  json: {
    orderId: order._id,
    companyId: order.companyId,
    userId: order.userId,
    grossValue: payment.value,
    netValue: payment.netValue,
    platformFee: payment.value - payment.netValue,
    paymentMethod: payment.billingType,
    paymentStatus: payment.status,
    paidAt: payment.clientPaymentDate,
    itemsCount: order.items?.length || 0,
    products: order.items?.map(item => ({
      productId: item.productId || item.id,
      quantity: item.quantity || item.requestedQuantity,
      unitPrice: item.unitPrice,
      total: item.itemTotal
    })) || [],
    
    // 🎯 AFILIADO (da order)
    hasAffiliate: hasAffiliate,
    affiliateCommission: affiliateCommission,
    affiliateId: affiliateId,           // ✅ Da order
    affiliateCouponCode: couponCode,    // ✅ Da order
    
    createdAt: new Date().toISOString(),
    saleDate: payment.confirmedDate,
    source: 'webhook_payment_confirmed'
  }
}];
```

---

## 📋 **Comparação**

### ❌ **ANTES (tentava pegar direto sem campo):**
```javascript
affiliateId: $('2. Find Order by checkoutSession1').first().json.affiliateId,
```
**Problema:** Tentava acessar sem validar se existia

### ✅ **DEPOIS (pega da order que já foi buscada):**
```javascript
const order = $node['4. Validate Idempotency1'].json.order;
const affiliateId = order.affiliateId || null;
```
**Solução:** Pega do local correto com fallback

---

## 🧪 **Como Testar**

1. Fazer uma compra com cupom de afiliado
2. Verificar logs do webhook node "15. Prepare Analytics"
3. Deve aparecer: `✅ Venda de afiliado detectada`
4. Verificar Firestore > sales > deve ter `affiliateId` preenchido

---

## ✅ **Resultado Final**

Quando a venda for confirmada:

```
Firestore > sales > documento
{
  orderId: "order-123",
  companyId: "store456",
  userId: "user789",
  affiliateId: "abc123",           ✅
  affiliateCouponCode: "AFIL10",   ✅
  hasAffiliate: true,              ✅
  affiliateCommission: 15.50,      ✅
  paymentStatus: "CONFIRMED"
}
```

Frontend > MyAffiliationTab:
```
✅ Query encontra vendas pelo affiliateId
✅ Lista mostra as vendas do afiliado
```

---

**Status:** ✅ Solução simples - affiliateId já existe na order!
