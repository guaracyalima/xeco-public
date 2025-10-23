# 🚀 N8N Implementation - START HERE

## 📌 Quick Navigation

Se quer implementar no n8n **AGORA**, leia nessa ordem:

1. **VOCÊ ESTÁ AQUI** → Visão geral rápida (5 min)
2. `N8N_PAYLOAD_EXEMPLO_REAL.md` → Exemplo JSON real (5 min)
3. `N8N_WORKFLOW_VISUAL_DIAGRAM.md` → Fluxo visual completo (10 min)
4. `N8N_IMPLEMENTATION_CHECKLIST.md` → Step-by-step detalhado (30 min)

---

## ⚡ 30 Second Summary

### O que n8n faz:

```
Frontend envia: POST /webhook/checkout
              ↓
          N8N recebe
              ↓
          [VALIDA TUDO]
              ├─ Dados internos (Order, User, Company)
              ├─ Produtos (existe? preço? estoque?)
              ├─ Totais (sum == totalAmount?)
              └─ Assinatura (HMAC-SHA256)
              ↓
          [SE TEM ERRO]
              └─ Retorna 400/403/404/422/500 + motivo
              ↓
          [SE TUDO OK]
              ├─ Remove dados internos
              ├─ Enriquece com Asaas data
              ├─ POST para Asaas API
              ├─ Recebe checkoutUrl
              ├─ Salva em Firestore
              └─ Retorna 200 OK + checkoutUrl
              ↓
Frontend recebe: {success, checkoutUrl}
              ↓
Frontend redireciona
para checkoutUrl
              ↓
Cliente paga no Asaas ✅
```

---

## 🎯 3 Tipos de Validação

### 1️⃣ **AUDITORIA** (Dados Internos)
```
Valida que a requisição é legítima:

✓ Order existe? (Firestore query)
✓ Order status == PENDING_PAYMENT?
✓ User existe? (Firestore query)
✓ Company existe e ativa? (Firestore query)
✓ customerId == userId?
✓ company == companyId?

Se falhar → 404/403/409 Forbidden
```

---

### 2️⃣ **PRODUTO** (ProductList)
```
Para CADA produto na lista:

✓ Produto existe? (Firestore query)
✓ Nome é o mesmo? (detect tampering)
✓ Preço é o mesmo? ← FRAUD DETECTION!
✓ Stock >= quantidade? (inventory check)
✓ Total == qty × unitPrice?

Se falhar → 400/404/422 Error

Depois: Sum(totals) == totalAmount?
Se falhar → 400 Total Mismatch
```

---

### 3️⃣ **SEGURANÇA** (HMAC-SHA256)
```
Valida que frontend não tampou dados:

1. Recebe signature: "a1b2c3d4e5..."
2. Recalcula: HMAC-SHA256({companyId, totalAmount, items})
3. Compara: signature == calculated?

Se falhar → 403 Forbidden FRAUD! 🚨

Usa timingSafeEqual() para evitar timing attacks
```

---

## 📊 Node Count Summary

```
Total Nodes no Workflow: ~25-30 nodes

├─ Triggers: 1
│  └─ HTTP Webhook POST
│
├─ Data Processing: 5
│  ├─ Parse/Log
│  ├─ Validate Fields
│  ├─ Prepare Loops
│  └─ etc
│
├─ Firestore Queries: 6
│  ├─ Query Order
│  ├─ Query User
│  ├─ Query Company
│  ├─ Loop → Query Product (x3)
│  └─ etc
│
├─ Conditional Logic: 8-10
│  ├─ If checks
│  └─ Validations
│
├─ Calculations: 3-5
│  ├─ HMAC-SHA256
│  ├─ Total accumulation
│  └─ etc
│
├─ External API: 1
│  └─ HTTP POST to Asaas
│
├─ Data Updates: 2
│  ├─ Update Firestore Order
│  └─ etc
│
├─ Responses: 2
│  ├─ Success Response (200)
│  └─ Error Handler (400/403/404/etc)
│
└─ Utilities: 2-3
   ├─ Slack alerts
   └─ Logging
```

---

## 🔄 Implementation Strategy

### Phase 1: Setup (30 min)
```
□ Create new n8n workflow
□ Configure HTTP Webhook trigger
□ Test receiving POST from frontend
□ Setup logging to console/Slack
```

