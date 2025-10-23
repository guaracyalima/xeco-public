# Integração n8n com os Novos Dados

## Visão Geral

O n8n agora recebe um request **COMPLETO** que contém:

1. **Dados Asaas** - O que realmente enviar para o Asaas
2. **Dados Internos** - Para validação e auditoria no n8n
3. **Signature** - Para validação de fraude

## Fluxo no n8n

```
Webhook Entrada (do Next.js API Route)
│
├─ Step 1: Log dos dados recebidos
│  └─ Registra timestamp, orderId, userId
│
├─ Step 2: Validação de dados internos
│  ├─ Verifica orderId no Firestore
│  ├─ Verifica userId no Firestore
│  ├─ Verifica companyId no Firestore
│  └─ Se algum falhar: Retorna erro 400
│
├─ Step 3: Valida totais e produtos (Double-Check)
│  ├─ Para cada item:
│  │  ├─ Busca produto no Firestore
│  │  ├─ Valida preço (deve ser igual ao recebido)
│  │  ├─ Valida estoque (deve ter quantidade suficiente)
│  │  └─ Se falhar: Retorna erro 400 "Product validation failed"
│  │
│  ├─ Recalcula totalAmount
│  │  └─ Sum(quantity × unitPrice) DEVE BATER com request.totalAmount
│  │
│  └─ Se total divergir > 0,01: Retorna erro 400 "Total mismatch"
│
├─ Step 4: Valida cupom e afiliado (se houver)
│  ├─ Se productList tem cupom:
│  │  ├─ Busca cupom no Firestore
│  │  ├─ Valida se ainda é válido
│  │  ├─ Valida se limite de uso não foi atingido
│  │  ├─ Registra uso no Firestore
│  │  └─ Se falhar: Retorna erro 400 "Coupon invalid"
│  │
│  └─ Se há afiliado nos splits:
│     ├─ Busca afiliado no Firestore
│     ├─ Valida se ainda é válido
│     └─ Se falhar: Retorna erro 400 "Affiliate invalid"
│
├─ Step 5: Extrai apenas dados Asaas
│  ├─ billingTypes
│  ├─ chargeTypes
│  ├─ minutesToExpire
│  ├─ totalAmount
│  ├─ externalReference
│  ├─ callback
│  ├─ items
│  ├─ customerData
│  ├─ installment
│  └─ splits
│  └─ REMOVE: orderId, companyId, userId, productList, signature
│
├─ Step 6: Envia para Asaas API
│  ├─ POST https://api.asaas.com/api/v3/payments
│  ├─ Headers:
│  │  ├─ Authorization: Bearer {ASAAS_API_KEY}
│  │  └─ Content-Type: application/json
│  ├─ Body: Dados Asaas extraídos no Step 5
│  └─ Espera resposta
│
├─ Step 7: Processa resposta do Asaas
│  ├─ Se sucesso (status 200):
│  │  ├─ Extrai: id, link, status
│  │  ├─ Atualiza Order no Firestore:
│  │  │  ├─ asaasCheckoutId: response.id
│  │  │  ├─ asaasCheckoutUrl: response.link
│  │  │  ├─ asaasExternalReference: externalReference
│  │  │  └─ status: PENDING_PAYMENT
│  │  │
│  │  └─ Retorna para Next.js:
│  │     ├─ success: true
│  │     ├─ id: response.id
│  │     ├─ link: response.link
│  │     └─ status: response.status
│  │
│  └─ Se erro (status != 200):
│     ├─ Log do erro
│     ├─ Atualiza Order status: ERROR
│     └─ Retorna erro para Next.js
│
└─ Webhook Saída
   └─ Resposta para Next.js API Route
```

## Dados Recebidos do Next.js

```json
{
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED"],
  "minutesToExpire": 15,
  "totalAmount": 150.50,
  "externalReference": "uuid-123",
  "callback": { /* ... */ },
  "items": [ /* ... */ ],
  "customerData": { /* ... */ },
  "installment": { /* ... */ },
  "splits": [ /* ... */ ],
  
  // Dados que APENAS n8n usa:
  "orderId": "NbYhqwWV3dfLR2sZMqqr",
  "companyId": "9ddiJlQ72cmE57lJlkch",
  "companyOrder": "Minha Loja LTDA",
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "productList": [
    { "productId": "prod-123", "quantity": 2 }
  ],
  "signature": "a1b2c3d4e5f6..."
}
```

