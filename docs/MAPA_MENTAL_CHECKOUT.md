# 🗺️ Mapa Mental: Checkout Implementation

## 🎯 Visão Geral Completa do Sistema

```
                           ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
                           ┃    USER FLOW                      ┃
                           ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                      ↓
                    ┌────────────────────────────────────┐
                    │ User clica \"Adicionar ao Carrinho\"    │
                    └────────────────────────────────────┘
                                      ↓
                    ┌────────────────────────────────────┐
                    │  ✅ Fase 1: CRIAR ORDER             │
                    │  (Imediately on addToCart)          │
                    │  Firebase Firestore                │
                    │  └─ Cria novo document orders/{id} │
                    │  └─ Status: PENDING_PAYMENT        │
                    │  └─ Armazena: userId, companyId    │
                    └────────────────────────────────────┘
                                      ↓
                    ┌────────────────────────────────────┐
                    │ User coleta dados e clica Checkout  │
                    └────────────────────────────────────┘
                                      ↓
        ┌───────────────────────────────────────────────────────────┐
        │ ✅ Fase 2: PREPARAR PAYLOAD                               │
        ├───────────────────────────────────────────────────────────┤
        │                                                           │
        │ ┌─ DADOS INTERNOS (Auditoria)                             │
        │ │  ├─ orderId (Firestore order ID)                       │
        │ │  ├─ userId (Firebase Auth ID)                          │
        │ │  └─ companyId (Firebase Company ID)                    │
        │ │                                                         │
        │ ├─ DADOS DE PRODUTOS (ProductList)                       │
        │ │  ├─ productId                                          │
        │ │  ├─ productName ← NOVO                                │
        │ │  ├─ quantity                                           │
        │ │  ├─ unitPrice ← NOVO                                  │
        │ │  └─ totalPrice ← NOVO (qty × unitPrice)              │
        │ │                                                         │
        │ ├─ DADOS DE CLIENTE (Asaas)                              │
        │ │  ├─ name                                               │
        │ │  ├─ cpfCnpj                                            │
        │ │  ├─ email                                              │
        │ │  ├─ phone                                              │
        │ │  └─ address                                            │
        │ │                                                         │
        │ ├─ DADOS PARA ASAAS                                      │
        │ │  ├─ items (com imagens base64)                         │
        │ │  ├─ billingTypes (CREDIT_CARD, PIX)                    │
        │ │  ├─ chargeTypes (DETACHED)                             │
        │ │  ├─ totalAmount                                        │
        │ │  └─ dueDate                                            │
        │ │                                                         │
        │ └─ SEGURANÇA (HMAC-SHA256)                                │
        │    └─ signature (companyId + totalAmount + items)         │
        │                                                           │
        └───────────────────────────────────────────────────────────┘
                                      ↓
        ┌───────────────────────────────────────────────────────────┐
        │ ✅ Fase 3: ENVIAR PARA N8N                                │
        ├───────────────────────────────────────────────────────────┤
        │                                                           │
        │ POST /webhook/checkout                                   │
        │ Content-Type: application/json                           │
        │ Body: {orderId, userId, companyId, productList,          │
        │        customerData, items, signature}                   │
        │                                                           │
        │ Frontend espera: {success, checkoutUrl}                  │
        │                                                           │
        └───────────────────────────────────────────────────────────┘
                                      ↓
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃ 🆕 N8N WORKFLOW (PRÓXIMA FASE - DOCUMENTADO)               ┃
        ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
        ┃                                                            ┃
        ┃ 1️⃣  RECEIVE ┌─────────────────────────────────┐           ┃
        ┃    └──────→ │ HTTP POST Webhook Trigger        │           ┃
        ┃            └─────────────────────────────────┘            ┃
        ┃                          ↓                                 ┃
        ┃ 2️⃣  PARSE  ┌─────────────────────────────────┐           ┃
        ┃    └──────→ │ Execute Node (Log request)      │           ┃
        ┃            └─────────────────────────────────┘            ┃
        ┃                          ↓                                 ┃
        ┃ 3️⃣  VALIDATE ┌─────────────────────────────────┐          ┃
        ┃    FIELDS │ Check: orderId? userId?...        │          ┃
        ┃    └──────→ └─ If missing → 400 Error        ─┘          ┃
        ┃                          ↓                                 ┃
        ┃ 4️⃣  QUERY   ┌─────────────────────────────────┐           ┃
        ┃    FIRESTORE │ Firestore: Query orders/{id}    │           ┃
        ┃    └──────→ │ Validate: status=PENDING_PAYMENT │           ┃
        ┃            └─ If not found → 404 Error ─┘            ┃
        ┃                          ↓                                 ┃
        ┃ 5️⃣  VALIDATE ┌─────────────────────────────────┐          ┃
        ┃    DATA     │ Query users/{userId}            │          ┃
        ┃    └──────→ │ Query companies/{companyId}      │          ┃
        ┃            │ Validate: active=true             │          ┃
        ┃            └─ If error → 404/403 Error ─┘            ┃
        ┃                          ↓                                 ┃
        ┃ 6️⃣  LOOP    ┌─────────────────────────────────┐           ┃
        ┃    PRODUCTS │ For each product in productList  │           ┃
        ┃    └──────→ └─────────────────────────────────┘            ┃
        ┃            ┌─ Loop item 1                 ┐               ┃
        ┃            │ ├─ Query products/{id}      │               ┃
        ┃            │ ├─ Validate: exists?        │               ┃
        ┃            │ ├─ Validate: name matches?  │               ┃
        ┃            │ ├─ Validate: price matches? │ FRAUD CHECK    ┃
        ┃            │ ├─ Validate: stock >= qty?  │               ┃
        ┃            │ ├─ Validate: total correct? │               ┃
        ┃            │ └─ Accumulate total         │               ┃
        ┃            ├─ Loop item 2 (idem)        │               ┃
        ┃            ├─ Loop item 3 (idem)        │               ┃
        ┃            └─ ...                        ┘               ┃
        ┃                          ↓                                 ┃
        ┃ 7️⃣  VALIDATE ┌─────────────────────────────────┐          ┃
        ┃    TOTAL    │ Check: sum(totals) == totalAmount│          ┃
        ┃    └──────→ └─ If wrong → 400 Error ─┘            ┃
        ┃                          ↓                                 ┃
        ┃ 8️⃣  HMAC    ┌─────────────────────────────────┐           ┃
        ┃    SHA256   │ Execute: HMAC-SHA256 calculation│           ┃
        ┃    └──────→ │ Use: timingSafeEqual comparison │           ┃
        ┃            └─ If invalid → 403 FRAUD! ─┘            ┃
        ┃                          ↓                                 ┃
        ┃ 9️⃣  EXTRACT ┌─────────────────────────────────┐           ┃
        ┃    ASAAS    │ Remove: orderId, userId,        │           ┃
        ┃    DATA     │ companyId, productList,         │           ┃
        ┃    └──────→ │ signature                       │           ┃
        ┃            │ Keep: items, customer, etc       │           ┃
        ┃            └─────────────────────────────────┘            ┃
        ┃                          ↓                                 ┃
        ┃ 🔟  ASAAS   ┌─────────────────────────────────┐            ┃
        ┃    API      │ HTTP POST /v3/payments          │            ┃
        ┃    └──────→ │ Response: {id, checkoutUrl}     │            ┃
        ┃            └─ If error → 500 Error ─┘            ┃
        ┃                          ↓                                 ┃
        ┃ 1️⃣1️⃣ UPDATE  ┌─────────────────────────────────┐           ┃
        ┃    FIRESTORE │ Update orders/{orderId}        │            ┃
        ┃    └──────→ │ asaasPaymentId, checkoutUrl     │            ┃
        ┃            │ status=CHECKOUT_CREATED         │            ┃
        ┃            └─────────────────────────────────┘            ┃
        ┃                          ↓                                 ┃
        ┃ 1️⃣2️⃣ RESPOND ┌─────────────────────────────────┐           ┃
        ┃    FRONTEND │ 200 OK                          │            ┃
        ┃    └──────→ │ {success: true, checkoutUrl}    │            ┃
        ┃            └─────────────────────────────────┘            ┃
        ┃                                                            ┃
        ┃ 💥 ERROR HANDLING (Qualquer ponto)                        ┃
        ┃    ├─ 400 Bad Request (validation error)                  ┃
        ┃    ├─ 403 Forbidden (fraud detected!)                     ┃
        ┃    ├─ 404 Not Found (missing data)                        ┃
        ┃    ├─ 422 Unprocessable (insufficient stock)              ┃
        ┃    └─ 500 Internal (API error)                            ┃
        ┃       + Log to console/Slack                              ┃
        ┃       + Update Order status to FAILED                     ┃
        ┃                                                            ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                      ↓
                    ┌────────────────────────────────────┐
                    │  Frontend recebe checkoutUrl       │
                    │  Redireciona para Asaas            │
                    └────────────────────────────────────┘
                                      ↓
                    ┌────────────────────────────────────┐
                    │  Asaas Payment Gateway             │
                    │  ├─ Exibe items (com fotos)        │
                    │  ├─ Mostra preços                  │
                    │  ├─ Opções: Cartão/PIX             │
                    │  └─ Cliente completa pagamento     │
                    └────────────────────────────────────┘
                                      ↓
                    ┌────────────────────────────────────┐
                    │  ✅ PAGAMENTO REALIZADO!           │
                    │  Asaas webhook → Order updated     │
                    └────────────────────────────────────┘
```

