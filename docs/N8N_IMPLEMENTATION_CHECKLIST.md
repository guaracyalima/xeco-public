# N8N Implementation Checklist

## 🎯 Objetivo
Implementar validação completa no n8n para:
1. Validar dados internos (orderId, userId, companyId)
2. Validar integridade de produtos (productList)
3. Validar preços e estoque
4. Validar totais
5. Repassar para Asaas com segurança

---

## 📋 FASE 1: Setup Inicial

### Step 1: Parse JSON da Requisição
```
Node: HTTP Request Trigger (webhook)
├─ Method: POST
├─ Authentication: None (por enquanto)
├─ Trigger Rules: None
└─ Output: body raw
```

**Deve conter:**
```json
{
  "orderId": "order-123",
  "userId": "user-456",
  "companyId": "company-789",
  "totalAmount": 318.20,
  "productList": [
    {
      "productId": "prod-001",
      "productName": "Camiseta",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 150.50
    }
  ],
  "signature": "abc123def456...",
  "customerData": { ... },
  "billingTypes": [ ... ]
}
```

### Step 2: Log da Requisição Recebida
```
Node: Execute Node (JavaScript)

Code:
return {
  "received": new Date().toISOString(),
  "orderId": $("HTTP Request Trigger").json().body.orderId,
  "totalAmount": $("HTTP Request Trigger").json().body.totalAmount,
  "productCount": $("HTTP Request Trigger").json().body.productList?.length || 0,
  "signature": $("HTTP Request Trigger").json().body.signature ? "present" : "missing"
}
```

**Log:** Console ou Slack para rastreabilidade

---

## ✅ FASE 2: Validações de Dados Internos

### Step 3: Validar Campos Obrigatórios
```
Node: Set (data preparation)

Required fields:
- orderId (string)
- userId (string)
- companyId (string)
- totalAmount (number > 0)
- productList (array não vazio)
- signature (string)
- customerData (object)

If any missing:
→ Respond with 400 Bad Request
→ Log: MISSING_FIELD: {fieldName}
```

### Step 4: Validar orderId em Firestore
```
Node: Google Firestore (query)

Collection: orders
Filter: document id = {{$json.body.orderId}}

Expected:
- customerId matches {{$json.body.userId}}
- company matches {{$json.body.companyId}}
- status = "PENDING_PAYMENT"

If NOT found:
→ Error node: ORDER_NOT_FOUND
→ Response 404

If customerId mismatch:
→ Error node: USER_MISMATCH
→ Response 403

If company mismatch:
→ Error node: COMPANY_MISMATCH
→ Response 403

If status != PENDING_PAYMENT:
→ Error node: INVALID_ORDER_STATUS
→ Response 409
```

### Step 5: Validar userId em Firestore
```
Node: Google Firestore (query)

Collection: users
Filter: document id = {{$json.body.userId}}

If NOT found:
→ Error node: USER_NOT_FOUND
→ Response 404
```

### Step 6: Validar companyId em Firestore
```
Node: Google Firestore (query)

Collection: companies
Filter: document id = {{$json.body.companyId}}

If NOT found:
→ Error node: COMPANY_NOT_FOUND
→ Response 404

Expected: company.active = true
If NOT active:
→ Error node: COMPANY_INACTIVE
→ Response 403
```

---

## 🛍️ FASE 3: Validação de Produtos

### Step 7: Loop através de ProductList
```
Node: Set (prepare productList)

Set: items = {{$json.body.productList}}
```

### Step 8: Para CADA produto - Query Firestore
```
Node: Loop - Google Firestore (query)

For each item in productList:

Collection: products
Filter: document id = {{$item.json.productId}}

Expected fields:
- name (deve ser == $item.json.productName)
- salePrice (deve ser == $item.json.unitPrice)
- stock (deve ser >= $item.json.quantity)
- active = true

Store result in: productData
```

### Step 9: Validar Existência do Produto
```
Node: If (conditional)

Condition: productData exists AND productData.id exists

If FALSE:
→ Error node: PRODUCT_NOT_FOUND
→ Log: {{$item.json.productId}} not found
→ Response 404
```

### Step 10: Validar Nome do Produto
```
Node: If (conditional)

Condition: productData.name == $item.json.productName

If FALSE:
→ Error node: PRODUCT_NAME_MISMATCH
→ Log: Expected "{{productData.name}}", got "{{$item.json.productName}}"
→ Response 400
→ Note: Good for detecting tampering
```

### Step 11: Validar Preço Unitário
```
Node: If (conditional)

Condition: productData.salePrice == $item.json.unitPrice

If FALSE:
→ Error node: PRICE_MISMATCH
→ Log: Expected {{productData.salePrice}}, got {{$item.json.unitPrice}}
→ Response 400
→ Note: THIS IS FRAUD DETECTION! Price changed in DevTools
```