## Node 1: Log de Entrada

```javascript
// Logging node
{
  timestamp: new Date().toISOString(),
  source: "xeco-next-api",
  event: "checkout_received",
  orderId: $json.orderId,
  userId: $json.userId,
  companyId: $json.companyId,
  totalAmount: $json.totalAmount,
  itemCount: $json.items.length,
  hasAffiliate: $json.splits.length > 1
}
```

**Saída esperada:**
```json
{
  "timestamp": "2024-10-21T14:30:00.000Z",
  "source": "xeco-next-api",
  "event": "checkout_received",
  "orderId": "NbYhqwWV3dfLR2sZMqqr",
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "companyId": "9ddiJlQ72cmE57lJlkch",
  "totalAmount": 150.50,
  "itemCount": 1,
  "hasAffiliate": true
}
```

## Node 2: Valida Dados Internos

```javascript
// IF node - Validar orderId
$json.orderId && $json.orderId.length > 0

// Si passa:
//   → Continue para Node 3 (Verificar User)
// Si falla:
//   → Ir para Error Handler "orderId missing"
```

**Exemplo Query Firestore:**
```javascript
// Firestore Query Node
Collection: "orders"
Filter: document.id == $json.orderId
Expected: Should return 1 document
```

**Resultado esperado:**
```json
{
  "id": "NbYhqwWV3dfLR2sZMqqr",
  "customerId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "companyId": "9ddiJlQ72cmE57lJlkch",
  "status": "PENDING_PAYMENT",
  "totalAmount": 150.50,
  "items": [ /* ... */ ]
}
```

## Node 3: Valida User

```javascript
// Firestore Query Node
Collection: "users"
Filter: document.id == $json.userId
Expected: Should return 1 document with valid status
```

**Resultado esperado:**
```json
{
  "id": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "email": "joao@example.com",
  "name": "João Silva",
  "status": "active"
}
```

**IF node - Validar resultado:**
```javascript
$json.data && $json.data.length > 0 && $json.data[0].status === "active"
```

## Node 4: Valida Empresa

```javascript
// Firestore Query Node
Collection: "companies"
Filter: document.id == $json.companyId
Expected: Should return 1 document
```

**Resultado esperado:**
```json
{
  "id": "9ddiJlQ72cmE57lJlkch",
  "name": "Minha Loja LTDA",
  "walletId": "7bafd95a-e783-4a62-9be1-23999af742c6",
  "status": true
}
```

## Node 5: Valida Produtos (Loop)

```javascript
// Para cada item em $json.items
// Firestore Query Node
Collection: "products"
Filter: document.id == item.productId
Expected: Should return 1 document
```

**Para cada produto, validar:**
1. Existe no Firestore
2. salePrice == item.value (preço correto?)
3. stockQuantity >= item.quantity (tem estoque?)

**Resultado esperado:**
```json
{
  "id": "prod-camiseta-preta-123",
  "name": "Camiseta Preta",
  "salePrice": 75.25,
  "stockQuantity": 100,
  "companyOwner": "9ddiJlQ72cmE57lJlkch"
}
```

**IF node - Validar cada item:**
```javascript
// Preço correto?
Math.abs($json.salePrice - $json.parentJson.items[0].value) < 0.01

// Tem estoque?
&& $json.stockQuantity >= $json.parentJson.items[0].quantity

// É de mesma empresa?
&& $json.companyOwner === $json.parentJson.companyId
```

## Node 6: Recalcula e Valida Total

```javascript
// JavaScript node
// Calcular total a partir dos itens
let calculatedTotal = 0;
for (let item of $json.items) {
  calculatedTotal += (item.quantity * item.unitPrice);
}

// Comparar com o recebido
const difference = Math.abs(calculatedTotal - $json.totalAmount);
const isValid = difference < 0.01; // Permite 0.01 de diferença por arredondamento

return {
  calculatedTotal: calculatedTotal,
  receivedTotal: $json.totalAmount,
  difference: difference,
  isValid: isValid,
  message: isValid ? "Total válido" : "Total divergente"
};
```

