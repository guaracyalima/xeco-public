# N8N - Exemplo Real de Payload Recebido

## 📥 Exemplo Completo: POST Webhook

### Cenário Real
```
User: João Silva
Company: Loja de Roupas XYZ
Products: Camiseta + Calça + Meia
Total: R$ 318.20
```

---

## 📋 Payload Completo (JSON)

```json
{
  "orderId": "order-2025-10-21-001",
  "userId": "user-9f2c3d4e5f6g7h8i9j0k",
  "companyId": "company-abc123def456",
  "companyWalletId": "wallet-xyz789",
  "totalAmount": 318.20,
  
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Básica Preta",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 150.50
    },
    {
      "productId": "prod-calca-002",
      "productName": "Calça Jeans Premium",
      "quantity": 1,
      "unitPrice": 120.00,
      "totalPrice": 120.00
    },
    {
      "productId": "prod-meia-003",
      "productName": "Meia Esportiva",
      "quantity": 3,
      "unitPrice": 15.90,
      "totalPrice": 47.70
    }
  ],
  
  "customerData": {
    "name": "João Silva",
    "cpfCnpj": "12345678900",
    "email": "joao@email.com",
    "phone": "11987654321",
    "address": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310100",
      "complement": "Apt 42"
    }
  },
  
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED"],
  "dueDate": "2025-10-28",
  
  "items": [
    {
      "externalReference": "prod-camiseta-001",
      "productId": "prod-camiseta-001",
      "description": "Camiseta Básica Preta - Quantidade: 2",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      "name": "Camiseta Básica Preta",
      "quantity": 2,
      "value": 150.50,
      "unitPrice": 75.25
    },
    {
      "externalReference": "prod-calca-002",
      "productId": "prod-calca-002",
      "description": "Calça Jeans Premium - Quantidade: 1",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      "name": "Calça Jeans Premium",
      "quantity": 1,
      "value": 120.00,
      "unitPrice": 120.00
    },
    {
      "externalReference": "prod-meia-003",
      "productId": "prod-meia-003",
      "description": "Meia Esportiva - Quantidade: 3",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      "name": "Meia Esportiva",
      "quantity": 3,
      "value": 47.70,
      "unitPrice": 15.90
    }
  ],
  
  "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

---

## 🔍 Estrutura Por Seção

### 1️⃣ DADOS INTERNOS (Auditoria)

```json
{
  "orderId": "order-2025-10-21-001",
  "userId": "user-9f2c3d4e5f6g7h8i9j0k",
  "companyId": "company-abc123def456",
  "companyWalletId": "wallet-xyz789"
}
```

**O que n8n valida:**
- ✓ orderId existe em Firestore?
- ✓ userId existe em Firestore?
- ✓ companyId existe em Firestore?
- ✓ Order status == PENDING_PAYMENT?

---

### 2️⃣ DADOS DE PRODUTOS (ProductList)

```json
{
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Básica Preta",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 150.50
    }
  ]
}
```

**O que n8n valida:**
```
Para CADA produto:

1. Query Firestore: products/{productId}
   └─ Existe? ✓

2. Validate name:
   └─ productName == DB name? ✓

3. Validate price:
   └─ unitPrice == DB salePrice? ✓ (FRAUD CHECK!)

4. Validate stock:
   └─ quantity <= DB stock? ✓

5. Validate total:
   └─ totalPrice == quantity × unitPrice? ✓

6. Acumular:
   └─ Sum all totalPrice