### Step 12: Validar Estoque
```
Node: If (conditional)

Condition: productData.stock >= $item.json.quantity

If FALSE:
→ Error node: INSUFFICIENT_STOCK
→ Log: Product {{$item.json.productId}} - available: {{productData.stock}}, requested: {{$item.json.quantity}}
→ Response 422
```

### Step 13: Validar Cálculo do Total do Item
```
Node: If (conditional)

Condition: $item.json.totalPrice == ($item.json.quantity * $item.json.unitPrice)

If FALSE:
→ Error node: ITEM_TOTAL_MISMATCH
→ Log: {{$item.json.productId}} - expected {{$item.json.quantity * $item.json.unitPrice}}, got {{$item.json.totalPrice}}
→ Response 400
```

### Step 14: Acumular Totais
```
Node: Execute Node (JavaScript)

Code:
if (!$json.cumulativeTotal) {
  $json.cumulativeTotal = 0;
}
$json.cumulativeTotal += $json.item.json.totalPrice;
return $json;
```

---

## 💰 FASE 4: Validação de Totais

### Step 15: Após Loop - Validar Total Geral
```
Node: If (conditional)

Condition: Math.abs($json.cumulativeTotal - $json.body.totalAmount) < 0.01

If FALSE:
→ Error node: TOTAL_AMOUNT_MISMATCH
→ Log: Expected {{$json.cumulativeTotal}}, got {{$json.body.totalAmount}}
→ Response 400
```

---

## 🔐 FASE 5: Validação de Segurança

### Step 16: Validar Signature HMAC-SHA256
```
Node: Execute Node (JavaScript)

Code:
const crypto = require('crypto');

const body = $json.body;
const receivedSignature = body.signature;

// Rebuild signature data
const data = {
  companyId: body.companyId,
  totalAmount: body.totalAmount,
  items: body.productList.map(p => ({
    productId: p.productId,
    quantity: p.quantity,
    unitPrice: p.unitPrice
  }))
};

const signatureString = JSON.stringify(data);
const secret = process.env.CHECKOUT_SIGNATURE_SECRET; // from .env

const calculatedSignature = crypto
  .createHmac('sha256', secret)
  .update(signatureString)
  .digest('hex');

return {
  isValid: calculatedSignature === receivedSignature,
  calculatedSignature: calculatedSignature,
  receivedSignature: receivedSignature
};
```

### Step 17: Validar Resultado de Signature
```
Node: If (conditional)

Condition: $json.isValid == true

If FALSE:
→ Error node: INVALID_SIGNATURE
→ Log: Signature validation failed - possible tampering
→ Response 403 Forbidden
```

---

## 🎁 FASE 6: Preparação para Asaas

### Step 18: Extrair Apenas Dados do Asaas
```
Node: Set (data transformation)

Keep:
- billingTypes
- chargeTypes
- items (com descrição completa)
- customerData
- dueDate
- description
- returnUrl
- notificationUrl

Remove (dados internos):
- orderId
- userId
- companyId
- productList (já foi em items)
- signature

Result: asaasPayload
```

### Step 19: Enriquecer com Dados de Auditoria
```
Node: Set

Adicionar em description:
`Order: {{$json.orderId}} | Company: {{$json.companyWalletId}}`

Adicionar em notificationUrl:
`{{YOUR_DOMAIN}}/api/webhook/asaas?orderId={{$json.orderId}}&userId={{$json.userId}}`
```

---

## 🚀 FASE 7: Requisição ao Asaas

### Step 20: HTTP POST para Asaas
```
Node: HTTP Request

URL: https://api.asaas.com/v3/payments
Method: POST
Authentication: API Key (X-API-KEY header)

Headers:
- Content-Type: application/json
- X-API-KEY: {{$secret.ASAAS_API_KEY}}

Body: {{$json.asaasPayload}}

Expected Response:
{
  "id": "pay_xxx",
  "object": "payment",
  "status": "PENDING",
  "checkoutUrl": "https://checkout.asaas.com/..."
}
```

### Step 21: Atualizar Order em Firestore
```
Node: Google Firestore (update)

Collection: orders
Document: {{$json.orderId}}

Update:
{
  "asaasPaymentId": {{asaasResponse.id}},
  "checkoutUrl": {{asaasResponse.checkoutUrl}},
  "status": "CHECKOUT_CREATED",
  "updatedAt": new Date().toISOString()
}
```

### Step 22: Responder ao Frontend
```
Node: Respond to Webhook

Status: 200 OK
Body:
{
  "success": true,
  "checkoutUrl": {{asaasResponse.checkoutUrl}},
  "message": "Checkout criado com sucesso"
}
```

---

## ⚠️ FASE 8: Error Handling

