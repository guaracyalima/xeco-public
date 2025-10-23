# Guia de Debugging: Checkout Completo

## 🔍 Como Debugar o Checkout

### 1. Verificar se orderId está sendo criado

**No Browser Console:**
```javascript
// Após adicionar produto ao carrinho
localStorage.getItem('cart')
// Deve retornar algo como:
{
  "items": [...],
  "orderId": "NbYhqwWV3dfLR2sZMqqr"
}
```

**Verificar:**
- ✓ `orderId` existe?
- ✓ `orderId` não é vazio?
- ✓ `orderId` tem 20+ caracteres?

---

### 2. Verificar Payload Enviado

**Abrir DevTools → Network:**
1. Clicar em "Finalizar Compra"
2. Preencher formulário
3. Clicar "Pagar"
4. Procurar por: `POST /api/checkout/create-payment`
5. Clicar na request
6. Aba "Payload" ou "Request"

**Verificar:**
```json
{
  "orderId": "NbYhqwWV3dfLR2sZMqqr",  // ✓ Deve existir
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",  // ✓ Deve existir
  "companyId": "9ddiJlQ72cmE57lJlkch",  // ✓ Deve existir
  "totalAmount": 150.50,  // ✓ Deve ser > 0
  "items": [  // ✓ Deve ter pelo menos 1 item
    {
      "productId": "prod-123",  // ✓ Deve existir
      "quantity": 2,  // ✓ Deve ser > 0
      "unitPrice": 75.25,  // ✓ Deve ser > 0
      "value": 75.25  // ✓ Deve igualar unitPrice
    }
  ],
  "signature": "a1b2c3d4e5f6...",  // ✓ Deve existir
  "productList": [  // ✓ Deve existir
    { "productId": "prod-123", "quantity": 2 }
  ]
}
```

---

### 3. Verificar Resposta da API Route

**Na mesma request (DevTools):**
1. Aba "Response" ou "Preview"

**Se sucesso (status 200):**
```json
{
  "success": true,
  "id": "checkout-id-123",
  "link": "https://asaas.com/checkout/...",
  "status": "PENDING"
}
```

**Se erro (status 400/403):**
```json
{
  "success": false,
  "errors": [
    {
      "code": "FRAUD_DETECTED",
      "description": "Signature inválido..."
    }
  ]
}
```

---

### 4. Testar Fraude Prevention (Tampering)

**No Browser Console:**

```javascript
// Passo 1: Interceptar a request
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  if (args[0].includes('/api/checkout/create-payment')) {
    const body = JSON.parse(args[1].body);
    console.log('📤 Request interceptado:', body);
    
    // MODIFICAR: Mudar preço de um item
    body.items[0].unitPrice = 1.00;
    body.totalAmount = 2.00; // Deve recalcular também
    
    args[1].body = JSON.stringify(body);
    console.log('🔴 MODIFICADO para fraude teste');
  }
  
  return originalFetch(...args);
};

// Passo 2: Fazer checkout
// (Ir para carrinho, clicar "Finalizar Compra", preencher, clicar "Pagar")

// Passo 3: Verificar resposta
// Esperado: 403 Forbidden "Signature inválido"
```

**Resultado esperado:**
```
❌ 403 Forbidden
{
  "error": "SIGNATURE_INVALID",
  "description": "Dados foram alterados após assinatura"
}
```

---

### 5. Verificar Signature Geração

**No checkoutService-new.ts:**

Adicionar log antes de gerar signature:
```typescript
console.log('🔐 Dados a assinar:')
console.log('  companyId:', dataToSign.companyId)
console.log('  totalAmount:', dataToSign.totalAmount)
console.log('  items:', dataToSign.items)

const signature = generateCheckoutSignature(dataToSign)
console.log('✍️  Signature gerado:', signature)
```

**No checkout-signature.ts:**

```typescript
console.log('🔑 HMAC Key:', SECRET_KEY.substring(0, 10) + '...')
console.log('📝 Data to sign:', JSON.stringify(data))
const signature = crypto.createHmac('sha256', SECRET_KEY)
  .update(JSON.stringify(data))
  .digest('hex')
console.log('✅ Signature:', signature)
```

**Verificar:**
- ✓ Key está correto? (Deve começar com algo consistente)
- ✓ Data está em JSON format?
- ✓ Signature é hex (a-f, 0-9)?
- ✓ Signature tem 64 caracteres? (SHA-256 = 64 hex chars)