---

## 📊 Matriz de Responsabilidades

```
┌────────────────────┬──────────────────────────────────────────────┐
│ COMPONENTE         │ RESPONSABILIDADE                             │
├────────────────────┼──────────────────────────────────────────────┤
│ Frontend           │ ✅ Coletar dados                             │
│ (React/Next.js)    │ ✅ Criar Order no Firestore                  │
│                    │ ✅ Preparar payload completo                 │
│                    │ ✅ Calcular HMAC-SHA256                      │
│                    │ ✅ Enviar POST para n8n                      │
│                    │ ✅ Redirecionar para Asaas                   │
│                    │                                              │
│ N8N (Orquestrador) │ ⏳ Receber webhook POST                      │
│                    │ ⏳ Validar dados internos                     │
│                    │ ⏳ Validar produtos & estoque                 │
│                    │ ⏳ Validar totais                             │
│                    │ ⏳ Validar signature HMAC                     │
│                    │ ⏳ Enviar para Asaas API                      │
│                    │ ⏳ Atualizar Firestore                        │
│                    │ ⏳ Error handling                             │
│                    │                                              │
│ Firebase           │ ✅ Armazenar Orders                          │
│ (Firestore)        │ ✅ Query Products para validação             │
│                    │ ✅ Update Order status                       │
│                    │                                              │
│ Asaas              │ ✅ Processar pagamento                       │
│ (Payment Gateway)  │ ✅ Retornar checkoutUrl                      │
│                    │ ✅ Enviar status via webhook                 │
└────────────────────┴──────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados (Data Flow)

```
FRONTEND              N8N                    ASAAS            FIRESTORE
   │                  │                       │                   │
   │─ POST ───────────→│                       │                   │
   │  {payload}       │                       │                   │
   │                  │                       │                   │
   │                  │─ Query ───────────────────────────────────→│
   │                  │  (Order/User/Company)                     │
   │                  │←───────────────────────────────────────── │
   │                  │  {result}                                  │
   │                  │                       │                   │
   │                  │─ Query ───────────────────────────────────→│
   │                  │  (Products)                                │
   │                  │←───────────────────────────────────────── │
   │                  │  {result}                                  │
   │                  │                       │                   │
   │                  │─ POST ────────────────→│                   │
   │                  │  (Asaas data)         │                   │
   │                  │←────────────────────── │                   │
   │                  │  {checkoutUrl}        │                   │
   │                  │                       │                   │
   │                  │─ Update ──────────────────────────────────→│
   │                  │  (asaasPaymentId)                          │
   │                  │←───────────────────────────────────────── │
   │                  │  {ack}                                     │
   │                  │                       │                   │
   │←─ 200 OK ────────│                       │                   │
   │  {checkoutUrl}   │                       │                   │
   │                  │                       │                   │
   │─ Redirect ──────────────────────────────→│                   │
   │  (to checkoutUrl)                        │                   │
   │                  │                       │ (Payment)         │
   │                  │                       │ (Webhook)         │
   │                  │←───────────────────────────────────────── │
   │                  │  (Status update)      │                   │
   │                  │                       │                   │
   │                  │─ Update ──────────────────────────────────→│
   │                  │  (payment status)                          │
   │                  │                       │                   │
   └────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Validações em Cascade