```

---

### 3️⃣ DADOS DE CLIENTE (CustomerData)

```json
{
  "customerData": {
    "name": "João Silva",
    "cpfCnpj": "12345678900",
    "email": "joao@email.com",
    "phone": "11987654321",
    "address": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310100",
      "complement": "Apt 42"
    }
  }
}
```

**O que Asaas precisa:**
- Nome, CPF/CNPJ, email, telefone, endereço
- Tudo enviado para Asaas sem modificação

---

### 4️⃣ CONFIGURAÇÃO DO CHECKOUT (Asaas)

```json
{
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED"],
  "dueDate": "2025-10-28",
  "totalAmount": 318.20
}
```

**O que significa:**
- `billingTypes`: Cliente pode pagar com Cartão ou PIX
- `chargeTypes`: Cobrança destacada (não é recorrente)
- `dueDate`: Data de vencimento
- `totalAmount`: Total a cobrar (R$ 318.20)

---

### 5️⃣ ITENS PARA EXIBIÇÃO (Items)

```json
{
  "items": [
    {
      "externalReference": "prod-camiseta-001",
      "productId": "prod-camiseta-001",
      "description": "Camiseta Básica Preta - Quantidade: 2",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      "name": "Camiseta Básica Preta",
      "quantity": 2,
      "value": 150.50,
      "unitPrice": 75.25
    }
  ]
}
```

**O que Asaas faz:**
- Exibe nome, imagem, quantidade no checkout
- Mostra preço unitário e total
- Cliente vê exatamente o que vai pagar

---

### 6️⃣ ASSINATURA HMAC-SHA256 (Segurança)

```json
{
  "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

**O que n8n valida:**
```javascript
// Frontend enviou isso:
const data = {
  companyId: "company-abc123def456",
  totalAmount: 318.20,
  items: [
    { productId: "prod-camiseta-001", quantity: 2, unitPrice: 75.25 },
    { productId: "prod-calca-002", quantity: 1, unitPrice: 120.00 },
    { productId: "prod-meia-003", quantity: 3, unitPrice: 15.90 }
  ]
};

// Frontend calculou:
signature = HMAC-SHA256(JSON.stringify(data), secret)
           = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

// N8N recalcula:
calculatedSignature = HMAC-SHA256(JSON.stringify(data), secret)

// N8N compara:
if (timingSafeEqual(signature, calculatedSignature)) {
  // ✅ Válido! Frontend não tampou nada
} else {
  // ❌ FRAUDE! Preço ou quantidade foi alterado
  return 403 Forbidden
}
```

---

## ✅ Validações em Sequence

### Fluxo de Validação Passo a Passo

```
RECEBIMENTO
├─ Parse JSON ✓
└─ Campos obrigatórios presentes? ✓

AUDITORIA
├─ Order existe? ✓
├─ Order customerId == userId? ✓
├─ Order company == companyId? ✓
├─ Order status == PENDING_PAYMENT? ✓
├─ User existe? ✓
├─ Company existe? ✓
└─ Company active? ✓

PRODUTOS (LOOP)
├─ Produto 1
│  ├─ Existe? ✓
│  ├─ Nome matches? ✓
│  ├─ Preço matches? ✓ ← FRAUD CHECK!
│  ├─ Estoque >= qty? ✓
│  └─ Total == qty × preço? ✓
├─ Produto 2 (idem)
├─ Produto 3 (idem)
└─ Total Geral
   └─ Sum(totais) == totalAmount? ✓

SEGURANÇA
├─ Signature HMAC-SHA256? ✓
└─ timingSafeEqual() passed? ✓

ASAAS
├─ HTTP POST /v3/payments ✓
└─ Response checkoutUrl recebido? ✓

FINALIZAÇÃO
├─ Update Order no Firestore ✓
├─ Store asaasPaymentId ✓
├─ Store checkoutUrl ✓
└─ Response 200 OK ✓
```

---

## 🎯 Validações Críticas (Fraude)

### ⚠️ Cenário 1: Tamper com Preço

```
ORIGINAL (Frontend enviou):
{
  "productId": "prod-camiseta-001",
  "unitPrice": 75.25,
  "totalPrice": 150.50
}

TAMPERADO (DevTools modificou):
{
  "productId": "prod-camiseta-001",
  "unitPrice": 10.00,        ← ALTERADO!
  "totalPrice": 20.00        ← ALTERADO!
}

N8N DETECTA:
1. Signature check falha (preço está diferente)
   → 403 Forbidden ❌
   
OU

2. Se signature foi recalculada (offline):
   Price validation: 10.00 != 75.25
   → 400 Bad Request ❌
   → Alert Slack: POSSIBLE_FRAUD
```

---

### ⚠️ Cenário 2: Tamper com Quantidade

```
ORIGINAL:
{
  "productId": "prod-camiseta-001",
  "quantity": 2,
  "unitPrice": 75.25,
  "totalPrice": 150.50
}

TAMPERADO (Aumentou quantidade):
{
  "productId": "prod-camiseta-001",
  "quantity": 100,           ← ALTERADO!
  "totalPrice": 7525.00      ← ALTERADO!
}

N8N DETECTA:
1. Signature check falha
   → 403 Forbidden ❌
   
OU

2. Item total validation: 7525.00 != (100 × 75.25)
   Actually this would match... but...
   
3. totalAmount mismatch:
   Sum(products) = 8265.50 (grande demais)
   vs totalAmount = 318.20
   → 400 Bad Request ❌
   → Alert Slack: TOTAL_MISMATCH
```

---

### ⚠️ Cenário 3: Remove Produto

```
ORIGINAL:
[
  { productId: "prod-1", ..., totalPrice: 150.50 },
  { productId: "prod-2", ..., totalPrice: 120.00 },
  { productId: "prod-3", ..., totalPrice: 47.70 }
]
Total: 318.20

TAMPERADO (Removeu produto 3):
[
  { productId: "prod-1", ..., totalPrice: 150.50 },
  { productId: "prod-2", ..., totalPrice: 120.00 }
]
Total (recalculado): 270.50

N8N DETECTA:
1. Signature check: Produz hash diferente
   → 403 Forbidden ❌
   
OU

2. If offline recalculated:
   totalAmount (318.20) != sum(270.50)
   → 400 Bad Request ❌
```

---

## 📊 Exemplo de Validação de Estoque

### Firestore - products Collection

```json
{
  "id": "prod-camiseta-001",
  "name": "Camiseta Básica Preta",
  "salePrice": 75.25,
  "stock": 50,
  "active": true
}
```

### Payload Recebido

```json
{
  "productId": "prod-camiseta-001",
  "productName": "Camiseta Básica Preta",
  "quantity": 2,
  "unitPrice": 75.25
}
```

### Validação em N8N

```
Step 1: Query Firestore
└─ products/prod-camiseta-001

Step 2: Verify fields
├─ name == productName? ✓ ("Camiseta Básica Preta" == "Camiseta Básica Preta")
├─ salePrice == unitPrice? ✓ (75.25 == 75.25)
└─ stock >= quantity? ✓ (50 >= 2)

Step 3: All OK!
└─ Continue to next product
```

---

## 🚨 Error Responses

### Erro 1: Missing Field

```json
{
  "success": false,
  "error": "MISSING_FIELD",
  "code": 400,
  "message": "Required field missing: productList",
  "orderId": "unknown",
  "timestamp": "2025-10-21T14:30:45Z"
}
```

---

### Erro 2: Product Not Found

```json
{
  "success": false,
  "error": "PRODUCT_NOT_FOUND",
  "code": 404,
  "message": "Product prod-camiseta-001 not found in Firestore",
  "orderId": "order-2025-10-21-001",
  "productId": "prod-camiseta-001",
  "timestamp": "2025-10-21T14:30:46Z"
}
```

---

### Erro 3: Price Mismatch (FRAUD!)

```json
{
  "success": false,
  "error": "PRICE_MISMATCH",
  "code": 400,
  "message": "Price tampering detected!",
  "orderId": "order-2025-10-21-001",
  "productId": "prod-camiseta-001",
  "expected": 75.25,
  "received": 10.00,
  "timestamp": "2025-10-21T14:30:47Z",
  "alert": "Slack notification sent to #fraud-alerts"
}
```

---

### Erro 4: Invalid Signature (FRAUD!)

```json
{
  "success": false,
  "error": "INVALID_SIGNATURE",
  "code": 403,
  "message": "Signature validation failed - possible tampering detected",
  "orderId": "order-2025-10-21-001",
  "timestamp": "2025-10-21T14:30:48Z",
  "alert": "Slack notification sent to #fraud-alerts"
}
```

---

### Erro 5: Insufficient Stock

```json
{
  "success": false,
  "error": "INSUFFICIENT_STOCK",
  "code": 422,
  "message": "Insufficient stock for product",
  "orderId": "order-2025-10-21-001",
  "productId": "prod-camiseta-001",
  "requested": 100,
  "available": 5,
  "timestamp": "2025-10-21T14:30:49Z"
}
```

---

## ✨ Success Response

```json
{
  "success": true,
  "checkoutUrl": "https://checkout.asaas.com/link/abc123def456ghi789",
  "message": "Checkout criado com sucesso",
  "orderId": "order-2025-10-21-001",
  "asaasPaymentId": "pay_xyz789abc123",
  "timestamp": "2025-10-21T14:30:50Z"
}
```

**Frontend depois recebe isso:**
```javascript
// Redireciona para checkout
window.location.href = response.checkoutUrl

// Cliente paga no checkout do Asaas
// Depois volta para seu app
```

---

## 🔗 Webhook Completo (Para Copiar/Colar)

```
POST https://n8n.yourapp.com/webhook/checkout

Content-Type: application/json

{
  "orderId": "order-2025-10-21-001",
  "userId": "user-9f2c3d4e5f6g7h8i9j0k",
  "companyId": "company-abc123def456",
  "companyWalletId": "wallet-xyz789",
  "totalAmount": 318.20,
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Básica Preta",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 150.50
    },
    {
      "productId": "prod-calca-002",
      "productName": "Calça Jeans Premium",
      "quantity": 1,
      "unitPrice": 120.00,
      "totalPrice": 120.00
    },
    {
      "productId": "prod-meia-003",
      "productName": "Meia Esportiva",
      "quantity": 3,
      "unitPrice": 15.90,
      "totalPrice": 47.70
    }
  ],
  "customerData": {
    "name": "João Silva",
    "cpfCnpj": "12345678900",
    "email": "joao@email.com",
    "phone": "11987654321",
    "address": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310100",
      "complement": "Apt 42"
    }
  },
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED"],
  "dueDate": "2025-10-28",
  "items": [
    {
      "externalReference": "prod-camiseta-001",
      "productId": "prod-camiseta-001",
      "description": "Camiseta Básica Preta - Quantidade: 2",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      "name": "Camiseta Básica Preta",
      "quantity": 2,
      "value": 150.50,
      "unitPrice": 75.25
    },
    {
      "externalReference": "prod-calca-002",
      "productId": "prod-calca-002",
      "description": "Calça Jeans Premium - Quantidade: 1",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      "name": "Calça Jeans Premium",
      "quantity": 1,
      "value": 120.00,
      "unitPrice": 120.00
    },
    {
      "externalReference": "prod-meia-003",
      "productId": "prod-meia-003",
      "description": "Meia Esportiva - Quantidade: 3",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      "name": "Meia Esportiva",
      "quantity": 3,
      "value": 47.70,
      "unitPrice": 15.90
    }
  ],
  "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

---

**Tá pronto para implementar no n8n!** 🚀