### Phase 2: Auditoria (1 hour)
```
□ Node: Validate required fields
□ Node: Query Firestore → orders
□ Node: Query Firestore → users
□ Node: Query Firestore → companies
□ Node: Conditional checks for each
□ Test with invalid IDs
```

### Phase 3: Produtos (1.5 hours)
```
□ Node: Prepare productList array
□ Node: Loop through products
   ├─ Node: Query Firestore → products/{productId}
   ├─ Node: Check product exists
   ├─ Node: Check name matches
   ├─ Node: Check price matches ← FRAUD DETECTION
   ├─ Node: Check stock >= qty
   ├─ Node: Check item total calculation
   └─ Node: Accumulate totals
□ Node: Check totalAmount == sum
□ Test with various products
```

### Phase 4: Segurança (45 min)
```
□ Node: Execute JS → HMAC-SHA256 calculation
□ Node: timingSafeEqual check
□ Node: Conditional for signature validation
□ Test with valid signature
□ Test with tampered signature
```

### Phase 5: Asaas Integration (1 hour)
```
□ Node: Extract Asaas data
□ Node: Remove internal fields
□ Node: HTTP POST to Asaas
□ Node: Update Firestore with asaasPaymentId
□ Node: Response 200 OK
□ Test with real Asaas API
```

### Phase 6: Error Handling (1 hour)
```
□ Error handler node
□ Determine error code (400/403/404/422/500)
□ Log to console + Slack
□ Update Order status to FAILED
□ Respond with error message
```

### Phase 7: Testing (1+ hours)
```
□ Happy path test
□ Missing field test
□ Invalid order test
□ Price tampering test
□ Insufficient stock test
□ Wrong total test
□ Invalid signature test
□ Asaas API error test
```

**Total: ~6-7 hours for complete implementation**

---

## 🛠️ Step 1: Create Webhook Trigger

### In N8N:
```
1. Create new workflow
2. Add node → HTTP Request
3. Select "Trigger → Webhook"
4. Configure:
   - Method: POST
   - Authentication: None (for now)
   - Trigger Rules: None
   - Response Type: First output
   - Output Format: Set by field: body
   
5. Save and deploy
6. Copy webhook URL
```

### In Your Frontend Code:
```javascript
// Already done in checkoutService-new.ts
// Sends to: https://n8n.yourapp.com/webhook/checkout

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paymentData)
})
```

---

## 🧪 Step 2: Test Webhook Reception

### Use Postman or cURL:

```bash
curl -X POST https://n8n.yourapp.com/webhook/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-001",
    "userId": "user-123",
    "companyId": "company-abc",
    "totalAmount": 100.00,
    "productList": [
      {
        "productId": "prod-1",
        "productName": "Test Product",
        "quantity": 1,
        "unitPrice": 100.00,
        "totalPrice": 100.00
      }
    ],
    "signature": "test"
  }'
```

### In N8N:
```
After webhook trigger:
- Add "Execute Node" (JavaScript)
- Log: console.log($json)
- Run test
- Should see full body logged
```

---

## 📋 Firestore Queries Reference

### Query: Get Order

```
Node: Google Firestore

Collection: orders
Condition: Select "= (equal)"
Property: (document id)
Comparison: (equals)
Value: {{$json.body.orderId}}

Output: stored in $json.orderData
```

### Query: Get Product

```
Node: Google Firestore

Collection: products
Condition: Select "= (equal)"
Property: (document id)
Comparison: (equals)
Value: {{$item.json.productId}} ← Inside loop!

Output: stored in $json.productData
```

---

## 🔐 HMAC-SHA256 Implementation

### N8N JavaScript:

```javascript
const crypto = require('crypto');

// Input data
const data = {
  companyId: $json.body.companyId,
  totalAmount: $json.body.totalAmount,
  items: $json.body.productList.map(p => ({
    productId: p.productId,
    quantity: p.quantity,
    unitPrice: p.unitPrice
  }))
};

// Secret key (from environment)
const secret = process.env.CHECKOUT_SIGNATURE_SECRET;

// Calculate signature
const dataString = JSON.stringify(data);
const calculatedSignature = crypto
  .createHmac('sha256', secret)
  .update(dataString)
  .digest('hex');

// Compare safely (prevents timing attacks)
const receivedSignature = $json.body.signature;
const isValid = crypto.timingSafeEqual(
  Buffer.from(calculatedSignature),
  Buffer.from(receivedSignature)
);

return {
  isValid: isValid,
  received: receivedSignature,
  calculated: calculatedSignature
};
```

