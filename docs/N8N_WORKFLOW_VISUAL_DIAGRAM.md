# N8N Workflow - Visual Flow Diagram

## 🎯 Overview Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CHECKOUT N8N WORKFLOW                              │
│         (From Frontend HTTP POST → Asaas API → Order Updated)       │
└─────────────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 1️⃣  ENTRADA: HTTP POST Webhook                                   ┃
┃    URL: https://n8n.yourapp.com/webhook/checkout                 ┃
┃    Body: {orderId, userId, companyId, totalAmount, ...}          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 2️⃣  PARSE: Execute Node (Log Recebimento)                        ┃
┃    ├─ timestamp: now                                              ┃
┃    ├─ orderId: received                                           ┃
┃    ├─ totalAmount: received                                       ┃
┃    └─ productCount: received                                      ┃
┃                                                                    ┃
┃    Output: Logged to Console/Slack                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 3️⃣  VALIDAR: Campos Obrigatórios                                 ┃
┃    ├─ orderId? ✓                                                  ┃
┃    ├─ userId? ✓                                                   ┃
┃    ├─ companyId? ✓                                                ┃
┃    ├─ totalAmount > 0? ✓                                          ┃
┃    ├─ productList[] ? ✓                                           ┃
┃    └─ signature? ✓                                                ┃
┃                                                                    ┃
┃    ❌ Se falhar → Error 400 Bad Request                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 4️⃣  FIRESTORE: Query Order                                       ┃
┃    Collection: orders                                              ┃
┃    Filter: id = {{orderId}}                                        ┃
┃                                                                    ┃
┃    Validar:                                                        ┃
┃    ├─ Existe? ✓                                                   ┃
┃    ├─ customerId == userId? ✓                                     ┃
┃    ├─ company == companyId? ✓                                     ┃
┃    └─ status == PENDING_PAYMENT? ✓                                ┃
┃                                                                    ┃
┃    ❌ Se falhar → Error 404/403/409                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 5️⃣  FIRESTORE: Query User                                        ┃
┃    Collection: users                                               ┃
┃    Filter: id = {{userId}}                                         ┃
┃                                                                    ┃
┃    Validar:                                                        ┃
┃    └─ Existe? ✓                                                   ┃
┃                                                                    ┃
┃    ❌ Se falhar → Error 404 User Not Found                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 6️⃣  FIRESTORE: Query Company                                     ┃
┃    Collection: companies                                           ┃
┃    Filter: id = {{companyId}}                                      ┃
┃                                                                    ┃
┃    Validar:                                                        ┃
┃    ├─ Existe? ✓                                                   ┃
┃    └─ active == true? ✓                                           ┃
┃                                                                    ┃
┃    ❌ Se falhar → Error 404/403                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 7️⃣  LOOP: Para cada item em productList                         ┃
┃                                                                    ┃
┃    ┌─ Produto 1 (productId, quantity, unitPrice, totalPrice)    ┃
┃    │  ├─ FIRESTORE: Query products/{productId}                   ┃
┃    │  ├─ Validar: Existe? ✓                                      ┃
┃    │  ├─ Validar: Name matches? ✓ (detect tampering)             ┃
┃    │  ├─ Validar: Price matches? ✓ (FRAUD DETECTION!)            ┃
┃    │  ├─ Validar: Stock >= quantity? ✓                           ┃
┃    │  ├─ Validar: totalPrice == qty × unitPrice? ✓               ┃
┃    │  └─ Acumular: cumulativeTotal += totalPrice                 ┃
┃    │                                                               ┃
┃    ├─ Produto 2 (idem)                                            ┃
┃    │                                                               ┃
┃    ├─ Produto 3 (idem)                                            ┃
┃    │                                                               ┃
┃    └─ ...                                                          ┃
┃                                                                    ┃
┃    ❌ Se qualquer falhar:                                         ┃
┃       → Error 404 (not found)                                     ┃
┃       → Error 400 (mismatch/tampering)                            ┃
┃       → Error 422 (insufficient stock)                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 8️⃣  VALIDAR: Total Geral                                         ┃
┃    Condition: Math.abs(cumulativeTotal - totalAmount) < 0.01      ┃
┃                                                                    ┃
┃    ❌ Se falhar → Error 400 Total Amount Mismatch                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 9️⃣  SECURITY: Validar HMAC-SHA256 Signature                      ┃
┃    Execute Node (Crypto):                                          ┃
┃    ├─ Rebuild data: {companyId, totalAmount, items[]}             ┃
┃    ├─ Load secret: process.env.CHECKOUT_SIGNATURE_SECRET           ┃
┃    ├─ Calculate: HMAC-SHA256 (data with secret)                    ┃
┃    ├─ Compare: calculatedSignature === receivedSignature           ┃
┃    └─ Use: timingSafeEqual (prevent timing attacks)                ┃
┃                                                                    ┃
┃    ❌ Se falhar → Error 403 Forbidden (FRAUD!)                    ┃
┃       Alert: Slack notification sent                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔟  PREPARE: Extrair dados para Asaas                             ┃
┃    Remove (dados internos):                                        ┃
┃    ├─ orderId                                                      ┃
┃    ├─ userId                                                       ┃
┃    ├─ companyId                                                    ┃
┃    ├─ productList                                                  ┃
┃    └─ signature                                                    ┃
┃                                                                    ┃
┃    Keep (dados Asaas):                                             ┃
┃    ├─ billingTypes                                                 ┃
┃    ├─ chargeTypes                                                  ┃
┃    ├─ items (com imagens base64)                                   ┃
┃    ├─ customerData (nome, cpf, email, etc)                         ┃
┃    ├─ totalAmount                                                  ┃
┃    └─ dueDate                                                      ┃
┃                                                                    ┃
┃    Add metadata:                                                   ┃
┃    ├─ description: "Order: {{orderId}}"                            ┃
┃    └─ externalReference: "{{orderId}}"                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 1️⃣1️⃣  HTTP POST: Chamar Asaas API                                ┃
┃    URL: https://api.asaas.com/v3/payments                          ┃
┃    Method: POST                                                    ┃
┃    Header: X-API-KEY: {{ASAAS_API_KEY}}                            ┃
┃    Body: {{asaasPayload}}                                          ┃
┃                                                                    ┃
┃    Expected Response:                                              ┃
┃    {                                                               ┃
┃      "id": "pay_xxx",                                              ┃
┃      "object": "payment",                                          ┃
┃      "status": "PENDING",                                          ┃
┃      "checkoutUrl": "https://checkout.asaas.com/..."              ┃
┃    }                                                               ┃
┃                                                                    ┃
┃    ❌ Se falhar → Error 500 Asaas Error                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 1️⃣2️⃣  FIRESTORE: Update Order Document                           ┃
┃    Collection: orders                                              ┃
┃    Document: {{orderId}}                                           ┃
┃                                                                    ┃
┃    Update:                                                         ┃
┃    {                                                               ┃
┃      "asaasPaymentId": "pay_xxx",                                  ┃
┃      "checkoutUrl": "https://checkout.asaas.com/...",             ┃
┃      "status": "CHECKOUT_CREATED",                                 ┃
┃      "updatedAt": new Date().toISOString()                         ┃
┃    }                                                               ┃
┃                                                                    ┃
┃    ❌ Se falhar → Log erro mas continua                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 1️⃣3️⃣  RESPOND: Enviar resposta para Frontend                     ┃
┃    Status: 200 OK                                                  ┃
┃    Body:                                                           ┃
┃    {                                                               ┃
┃      "success": true,                                              ┃
┃      "checkoutUrl": "https://checkout.asaas.com/...",             ┃
┃      "message": "Checkout criado com sucesso"                     ┃
┃    }                                                               ┃
┃                                                                    ┃
┃    Frontend redireciona para checkoutUrl 🎉                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛


╔════════════════════════════════════════════════════════════════════╗
║                    ERROR HANDLING (Any point)                       ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ❌ ERROR TRIGGERED:                                              ║
║     ├─ Catch error in dedicated Error Node                        ║
║     ├─ Determine status code (400/403/404/409/422/500)            ║
║     ├─ Log to Console + Slack                                     ║
║     ├─ Update Order status to "CHECKOUT_FAILED"                   ║
║     ├─ Store error reason in Order document                       ║
║     └─ Respond with:                                              ║
║                                                                    ║
║        {                                                           ║
║          "success": false,                                         ║
║          "error": "PRICE_MISMATCH",                                ║
║          "message": "Expected 75.25, got 10.00",                  ║
║          "orderId": "order-123",                                   ║
║          "timestamp": "2025-10-21T14:30:50Z"                      ║
║        }                                                           ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 Node Configuration Summary

```
┌──────────────────────────────────────────────────────────────┐
│ NODE NAME              │ TYPE              │ PURPOSE          │
├──────────────────────────────────────────────────────────────┤
│ HTTP Webhook Trigger   │ Trigger (HTTP)    │ Receive POST     │
│ Log Entry              │ Execute (JS)      │ Log request      │
│ Validate Fields        │ Set               │ Validate basic   │
│ Query Order            │ Firestore         │ Get order data   │
│ Query User             │ Firestore         │ Get user data    │
│ Query Company          │ Firestore         │ Get company data │
│ Prepare Products Loop  │ Set               │ Prep array       │
│ Loop Products          │ Loop              │ Iterate items    │
│ Query Product          │ Firestore         │ Get prod data    │
│ Check Product Exists   │ If                │ Validate exists  │
│ Check Name Match       │ If                │ Fraud detect     │
│ Check Price Match      │ If                │ FRAUD DETECT!!   │
│ Check Stock            │ If                │ Validate stock   │
│ Check Item Total       │ If                │ Validate calc    │
│ Sum Totals             │ Execute (JS)      │ Accumulate       │
│ Check Total Amount     │ If                │ Validate sum     │
│ Validate Signature     │ Execute (JS)      │ HMAC-SHA256      │
│ Check Signature Valid  │ If                │ Fraud detect     │
│ Prepare Asaas Data     │ Set               │ Extract fields   │
│ Call Asaas API         │ HTTP Request      │ POST to Asaas    │
│ Update Order Asaas     │ Firestore         │ Store payment ID │
│ Response Success       │ Respond to Webhook│ Send checkoutUrl │
│ Error Handler          │ Error Handler     │ Catch all errors │
│ Respond Error          │ Respond to Webhook│ Send error msg   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔗 Data Flow Between Nodes

```
┌─────────────────┐
│ Frontend POST   │
│ {body: {...}}   │
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│ Parse & Log              │
│ $json = body             │
│ log(orderId, totalAmount)│
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│ Validate Fields          │
│ Check: orderId exist?    │
│ Check: totalAmount > 0?  │
│ etc                      │
└────────┬─────────────────┘
         │
         ├─(Success)→ Continue to Queries
         └─(Error)─→ Error Handler → 400 Response
         │
         ↓