**IF node:**
```javascript
$json.isValid === true
```

## Node 7: Extrai Dados Asaas

```javascript
// JavaScript node
// Remover dados que só n8n usa, manter apenas o que Asaas precisa

const asaasPayload = {
  billingTypes: $json.billingTypes,
  chargeTypes: $json.chargeTypes,
  minutesToExpire: $json.minutesToExpire,
  totalAmount: $json.totalAmount,
  externalReference: $json.externalReference,
  callback: $json.callback,
  items: $json.items,
  customerData: $json.customerData,
  installment: $json.installment,
  splits: $json.splits
};

return {
  payload: asaasPayload,
  originalOrderId: $json.orderId,
  originalUserId: $json.userId,
  originalCompanyId: $json.companyId
};
```

**Resultado:**
```json
{
  "payload": {
    "billingTypes": ["CREDIT_CARD", "PIX"],
    "chargeTypes": ["DETACHED"],
    "minutesToExpire": 15,
    "totalAmount": 150.50,
    "externalReference": "uuid-123",
    "callback": { /* ... */ },
    "items": [ /* ... */ ],
    "customerData": { /* ... */ },
    "installment": { /* ... */ },
    "splits": [ /* ... */ ]
  },
  "originalOrderId": "NbYhqwWV3dfLR2sZMqqr",
  "originalUserId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "originalCompanyId": "9ddiJlQ72cmE57lJlkch"
}
```

## Node 8: Envia para Asaas

```javascript
// HTTP Request node
Method: POST
URL: https://api.asaas.com/api/v3/payments
Headers:
  Authorization: "Bearer ${ASAAS_API_KEY}"
  Content-Type: "application/json"
Body: $json.payload

Params:
  - none
```

**Resposta esperada (sucesso):**
```json
{
  "id": "pay_123abc",
  "object": "payment",
  "dateCreated": "2024-10-21T14:30:00.000Z",
  "customer": null,
  "subscription": null,
  "paymentDate": null,
  "externalReference": "uuid-123",
  "originalAmount": 150.50,
  "interestAmount": null,
  "netAmount": null,
  "originalDueDate": null,
  "dueDate": null,
  "status": "PENDING",
  "billingType": "CREDIT_CARD",
  "canBePaid": true,
  "canBeEdited": true,
  "canBeRecycled": false,
  "canBeDeleted": true,
  "canBeResent": false,
  "creditDate": null,
  "estimatedCreditDate": null,
  "pixQrCode": null,
  "pixCopyPaste": null,
  "pixExpirationDate": null,
  "invoiceUrl": null,
  "invoiceNumber": null,
  "type": "DETACHED",
  "acceptedPaymentMethods": [
    "CREDIT_CARD",
    "PIX"
  ],
  "link": "https://asaas.com/checkout/uuid-123/pay",
  "installmentOriginalAmount": null,
  "installmentInterestAmount": null,
  "installmentCount": null,
  "refundableAmount": 0,
  "transactionReceiptUrl": null,
  "nossoNumero": null,
  "barCode": null,
  "bankSlip": null,
  "chargeback": null,
  "splits": [
    {
      "id": "split_123",
      "status": "PENDING",
      "walletId": "7bafd95a-e783-4a62-9be1-23999af742c6",
      "refundableAmount": 0,
      "totalAmount": 135.45,
      "originalAmount": 135.45,
      "feesAmount": null,
      "splitElement": {
        "id": "9ddiJlQ72cmE57lJlkch",
        "name": "Minha Loja LTDA"
      }
    },
    {
      "id": "split_456",
      "status": "PENDING",
      "walletId": "8cbfd95a-e783-4a62-9be1-23999af742c7",
      "refundableAmount": 0,
      "totalAmount": 15.05,
      "originalAmount": 15.05,
      "feesAmount": null,
      "splitElement": {
        "id": "affiliate-123",
        "name": "Afiliado"
      }
    }
  ]
}
```

## Node 9: Atualiza Order no Firestore