---

## 🚨 Error Responses Template

### In Error Handler Node:

```javascript
return {
  success: false,
  error: $error.message,
  code: $error.statusCode || 400,
  orderId: $json?.body?.orderId || "unknown",
  timestamp: new Date().toISOString()
};
```

### Then Respond:

```
Node: Response to Webhook

Status: {{$json.code}}
Body: {{$json}}
```

---

## 📚 Key Files to Reference

```
Frontend: /src/services/checkoutService-new.ts
  └─ What payload is being sent?

Frontend: /src/lib/n8n-config.ts
  └─ What's the interface structure?

Frontend: /src/lib/checkout-signature.ts
  └─ How is signature calculated?

Backend: /api/checkout/create-payment
  └─ Validates signature before n8n

This Doc: N8N_PAYLOAD_EXEMPLO_REAL.md
  └─ Example JSON payload

This Doc: N8N_IMPLEMENTATION_CHECKLIST.md
  └─ Detailed step-by-step
```

---

## 💡 Pro Tips

1. **Test incrementally**: Build 1-2 nodes at a time, test
2. **Use Set nodes**: To prepare/transform data before loops
3. **Add logging**: `console.log()` in Execute nodes
4. **Use Slack alerts**: For fraud detections
5. **Mock Firestore**: Test without Firebase first
6. **Error handlers**: Add at each critical point
7. **Document**: Add comments in nodes about what they do

---

## 🎯 Success Criteria

```
✅ Webhook receives POST from frontend
✅ Parse JSON correctly
✅ Validate required fields
✅ Query Firestore without errors
✅ Validate order data
✅ Loop through products
✅ For each product: validate existence, price, stock
✅ Validate total amount
✅ Validate HMAC-SHA256 signature
✅ Extract Asaas data
✅ Send to Asaas API
✅ Receive checkoutUrl back
✅ Update Firestore with payment ID
✅ Respond 200 OK with checkoutUrl
✅ Frontend receives and redirects to Asaas
✅ Test price tampering → 403 Forbidden
✅ Test insufficient stock → 422 Unprocessable
✅ Test invalid signature → 403 Forbidden
```

---

## 🔍 Debugging Tips

### If webhook not receiving:
```
- Check webhook URL in frontend
- Verify n8n webhook is deployed
- Check n8n logs for errors
- Use Postman to test manually
```

### If Firestore query fails:
```
- Verify Firebase credentials in n8n
- Check collection names (case-sensitive!)
- Test with known document IDs
- Check Firestore security rules
```

### If signature validation fails:
```
- Verify secret key is same in frontend + n8n
- Check data is stringified same way
- Verify HMAC algorithm is sha256
- Use console.log to compare signatures
```

### If Asaas API returns error:
```
- Check API key in n8n env vars
- Verify payload format matches Asaas spec
- Check totalAmount is number, not string
- Verify items array format
- Review Asaas docs for specific errors
```

---

## 📞 Quick Reference - API Endpoints

```
Frontend: POST /api/checkout/create-payment (optional, used for signature validation)
N8N Webhook: POST https://n8n.yourapp.com/webhook/checkout
Asaas API: POST https://api.asaas.com/v3/payments
```

---

## 🎓 Learning Path

If you're new to n8n:

1. **Basics**: https://docs.n8n.io/
2. **HTTP Trigger**: https://docs.n8n.io/nodes/n8n-nodes-base.httprequest/
3. **Firestore**: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.firebasefirestoredb/
4. **JavaScript**: https://docs.n8n.io/nodes/n8n-nodes-base.executecommand/
5. **Error Handling**: https://docs.n8n.io/workflows/error-handling/

---

## ✨ Next Steps

```
1. Read: N8N_PAYLOAD_EXEMPLO_REAL.md (understand the data)
2. Read: N8N_WORKFLOW_VISUAL_DIAGRAM.md (understand the flow)
3. Read: N8N_IMPLEMENTATION_CHECKLIST.md (implement step by step)
4. Build: Start with Phase 1 (30 min)
5. Test: Use Postman to send sample payloads
6. Deploy: Push to production when ready
```

---

**Bora começa?! 🚀**

Abra `N8N_IMPLEMENTATION_CHECKLIST.md` e vamos implementar!