┌──────────────────────────┐
│ Firestore Queries        │
│ Query orders, users, ...│
│ Store in $json.*         │
└────────┬─────────────────┘
         │
         ├─(Not Found)→ Error Handler → 404 Response
         └─(Found)────→ Prep Loop
         │
         ↓
┌──────────────────────────┐
│ Loop Products            │
│ For each: {productId}    │
│ $item = current item     │
└────────┬─────────────────┘
         │
         ├──(Loop)────→ Query Product
         │             Validate each field
         │             Accumulate total
         └─(Complete)→ Post-Loop Validation
         │
         ↓
┌──────────────────────────┐
│ Validate Total           │
│ cumulativeTotal          │
│ vs totalAmount           │
└────────┬─────────────────┘
         │
         ├─(Mismatch)→ Error Handler → 400
         └─(Match)───→ Signature Validation
         │
         ↓
┌──────────────────────────┐
│ Validate Signature       │
│ HMAC-SHA256 check        │
│ timingSafeEqual()        │
└────────┬─────────────────┘
         │
         ├─(Invalid)→ Error Handler → 403 (FRAUD!)
         └─(Valid)──→ Prepare Asaas Data
         │
         ↓
┌──────────────────────────┐
│ Extract Asaas Data       │
│ Remove: orderId,userId   │
│ Keep: items, customer    │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│ Call Asaas API           │
│ POST /v3/payments        │
│ Response: {id, url}      │
└────────┬─────────────────┘
         │
         ├─(Error)→ Error Handler → 500
         └─(Success)→ Update Order
         │
         ↓
┌──────────────────────────┐
│ Update Firestore         │
│ Store asaasPaymentId     │
│ Store checkoutUrl        │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│ Response 200 OK          │
│ {checkoutUrl, success}   │
│ Frontend redirects       │
└──────────────────────────┘
```

---

## 💡 Implementation Tips

1. **Use Set nodes** to prepare data before loops
2. **Use If nodes** for conditional branching
3. **Always log** before/after major steps
4. **Use Firestore carefully** - each query costs
5. **Implement error handling** at each critical point
6. **Test each node individually** before full workflow
7. **Use Slack alerts** for fraud detections
8. **Monitor Asaas API** rate limits
9. **Keep error messages clear** for debugging
10. **Document** each node's exact configuration

---

**Bora começar a implementar! 🚀**
