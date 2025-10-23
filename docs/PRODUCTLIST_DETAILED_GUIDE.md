# ProductList: Estrutura Completa e Detalhada

## 📝 O que é productList?

`productList` é um array que contém informações **completas** de cada produto comprado, incluindo:
- ID do produto
- Nome do produto
- Quantidade comprada
- Preço unitário
- Total desse produto na compra

**Propósito:** Auditoria, rastreamento e validação de itens no n8n

---

## 🔧 Estrutura de Cada Produto

```typescript
{
  productId: string        // ID único do produto no Firebase
  productName: string      // Nome do produto (para logs)
  quantity: number         // Quantidade comprada
  unitPrice: number        // Preço unitário (não pode ser 0)
  totalPrice: number       // quantidade × unitPrice (total do item)
}
```

---

## 💡 Exemplo Completo

### Request com 1 Produto

```json
{
  "productList": [
    {
      "productId": "prod-camiseta-preta-123",
      "productName": "Camiseta Preta Tamanho M",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 150.50
    }
  ]
}
```

### Request com Múltiplos Produtos

```json
{
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Preta",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 150.50
    },
    {
      "productId": "prod-calca-002",
      "productName": "Calça Jeans",
      "quantity": 1,
      "unitPrice": 120.00,
      "totalPrice": 120.00
    },
    {
      "productId": "prod-meia-003",
      "productName": "Meia",
      "quantity": 3,
      "unitPrice": 15.90,
      "totalPrice": 47.70
    }
  ]
}
```

**Total do carrinho:** 150.50 + 120.00 + 47.70 = **318.20**

---

## 🔍 Validações Esperadas no n8n

### 1. Cada Produto Deve Existir

```
Para cada item em productList:
  Query Firestore: products/{productId}
  If NOT found:
    → Error: "PRODUCT_NOT_FOUND"
```

### 2. Preço Deve Estar Correto

```
Para cada item em productList:
  current_price = Firebase: products/{productId}.salePrice
  received_price = productList[i].unitPrice
  
  If Math.abs(current_price - received_price) > 0.01:
    → Error: "PRICE_MISMATCH"
    → Include: expected: current_price, received: received_price
```

### 3. Quantidade Deve Estar em Estoque

```
Para cada item em productList:
  available_stock = Firebase: products/{productId}.stockQuantity
  requested_qty = productList[i].quantity
  
  If available_stock < requested_qty:
    → Error: "OUT_OF_STOCK"
    → Include: productId, requested: requested_qty, available: available_stock
```

### 4. Total Deve Bater com Soma

```
calculated_total = 0
For each item in productList:
  calculated_total += item.totalPrice

If Math.abs(calculated_total - request.totalAmount) > 0.01:
  → Error: "TOTAL_MISMATCH"
  → Include: calculated: calculated_total, received: request.totalAmount
```

---

## 🎯 Por que Cada Campo?

### productId
**Por quê:** Identifica qual produto foi comprado  
**Uso:** Query no Firestore para validar  
**Formato:** String, 20+ caracteres  
**Exemplo:** `"prod-camiseta-preta-123"`

### productName
**Por quê:** Logs e auditoria legível  
**Uso:** Exibir em relatórios, emails, etc  
**Formato:** String descritivo  
**Exemplo:** `"Camiseta Preta Tamanho M"`

### quantity
**Por quê:** Quanto foi comprado  
**Uso:** Validar estoque, calcular total  
**Formato:** Número inteiro > 0  
**Exemplo:** `2` (2 unidades)

### unitPrice
**Por quê:** Preço da unidade (não muda por quantidade)  
**Uso:** Double-check de preço  
**Formato:** Número decimal (2 casas)  
**Exemplo:** `75.25` (R$ 75,25)

### totalPrice
**Por quê:** Preço total desse item (quantidade × preço)  
**Uso:** Validar total do carrinho  
**Formato:** Número decimal (2 casas)  
**Cálculo:** `quantity × unitPrice`  
**Exemplo:** `2 × 75.25 = 150.50`

---

## 🔐 Como Valida a Signature?

A signature **NÃO** inclui `productName` (para economia de dados).

A signature valida:
```
companyId
+ totalAmount
+ items[].productId
+ items[].quantity
+ items[].unitPrice
```

Mas `productList` também valida internamente:
```
✓ productId existe?
✓ productName é legível?
✓ quantity > 0?
✓ unitPrice > 0?
✓ totalPrice = quantity × unitPrice?
```

---

## 📊 Exemplo de Fluxo

