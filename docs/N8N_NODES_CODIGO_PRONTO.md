# N8N Workflow - Estrutura Pronta para Colar

## 🚀 Node-by-Node - Código Pronto para Copiar

---

## NODE 1: HTTP Webhook Trigger

**Tipo:** Trigger → Webhook

**Configuração:**
```
Method: POST
Path: checkout
Response Mode: Last node response
Authentication: None
```

**Resultado:** URL gerada (copie para frontend)
```
https://seu-n8n.com/webhook/checkout
```

---

## NODE 2: Parse & Log

**Tipo:** Core → Execute

**Código (copie exatamente):**
```javascript
const timestamp = new Date().toISOString();
const orderId = $json.body?.orderId;
const totalAmount = $json.body?.totalAmount;
const productCount = $json.body?.productList?.length;

// Log para debugging
console.log(`[${timestamp}] CHECKOUT RECEIVED`);
console.log(`Order: ${orderId}`);
console.log(`Amount: ${totalAmount}`);
console.log(`Products: ${productCount}`);

return {
  timestamp,
  orderId,
  totalAmount,
  productCount,
  logReceived: true
};
```

**Conexão:** Webhook → Parse & Log

---

## NODE 3: Validate Required Fields

**Tipo:** Logic → If

**Condição (AND):**
```
- $json.body.orderId NÃO VAZIO
- $json.body.userId NÃO VAZIO
- $json.body.companyId NÃO VAZIO
- $json.body.totalAmount > 0
- $json.body.productList EXISTE
- $json.body.signature EXISTE
```

**Conexão:** Parse & Log → Validate Fields

---

## NODE 4: Query Firebase - Order

**Tipo:** Firebase Firestore

**Configuração:**
```
Firestore Credentials: [Configure aqui]
Collection: orders
Query Type: Get by ID
Document ID: {{$json.body.orderId}}
```

**Conexão:** Validate Fields (TRUE) → Query Order

---

## NODE 5: Validate Order Status

**Tipo:** Core → Execute

**Código:**
```javascript
const order = $json;

if (!order?.id) {
  throw new Error('ORDER_NOT_FOUND');
}

if (order.customerId !== $input.first().body.userId) {
  throw new Error('USER_MISMATCH');
}

if (order.company !== $input.first().body.companyId) {
  throw new Error('COMPANY_MISMATCH');
}

if (order.status !== 'PENDING_PAYMENT') {
  throw new Error('INVALID_ORDER_STATUS');
}

return {
  orderValid: true,
  order: order
};
```

**Conexão:** Query Order → Validate Order

---

## NODE 6: Query Firebase - Products (Loop)

**Tipo:** Firebase Firestore

**Configuração:**
```
Collection: products
Mode: Get by ID
Document ID: {{$json.productId}}
```

⚠️ **NOTA:** Este node será duplicado em um LOOP para cada produto

**Conexão:** Validate Order → Query Products (Loop)

---

## NODE 7: Validate Each Product

**Tipo:** Core → Execute

**Código (dentro do loop):**
```javascript
const product = $json;
const cartItem = $input.first().body.productList[0]; // Ajustar índice no loop

if (!product?.id) {
  throw new Error(`PRODUCT_NOT_FOUND: ${cartItem.productId}`);
}

if (product.name !== cartItem.productName) {
  console.log(`[WARNING] Product name mismatch for ${cartItem.productId}`);
}

if (product.salePrice !== cartItem.unitPrice) {
  throw new Error(`PRICE_MISMATCH: Expected ${product.salePrice}, got ${cartItem.unitPrice}`);
}

if (product.stock < cartItem.quantity) {
  throw new Error(`INSUFFICIENT_STOCK: Available ${product.stock}, requested ${cartItem.quantity}`);
}

const calculatedTotal = cartItem.quantity * product.salePrice;
if (Math.abs(calculatedTotal - cartItem.totalPrice) > 0.01) {
  throw new Error(`ITEM_TOTAL_MISMATCH: Expected ${calculatedTotal}, got ${cartItem.totalPrice}`);
}

return {
  productValid: true,
  productId: product.id,
  itemTotal: cartItem.totalPrice
};
```

---

## NODE 8: Sum Totals

**Tipo:** Core → Execute

**Código:**
```javascript
let cumulativeTotal = 0;

if (Array.isArray($input)) {
  $input.all().forEach(item => {
    if (item.json.itemTotal) {
      cumulativeTotal += item.json.itemTotal;
    }
  });
}

const requestTotal = $input.first().body.totalAmount;

if (Math.abs(cumulativeTotal - requestTotal) > 0.01) {
  throw new Error(`TOTAL_MISMATCH: Sum ${cumulativeTotal}, request ${requestTotal}`);
}

return {
  cumulativeTotal,
  requestTotal,
  totalValid: true
};
```

---

## NODE 9: Validate HMAC-SHA256 Signature

**Tipo:** Core → Execute