```javascript
// Firestore Update node
Collection: "orders"
Document ID: $json.originalOrderId
Update data:
{
  "asaasCheckoutId": $json.data.id,
  "asaasCheckoutUrl": $json.data.link,
  "asaasExternalReference": $json.data.externalReference,
  "status": "PENDING_PAYMENT",
  "updatedAt": new Date().toISOString(),
  "asaasResponse": $json.data
}
```

## Node 10: Retorna Resposta para Next.js

```javascript
// HTTP Response node
Status: 200
Body:
{
  "success": true,
  "id": $json.data.id,
  "link": $json.data.link,
  "status": $json.data.status,
  "externalReference": $json.data.externalReference,
  "updatedOrder": {
    "id": $json.originalOrderId,
    "asaasCheckoutId": $json.data.id,
    "asaasCheckoutUrl": $json.data.link
  }
}
```

## Error Handler: Validação Falhou

```javascript
// Se qualquer validação falhar:

If: orderId missing
→ Return 400: { error: "ORDER_NOT_FOUND", message: "Order ID inválido" }

If: User não encontrado
→ Return 400: { error: "USER_NOT_FOUND", message: "Usuário não encontrado" }

If: Company não encontrada
→ Return 400: { error: "COMPANY_NOT_FOUND", message: "Empresa não encontrada" }

If: Produto não encontrado
→ Return 400: { error: "PRODUCT_NOT_FOUND", message: "Produto não encontrado", productId: item.productId }

If: Estoque insuficiente
→ Return 400: { error: "OUT_OF_STOCK", message: "Estoque insuficiente", productId: item.productId, requested: item.quantity, available: product.stockQuantity }

If: Preço divergente
→ Return 400: { error: "PRICE_MISMATCH", message: "Preço do produto mudou", productId: item.productId, expected: item.value, current: product.salePrice }

If: Total divergente
→ Return 400: { error: "TOTAL_MISMATCH", message: "Total calculado não bate", calculated: totalCalculated, received: $json.totalAmount }

If: Asaas retorna erro
→ Return 400: { error: "ASAAS_ERROR", message: $json.errors[0].description }
```

## Fluxo de Testes

### Teste 1: Validação de Dados Internos

```
Input:
{
  orderId: "",  // ← Vazio propositalmente
  totalAmount: 150.50,
  items: [ /* ... */ ]
}

Expected Output: 400
{
  error: "ORDER_NOT_FOUND",
  message: "Order ID inválido"
}
```

### Teste 2: Validação de Produtos

```
Input:
{
  orderId: "NbYhqwWV3dfLR2sZMqqr",
  items: [{
    productId: "prod-inexistente",
    quantity: 2,
    value: 75.25
  }]
}

Expected Output: 400
{
  error: "PRODUCT_NOT_FOUND",
  message: "Produto não encontrado",
  productId: "prod-inexistente"
}
```

### Teste 3: Validação de Total

```
Input:
{
  orderId: "NbYhqwWV3dfLR2sZMqqr",
  totalAmount: 100.00,  // ← Menor que 2 × 75.25
  items: [{
    productId: "prod-camiseta",
    quantity: 2,
    unitPrice: 75.25
  }]
}

Expected Output: 400
{
  error: "TOTAL_MISMATCH",
  message: "Total calculado não bate",
  calculated: 150.50,
  received: 100.00
}
```

### Teste 4: Checkout Bem-Sucedido

```
Input: (todos os dados válidos)

Expected Output: 200
{
  "success": true,
  "id": "pay_123abc",
  "link": "https://asaas.com/checkout/uuid-123/pay",
  "status": "PENDING",
  "externalReference": "uuid-123"
}
```

## Monitoramento

### Métricas importantes

```
- Tempo total de processamento (deve ser < 5s)
- Taxa de erro por etapa (Target: < 1%)
- Tempo de resposta do Asaas (deve ser < 2s)
- Taxa de atualização bem-sucedida do Firestore (Target: 100%)
```

### Alertas

```
If: Tempo total > 10s
→ Alert: "Checkout lento no n8n"

If: Asaas retorna erro > 3x em 1 hora
→ Alert: "Asaas API pode estar instável"

If: Falha ao atualizar Firestore > 2x em 1 hora
→ Alert: "Falha ao persistir checkout no Firebase"
```