---

### 6. Verificar no Firebase

**Abrir Firebase Console:**
1. Ir para: Firestore Database
2. Collection: "orders"
3. Procurar Order com orderId do checkout

**Verificar:**
```
Document ID: NbYhqwWV3dfLR2sZMqqr
{
  customerId: "RRFPNnuygPZ6QlXhmUFlMVqVNwj1"
  companyId: "9ddiJlQ72cmE57lJlkch"
  status: "PENDING_PAYMENT"  // ← Deve ser PENDING_PAYMENT
  totalAmount: 150.50
  items: [
    {
      productId: "prod-123",
      quantity: 2,
      unitPrice: 75.25,
      totalPrice: 150.50
    }
  ]
  asaasCheckoutId: "pay_123abc"  // ← Se n8n já processou
  asaasCheckoutUrl: "https://..."  // ← Se n8n já processou
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

### 7. Verificar Logs do n8n

**Se tiver acesso ao n8n:**

```
1. Ir para: Workflows → Checkout Workflow
2. Executions
3. Procurar por timestamp do checkout
4. Ver logs de cada step

Expected flow:
✓ Step 1: Webhook recebido
✓ Step 2: Order validado (orderId encontrado)
✓ Step 3: User validado
✓ Step 4: Company validada
✓ Step 5: Produtos validados
✓ Step 6: Total recalculado e validado
✓ Step 7: Dados Asaas extraídos
✓ Step 8: Asaas API chamada
✓ Step 9: Firestore atualizado
✓ Step 10: Resposta retornada
```

---

### 8. Problemas Comuns e Soluções

#### Problema: "orderId is undefined"
```
❌ Error: orderId is undefined
```

**Solução:**
1. Verificar se CartContext está fornecendo orderId
2. Verificar se Order foi criada no Firebase
3. Verificar se orderId está sendo salvo no localStorage

**Código:**
```typescript
// Em CartContext.tsx
console.log('💾 Salvando orderId:', orderId)
localStorage.setItem('orderId', orderId)

// Em checkoutService-new.ts
console.log('📦 Recebido orderId:', data.orderId)
if (!data.orderId) {
  throw new Error('orderId não foi fornecido')
}
```

---

#### Problema: "Signature inválido"
```
❌ 403 Forbidden
error: "SIGNATURE_INVALID"
```

**Solução:**
1. Verificar se SECRET_KEY está igual em ambos os lugares (frontend e API Route)
2. Verificar se dados estão sendo assinados corretamente (JSON.stringify)
3. Verificar se signature está sendo transmitida no request

**Debug:**
```javascript
// Frontend
console.log('🔐 Signature Frontend:', signature)

// DevTools Network Request
// Verificar se "signature" field está no payload
```

---

#### Problema: "Order not found"
```
❌ 400 Bad Request
error: "ORDER_NOT_FOUND"
```

**Solução:**
1. Verificar se orderId é válido (20+ chars)
2. Verificar se Order foi criada no Firebase
3. Verificar se estou usando o mesmo Firebase project

**Debug:**
```javascript
// No n8n
console.log('🔍 Procurando order:', orderId)
// Se não encontrar, significa:
// - orderId errado
// - Order não foi criada
// - Projeto Firebase diferente
```

---

#### Problema: "Product not found"
```
❌ 400 Bad Request
error: "PRODUCT_NOT_FOUND"
productId: "prod-123"
```

**Solução:**
1. Verificar se produto existe no Firebase
2. Verificar se productId é o correto
3. Verificar se produto está ativo

**Debug:**
```javascript
// No n8n ou Firebase
// Procurar: collections → products → procurar por "prod-123"
// Se não encontrar, o produto não existe ou foi deletado
```

---

#### Problema: "Total mismatch"
```
❌ 400 Bad Request
error: "TOTAL_MISMATCH"
calculated: 150.50
received: 100.00
```

**Solução:**
1. Recalcular: quantity × unitPrice
2. Verificar se há cupom/desconto
3. Verificar se arredondamento está causando diferença

**Debug:**
```typescript
// Frontend
console.log('📊 Cálculo:')
console.log('  Item 1: 2 × 75.25 =', 2 * 75.25)
console.log('  Total:', total)