**Código (CRÍTICO):**
```javascript
const crypto = require('crypto');

const data = {
  companyId: $input.first().body.companyId,
  totalAmount: $input.first().body.totalAmount,
  items: $input.first().body.productList.map(p => ({
    productId: p.productId,
    quantity: p.quantity,
    unitPrice: p.unitPrice
  }))
};

const secret = process.env.CHECKOUT_SIGNATURE_SECRET;
if (!secret) {
  throw new Error('MISSING_SIGNATURE_SECRET');
}

const dataString = JSON.stringify(data);

const calculatedSignature = crypto
  .createHmac('sha256', secret)
  .update(dataString)
  .digest('hex');

const receivedSignature = $input.first().body.signature;

// IMPORTANTE: Use timingSafeEqual para evitar timing attacks
let isValid = false;
try {
  isValid = crypto.timingSafeEqual(
    Buffer.from(calculatedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
} catch (e) {
  // Lengths don't match
  isValid = false;
}

if (!isValid) {
  console.log('[FRAUD ALERT] Signature validation failed!');
  console.log(`Received: ${receivedSignature}`);
  console.log(`Calculated: ${calculatedSignature}`);
  throw new Error('INVALID_SIGNATURE');
}

return {
  signatureValid: true,
  received: receivedSignature,
  calculated: calculatedSignature
};
```

---

## NODE 10: Extract Asaas Data

**Tipo:** Core → Execute

**Código:**
```javascript
const body = $input.first().body;

// Remove dados internos
const asaasPayload = {
  billingTypes: body.billingTypes,
  chargeTypes: body.chargeTypes,
  items: body.items,
  customerData: body.customerData,
  totalAmount: body.totalAmount,
  dueDate: body.dueDate,
  description: `Order: ${body.orderId} | Company: ${body.companyWalletId}`,
  externalReference: body.orderId,
  returnUrl: `https://seu-app.com/checkout/result?orderId=${body.orderId}`,
  notificationUrl: `https://seu-app.com/api/webhook/asaas?orderId=${body.orderId}`
};

// Remove signature e dados internos (mais seguro)
delete body.signature;
delete body.orderId;
delete body.userId;
delete body.companyId;
delete body.productList;

return {
  asaasPayload: asaasPayload,
  originalBody: body
};
```

---

## NODE 11: HTTP POST - Asaas API

**Tipo:** HTTP Request

**Configuração:**
```
URL: https://api.asaas.com/v3/payments
Method: POST
Headers:
  Content-Type: application/json
  X-API-KEY: {{$secret.ASAAS_API_KEY}}

Body (JSON):
{{$json.asaasPayload}}
```

**Expected Response:**
```json
{
  "id": "pay_xyz",
  "status": "PENDING",
  "checkoutUrl": "https://checkout.asaas.com/..."
}
```

---

## NODE 12: Update Firestore - Store Payment ID

**Tipo:** Firebase Firestore

**Configuração:**
```
Collection: orders
Document ID: {{$input.first().body.orderId}}
Update Fields:
  asaasPaymentId: {{$json.id}}
  checkoutUrl: {{$json.checkoutUrl}}
  status: "CHECKOUT_CREATED"
  updatedAt: {{new Date().toISOString()}}
```

---

## NODE 13: Response 200 OK

**Tipo:** Response

**Configuração:**
```
Status Code: 200
Response Body:
{
  "success": true,
  "checkoutUrl": "{{$json.checkoutUrl}}",
  "orderId": "{{$input.first().body.orderId}}",
  "asaasPaymentId": "{{$json.id}}"
}
```

---

## NODE 14: Response Error Handler

**Tipo:** Response

**Configuração:**
```
Status Code: {{$json.code || 400}}
Response Body:
{
  "success": false,
  "error": "{{$error.message}}",
  "orderId": "{{$input.first().body?.orderId || 'unknown'}}",
  "timestamp": "{{new Date().toISOString()}}"
}
```

---

## 🔗 Conexões Resumidas

```
Webhook
  ↓
Parse & Log
  ↓
Validate Fields (TRUE)
  ↓
Query Order
  ↓
Validate Order
  ↓
[LOOP] Query Products + Validate
  ↓
Sum Totals
  ↓
Validate Signature
  ↓
Extract Asaas Data
  ↓
Asaas API
  ↓
Update Firestore
  ↓
Response 200 OK

[ERRORS] → Response Error Handler
```

---

## 🧪 Environment Variables

Configure no N8N:
```
ASAAS_API_KEY=sk_live_xxxxx
CHECKOUT_SIGNATURE_SECRET=seu_secret_bem_longo_aqui
FIREBASE_PROJECT_ID=xeco-public
```

---

## ✅ Checklist de Setup

```
□ Webhook criado e URL copiada
□ Webhook URL adicionada no frontend
□ Parse & Log testado
□ Firebase credentials configuradas
□ Query Order funcionando
□ Validações locais OK
□ Loop de produtos OK
□ Signature validation OK
□ Asaas API configurada
□ Firestore update OK
□ Response nodes OK
□ Environment variables definidas
□ Workflow deployed
□ Teste com Postman: OK
```

---

## 🚀 Pronto! Bora testar!

Use Postman ou cURL com: `docs/N8N_PAYLOAD_EXEMPLO_REAL.md`
