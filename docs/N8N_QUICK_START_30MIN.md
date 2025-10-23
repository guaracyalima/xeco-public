# ⚡ 30-MINUTE N8N SETUP - QUICK START

## 🔥 Objetivo: Ter workflow funcionando em 30 minutos

---

## ⏱️ FASE 1: Setup Webhook (5 minutos)

### Step 1: Criar novo workflow
```
N8N Dashboard → Create → New workflow
```

### Step 2: Add HTTP Webhook
```
Nodes → Add node → Trigger → Webhook
├─ Method: POST
├─ Path: checkout
├─ Response Mode: "Last node response"
└─ Authentication: None
```

### Step 3: Deploy & Test
```
Click Deploy
Copy the webhook URL
```

**Teste com cURL:**
```bash
curl -X POST https://seu-n8n.com/webhook/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-001",
    "userId": "user-123",
    "companyId": "company-abc",
    "totalAmount": 100.00,
    "productList": [
      {
        "productId": "prod-1",
        "productName": "Test",
        "quantity": 1,
        "unitPrice": 100.00,
        "totalPrice": 100.00
      }
    ],
    "signature": "test"
  }'
```

---

## ⏱️ FASE 2: Parse & Validate (5 minutos)

### Step 1: Add Execute Node
```
Add node → Core → Execute
Name: "Log Entry"
Language: JavaScript

Code:
const timestamp = new Date().toISOString();
const orderId = $json.body?.orderId || 'unknown';
const totalAmount = $json.body?.totalAmount || 0;

console.log(`[${timestamp}] Order: ${orderId}, Amount: ${totalAmount}`);

return {
  timestamp,
  orderId,
  totalAmount,
  received: true
};
```

### Step 2: Connect
```
Webhook → Log Entry
```

### Step 3: Test
```
Run workflow
Check logs
Should see: Order: test-001, Amount: 100
```

---

## ⏱️ FASE 3: Firestore Query (5 minutos)

### Step 1: Add Firestore Query Node
```
Add node → Firebase Firestore

Collection: orders
Filter: Document ID equals {{$json.body.orderId}}
```

### Step 2: Configure Credentials
```
Click "Create new credential"
Add Firebase service account JSON
Test connection
```

### Step 3: Connect & Test
```
Log Entry → Query Order
Run workflow
Should return order document
```

---

## ⏱️ FASE 4: Validate Data (5 minutos)

### Step 1: Add If Node
```
Add node → Logic → If

Condition:
├─ $json.body exists
├─ $json.body.orderId exists
└─ $json.body.totalAmount > 0
```

### Step 2: Connect
```
Query Order → Validate Data
```

### Step 3: Add Error Branch
```
On FALSE branch → Response Node
Status: 400
Body: {"success": false, "error": "INVALID_DATA"}
```

---

## ⏱️ FASE 5: HMAC Signature (5 minutos)

### Step 1: Add Execute Node
```
Add node → Core → Execute
Name: "Validate Signature"
Language: JavaScript

Code:
const crypto = require('crypto');

const data = {
  companyId: $json.body.companyId,
  totalAmount: $json.body.totalAmount,
  items: $json.body.productList.map(p => ({
    productId: p.productId,
    quantity: p.quantity,
    unitPrice: p.unitPrice
  }))
};

const secret = process.env.CHECKOUT_SIGNATURE_SECRET;
const dataString = JSON.stringify(data);
const calculatedSig = crypto
  .createHmac('sha256', secret)
  .update(dataString)
  .digest('hex');

return {
  isValid: (calculatedSig === $json.body.signature),
  received: $json.body.signature,
  calculated: calculatedSig
};
```

### Step 2: Connect
```
Validate Data (TRUE) → Validate Signature
```

---

## ⏱️ FASE 6: Call Asaas (3 minutos)

### Step 1: Add HTTP Request Node
```
Add node → HTTP Request

URL: https://api.asaas.com/v3/payments
Method: POST
Headers:
├─ Content-Type: application/json
└─ X-API-KEY: {{$secret.ASAAS_API_KEY}}

Body:
{
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED"],
  "items": {{$json.body.items}},
  "customerData": {{$json.body.customerData}},
  "totalAmount": {{$json.body.totalAmount}}
}
```

### Step 2: Configure Secret
```
Settings → Environment Variables
Add: ASAAS_API_KEY=sk_live_xxxxx
```

### Step 3: Connect
```
Validate Signature → Call Asaas API
```

---

## ⏱️ FASE 7: Response (2 minutos)

### Step 1: Add Response Node
```
Add node → Response

Status: 200
Body:
{
  "success": true,
  "checkoutUrl": "{{$json.checkoutUrl}}",
  "orderId": "{{$json.body.orderId}}"
}
```

### Step 2: Connect
```
Call Asaas API → Response Success
```

---

## ✅ TESTING (DURANTE O SETUP)

### Test 1: Basic Request
```
curl -X POST https://seu-n8n.com/webhook/checkout \
  -H "Content-Type: application/json" \
  -d @payload.json
```

### Test 2: Missing Field
```
Remove orderId from JSON
Expect: 400 Error
```

### Test 3: Invalid Signature
```
Change signature to "invalid"
Expect: 403 Forbidden
```

---

## 🎯 AFTER 30 MINUTES

```
✅ Webhook receiving POST
✅ Parsing JSON
✅ Validating data
✅ Checking signature
✅ Calling Asaas API
✅ Returning response

✅ WORKFLOW FUNCTIONING!
```

---

## 📚 Next: Add Advanced Features

Once basic workflow is working:

1. Add Firestore updates
2. Add product validation loop
3. Add error handling
4. Add logging to Slack
5. Add database updates

---

## 💡 Debugging

**Se não funcionar:**

1. Check N8N logs
2. Verify Firebase credentials
3. Verify Asaas API key
4. Check environment variables
5. Test each node individually

---

## 🚀 You've Got This!

30 minutos e bora! 🔥