### Erro Node (centralizado)
```
Catches all errors and responds:

Status: 400/403/404/409/422 (based on error)
Body:
{
  "success": false,
  "error": {{$error.message}},
  "code": {{$error.code}},
  "orderId": {{$json.body.orderId || "unknown"}},
  "timestamp": new Date().toISOString()
}

Plus:
- Log para Slack/Console
- Update Order status to "CHECKOUT_FAILED"
- Store error reason in Order document
```

---

## 🧪 FASE 9: Testing

### Test Case 1: Happy Path ✅
```
Input: Complete, valid payload
Expected: 200 OK + checkoutUrl returned
```

### Test Case 2: Missing Field ❌
```
Input: Remove orderId
Expected: 400 Bad Request + MISSING_FIELD error
```

### Test Case 3: Invalid Order ❌
```
Input: orderId = "non-existent"
Expected: 404 Not Found + ORDER_NOT_FOUND
```

### Test Case 4: Price Tampering ❌ (FRAUD)
```
Input: unitPrice changed from 75.25 to 10.00
Expected: 400 Bad Request + PRICE_MISMATCH
→ Alert sent to Slack
```

### Test Case 5: Insufficient Stock ❌
```
Input: quantity = 1000 (but stock = 5)
Expected: 422 Unprocessable + INSUFFICIENT_STOCK
```

### Test Case 6: Wrong Total ❌
```
Input: totalAmount = 999 (but should be 318.20)
Expected: 400 Bad Request + TOTAL_AMOUNT_MISMATCH
```

### Test Case 7: Invalid Signature ❌ (FRAUD)
```
Input: signature = "fake_signature"
Expected: 403 Forbidden + INVALID_SIGNATURE
→ Alert sent to Slack
```

---

## 📊 Logging Strategy

### Log Levels

**INFO:**
```
- Webhook received
- Order validated
- Products validated
- Signature validated
- Asaas API called successfully
- Order updated
```

**WARNING:**
```
- Price changed (but accepted if signature valid)
- Stock low (less than 5 units)
- API rate limit approaching
```

**ERROR:**
```
- Missing required field
- Product not found
- Price mismatch (fraud)
- Insufficient stock
- Signature invalid (fraud)
- Asaas API error
- Firestore query error
```

**CRITICAL:**
```
- Repeated signature failures (possible attack)
- Asaas API down
- Firestore down
```

### Log Format
```
[TIMESTAMP] [LEVEL] [orderId] [ACTION] [DETAILS]

Example:
[2025-10-21T14:30:45Z] [INFO] [order-123] WEBHOOK_RECEIVED totalAmount=318.20 productCount=3
[2025-10-21T14:30:46Z] [INFO] [order-123] ORDER_VALIDATED userId=user-456 status=PENDING_PAYMENT
[2025-10-21T14:30:47Z] [INFO] [order-123] PRODUCTS_VALIDATED all 3 products OK
[2025-10-21T14:30:48Z] [INFO] [order-123] SIGNATURE_VALIDATED hash matches
[2025-10-21T14:30:49Z] [INFO] [order-123] ASAAS_CALLED response.id=pay_xxx
[2025-10-21T14:30:50Z] [INFO] [order-123] ORDER_UPDATED status=CHECKOUT_CREATED
[2025-10-21T14:30:50Z] [INFO] [order-123] RESPONSE_SENT checkoutUrl provided
```

---

## 🔍 Environment Variables Needed

Add to n8n Credentials/Environment:

```
ASAAS_API_KEY=your_asaas_key
CHECKOUT_SIGNATURE_SECRET=your_secret_key
FIREBASE_PROJECT_ID=xeco-public
WEBHOOK_RETURN_URL=https://yourapp.com/checkout/result
WEBHOOK_NOTIFICATION_URL=https://yourapp.com/api/webhook/asaas
SLACK_WEBHOOK_URL=https://hooks.slack.com/... (para alertas de fraud)
```

---

## ✨ Final Checklist

```
□ Webhook trigger configurado
□ Parse JSON do body
□ Validação de campos obrigatórios
□ Query Firestore para Order
□ Query Firestore para User
□ Query Firestore para Company
□ Loop através de ProductList
□ Para cada produto:
  □ Query Firestore
  □ Validar existência
  □ Validar nome
  □ Validar preço
  □ Validar estoque
  □ Validar total do item
□ Validar total geral
□ Validar HMAC-SHA256 signature
□ Extrair dados para Asaas
□ HTTP POST para Asaas API
□ Update Order com asaasPaymentId
□ Responder com checkoutUrl
□ Error handling centralizado
□ Logging completo
□ Testes manuais (7 cases)
□ Environment variables configuradas
```

---

## 📚 Referências

- **Asaas API Docs:** https://docs.asaas.com/payments
- **N8N Firestore Node:** https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.firebasefirestoredb/
- **N8N HTTP Node:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
- **Validação Frontend:** `/src/services/checkoutService-new.ts`
- **Dados Esperados:** `/docs/ASAAS_REQUEST_EXAMPLE.md`

---

**Pronto para implementar? Bora! 🚀**