```
              ┌─ Frontend ─────────────────────────────────┐
              │ 1. Validar campos obrigatórios            │
              │ 2. Calcular HMAC-SHA256                   │
              │ 3. Validar formato JSON                   │
              └─────────────────┬──────────────────────────┘
                                ↓
              ┌─ API Route ────────────────────────────────┐
              │ 1. Validar signature HMAC                 │
              │ 2. Verificar integração básica            │
              └─────────────────┬──────────────────────────┘
                                ↓
              ┌─ N8N Workflow ─────────────────────────────┐
              │                                             │
              │ 1️⃣ Auditoria:                               │
              │    ├─ Order existe?                        │
              │    ├─ User existe?                         │
              │    └─ Company existe?                      │
              │                                             │
              │ 2️⃣ Produtos:                                │
              │    ├─ Cada produto existe?                 │
              │    ├─ Preço correto?  ← FRAUD CHECK!      │
              │    ├─ Estoque suficiente?                  │
              │    └─ Total correto?                       │
              │                                             │
              │ 3️⃣ Segurança:                               │
              │    └─ HMAC-SHA256 válida?                 │
              │                                             │
              │ 4️⃣ Integridade:                             │
              │    └─ Totais conferem?                     │
              │                                             │
              └─────────────────┬──────────────────────────┘
                                ↓
              ┌─ Asaas API ────────────────────────────────┐
              │ 1. Validações internas do Asaas           │
              │ 2. Processamento do pagamento             │
              │ 3. Retorno de status                      │
              └────────────────────────────────────────────┘
```