// n8n
console.log('📊 Recalculado:')
console.log('  Item 1: ' + item.quantity + ' × ' + item.unitPrice + ' = ' + (item.quantity * item.unitPrice))
console.log('  Soma:', total)
```

---

#### Problema: "Stock insufficient"
```
❌ 400 Bad Request
error: "OUT_OF_STOCK"
productId: "prod-123"
requested: 10
available: 5
```

**Solução:**
1. Verificar estoque no Firebase
2. Ou outro usuário comprou?
3. Ou estoque foi reduzido?

**Debug:**
```javascript
// No Firebase
// Procurar: collections → products → "prod-123"
// Campo: stockQuantity
```

---

### 9. Checklist de Validação

Após cada checkout, verificar:

```
Frontend:
  ☐ orderId está no localStorage?
  ☐ Payload tem orderId, userId, companyId?
  ☐ Payload tem signature?
  ☐ totalAmount é correto (quantity × price)?
  
API Route:
  ☐ Signature foi validado?
  ☐ Status HTTP é 200 (sucesso) ou 4xx (erro)?
  ☐ Resposta tem link e checkoutId?
  
Firebase:
  ☐ Order existe com status PENDING_PAYMENT?
  ☐ Order tem asaasCheckoutId?
  ☐ Order tem asaasCheckoutUrl?
  
n8n (se tiver acesso):
  ☐ Webhook foi acionado?
  ☐ Todos os steps foram executados?
  ☐ Asaas foi chamado?
  ☐ Resposta do Asaas tem "id" e "link"?
```

---

### 10. Logs Importantes

**Para rastreabilidade, procurar por estes logs:**

```
Frontend:
  ✓ "🚀 Iniciando criação de pagamento"
  ✓ "💰 Total Amount Calculado: XXX"
  ✓ "🔒 Gerando assinatura HMAC"
  ✓ "📤 Enviando requisição para n8n"
  ✓ "✅ PAGAMENTO CRIADO COM SUCESSO!"

API Route:
  ✓ "[Checkout API] Request recebido"
  ✓ "[Checkout API] Validando signature..."
  ✓ "[Checkout API] Signature válido ✓"
  ✓ "[Checkout API] Repassando para n8n..."

n8n:
  ✓ "checkout_received"
  ✓ "orderId: XXX"
  ✓ "Validando Order..."
  ✓ "Validando Produtos..."
  ✓ "Enviando para Asaas..."
```

---

### 11. Ferramentas Úteis

```
DevTools Network Inspector:
  → Ver todas as requisições HTTP
  → Ver payloads completos
  → Ver respostas
  → Simular erros de rede

DevTools Console:
  → Ver logs do console.log()
  → Testar código JavaScript
  → Acessar variáveis globais

Firebase Console:
  → Ver dados em tempo real
  → Validar se Order foi criada
  → Ver status de pagamento

n8n Dashboard:
  → Ver execuções do workflow
  → Ver logs detalhados
  → Testar steps individualmente
```

---

### 12. Script de Teste Automatizado

```javascript
// No DevTools Console
// Teste completo: adicionar produto e fazer checkout

async function testCheckout() {
  try {
    console.log('🧪 TESTE DE CHECKOUT INICIADO')
    
    // 1. Verificar orderId no carrinho
    const cart = JSON.parse(localStorage.getItem('cart') || '{}')
    console.log('✓ Carrinho:', cart)
    
    if (!cart.orderId) {
      throw new Error('❌ Carrinho sem orderId!')
    }
    
    console.log('✓ orderId encontrado:', cart.orderId)
    
    // 2. Verificar Firebase
    console.log('🔍 Buscando Order no Firebase...')
    // (Necessário ter Firebase SDK iniciado)
    
    // 3. Testar Asaas
    console.log('✓ Todos os dados parecem válidos')
    console.log('🎯 Próximo: Clicar em "Finalizar Compra"')
    
  } catch (error) {
    console.error('❌ ERRO:', error.message)
  }
}

testCheckout()
```

---

## 📞 Suporte

Se algo não está funcionando:

1. **Coletar dados:**
   - Screenshot do erro
   - Console logs (Ctrl+Shift+K)
   - Network request (DevTools Network)
   - Firebase data (Firestore Console)

2. **Verificar:**
   - ✓ Está usando navegador atualizado?
   - ✓ Está em http://localhost:3000?
   - ✓ Está logado?
   - ✓ Carrinho tem produtos?

3. **Relatar:**
   - Include: browser logs + network request + Firebase data
   - Describe: o que tentou fazer
   - Expected: o que deveria acontecer
   - Actual: o que aconteceu