```
┌─────────────────────────────────────────────────────┐
│ 1. Frontend Monta productList                        │
├─────────────────────────────────────────────────────┤
│ For each item in cartItems:                         │
│   productList.push({                                 │
│     productId: item.product.id,                      │
│     productName: item.product.name,                  │
│     quantity: item.quantity,                         │
│     unitPrice: item.product.salePrice,              │
│     totalPrice: item.quantity × salePrice           │
│   })                                                 │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 2. API Route Recebe                                  │
├─────────────────────────────────────────────────────┤
│ ✓ Valida assinatura                                 │
│ ✓ Passa para n8n com productList                    │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 3. n8n Valida Cada Produto                          │
├─────────────────────────────────────────────────────┤
│ For each item in productList:                       │
│   ✓ Product exists? (Firestore query)              │
│   ✓ Price correct? (compare with DB)               │
│   ✓ Stock available? (stockQuantity >= qty)        │
│   ✓ totalPrice = qty × unitPrice?                  │
│                                                      │
│ ✓ Sum of totalPrice = totalAmount?                 │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 4. Se Tudo OK: Envia para Asaas                     │
│ Se Erro: Retorna 400 com detalhes                   │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testes de Validação

### Teste 1: Produto Não Existe

```json
{
  "productList": [
    {
      "productId": "prod-inexistente",
      "productName": "Produto Fake",
      "quantity": 1,
      "unitPrice": 100.00,
      "totalPrice": 100.00
    }
  ]
}
```

**Esperado no n8n:**
```
Error: PRODUCT_NOT_FOUND
Message: "Produto prod-inexistente não encontrado"
```

---

### Teste 2: Preço Divergente

```json
{
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Preta",
      "quantity": 2,
      "unitPrice": 50.00,    // ← Preço alterado (deveria ser 75.25)
      "totalPrice": 100.00
    }
  ]
}
```

**Esperado no n8n:**
```
Error: PRICE_MISMATCH
Message: "Preço do produto mudou"
Expected: 75.25
Received: 50.00
```

---

### Teste 3: Estoque Insuficiente

```json
{
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Preta",
      "quantity": 100,    // ← Quantidade muito alta
      "unitPrice": 75.25,
      "totalPrice": 7525.00
    }
  ]
}
```

**Esperado no n8n:**
```
Error: OUT_OF_STOCK
Message: "Estoque insuficiente"
ProductId: "prod-camiseta-001"
Requested: 100
Available: 10
```

---

### Teste 4: TotalPrice Incorreto

```json
{
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Preta",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 100.00    // ← Deveria ser 150.50 (2 × 75.25)
    }
  ]
}
```

**Esperado no n8n:**
```
Error: INVALID_TOTAL
Message: "Total do item não bate com cálculo"
ProductId: "prod-camiseta-001"
Expected: 150.50 (2 × 75.25)
Received: 100.00
```

---

### Teste 5: Soma Total Divergente

```json
{
  "totalAmount": 500.00,  // ← Deveria ser 150.50
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Preta",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 150.50
    }
  ]
}
```

**Esperado no n8n:**
```
Error: TOTAL_MISMATCH
Message: "Total calculado não bate"
Calculated: 150.50 (sum of all items)
Received: 500.00
```

---

## 💾 Código Frontend (checkoutService-new.ts)

```typescript
// Monta a lista de produtos para tracking
const productList = data.cartItems.map((item) => ({
  productId: item.product.id,
  productName: item.product.name,
  quantity: item.quantity,
  unitPrice: item.product.salePrice,
  totalPrice: item.quantity * item.product.salePrice
}))

// Depois no payload:
const paymentRequest: N8NPaymentRequest = {
  // ...
  productList,  // ← Incluído aqui
  // ...
}
```

---

## 📋 Checklist para n8n

- [ ] Receber productList no webhook
- [ ] Para cada produto:
  - [ ] Query Firestore: products/{productId}
  - [ ] Validar: existe?
  - [ ] Validar: preço bate?
  - [ ] Validar: estoque suficiente?
  - [ ] Validar: totalPrice = qty × unitPrice?
- [ ] Validar: sum(totalPrice) = totalAmount?
- [ ] Se algum erro: Retornar 400 com detalhes
- [ ] Se tudo OK: Extrair dados Asaas e enviar

---

## 🎓 Exemplo Real Completo

```json
{
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED"],
  "minutesToExpire": 15,
  "totalAmount": 318.20,
  "externalReference": "uuid-123",
  "callback": { /* ... */ },
  "items": [ /* ... */ ],
  "customerData": { /* ... */ },
  "installment": { "maxInstallmentCount": 12 },
  "splits": [ /* ... */ ],
  "orderId": "NbYhqwWV3dfLR2sZMqqr",
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "companyId": "9ddiJlQ72cmE57lJlkch",
  "companyOrder": "Minha Loja LTDA",
  
  // ← AQUI: ProductList Completo
  "productList": [
    {
      "productId": "prod-camiseta-001",
      "productName": "Camiseta Preta Tamanho M",
      "quantity": 2,
      "unitPrice": 75.25,
      "totalPrice": 150.50
    },
    {
      "productId": "prod-calca-002",
      "productName": "Calça Jeans",
      "quantity": 1,
      "unitPrice": 120.00,
      "totalPrice": 120.00
    },
    {
      "productId": "prod-meia-003",
      "productName": "Meia",
      "quantity": 3,
      "unitPrice": 15.90,
      "totalPrice": 47.70
    }
  ],
  
  "signature": "a1b2c3d4e5f6..."
}
```

**n8n Valida:**
```
✓ prod-camiseta-001: exists, price 75.25 OK, stock OK, 2 × 75.25 = 150.50 ✓
✓ prod-calca-002: exists, price 120.00 OK, stock OK, 1 × 120.00 = 120.00 ✓
✓ prod-meia-003: exists, price 15.90 OK, stock OK, 3 × 15.90 = 47.70 ✓
✓ Total: 150.50 + 120.00 + 47.70 = 318.20 ✓ (bate com totalAmount)
→ Envia para Asaas ✅
```

---

## 📞 Suporte

Se algo não funciona:
1. Ver: `CHECKOUT_DEBUGGING_GUIDE.md` (troubleshooting)
2. Verificar: cada campo de productList tem valor?
3. Validar: totalPrice = quantity × unitPrice?
4. Recalcular: sum(totalPrice) = totalAmount?