---

## 📋 Status Checklist

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND IMPLEMENTATION                                 │
├─────────────────────────────────────────────────────────┤
│ ✅ Order creation at addToCart                         │
│ ✅ Internal data collection (orderId, userId, company) │
│ ✅ ProductList with full structure                     │
│ ✅ HMAC-SHA256 signature generation                    │
│ ✅ POST to n8n webhook                                 │
│ ✅ TypeScript compilation: NO ERRORS                  │
│ ✅ Build: SUCCESS                                      │
│ ✅ Documentation: COMPLETE                             │
│                                                         │
│ STATUS: ✅ READY FOR N8N                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ N8N IMPLEMENTATION                                      │
├─────────────────────────────────────────────────────────┤
│ 🆕 Documentation created: 4 files                       │
│ 🆕 START_HERE guide: Complete                          │
│ 🆕 Payload examples: Complete                          │
│ 🆕 Visual diagrams: Complete                           │
│ 🆕 Checklist: Complete                                 │
│                                                         │
│ ⏳ Webhook trigger: NOT STARTED                         │
│ ⏳ Auditoria validation: NOT STARTED                    │
│ ⏳ Product validation: NOT STARTED                      │
│ ⏳ Security validation: NOT STARTED                     │
│ ⏳ Asaas integration: NOT STARTED                       │
│ ⏳ Error handling: NOT STARTED                          │
│ ⏳ Testing: NOT STARTED                                 │
│                                                         │
│ STATUS: ⏳ READY TO START IMPLEMENTATION               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TESTING                                                 │
├─────────────────────────────────────────────────────────┤
│ ⏳ Happy path test: NOT STARTED                         │
│ ⏳ Price tampering: NOT STARTED                         │
│ ⏳ Insufficient stock: NOT STARTED                      │
│ ⏳ Invalid signature: NOT STARTED                       │
│ ⏳ End-to-end: NOT STARTED                              │
│                                                         │
│ STATUS: ⏳ DOCUMENTED                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 Learning Path

```
START
  │
  ├─→ 📚 Understand Frontend (5 min)
  │   └─ How data flows from React
  │
  ├─→ 📚 Understand N8N Basics (10 min)
  │   ├─ What is webhook trigger?
  │   ├─ What are nodes?
  │   └─ What is conditional logic?
  │
  ├─→ 📖 Read: N8N_START_HERE.md (5 min)
  │   └─ Quick summary of what you'll do
  │
  ├─→ 📖 Read: N8N_PAYLOAD_EXEMPLO_REAL.md (5 min)
  │   └─ See real example of data
  │
  ├─→ 🎨 Read: N8N_WORKFLOW_VISUAL_DIAGRAM.md (10 min)
  │   └─ Visualize complete flow
  │
  ├─→ 🛠️ Read: N8N_IMPLEMENTATION_CHECKLIST.md (25 min)
  │   └─ Start building nodes
  │
  ├─→ 🧪 Run Test Cases (60 min)
  │   ├─ Happy path
  │   ├─ Error cases
  │   └─ Fraud scenarios
  │
  └─→ ✅ COMPLETE!
```

---

_Documento criado: 21 de outubro de 2025_  
_Propósito: Visualização completa do sistema_  
_Status: Ready for implementation_
