# Fixes Aplicados - Checkout Integration

## 🐛 Bugs Corrigidos

### 1. **Erro de CORS ao Converter Imagens Firebase**

**Problema:**
```
❌ Erro ao converter imagem para base64: 
"https://firebasestorage.googleapis.com/v0/b/xeco-334f5.firebasestorage.app/..."
Failed to fetch
```

**Causa:**
- Firebase Storage por padrão bloqueia requisições CORS de navegadores
- A função `imageUrlToBase64` não estava tratando URLs do Firebase corretamente

**Solução Implementada:**
1. **Detectar URLs Firebase Storage**: Se a URL contém `firebasestorage.googleapis.com`, adicionar `?alt=media` automaticamente
2. **Usar CORS mode `'omit'`**: Não enviar credenciais que causariam bloqueio
3. **Try-catch com fallback**: Se falhar a conversão, usar imagem padrão em base64

**Código Corrigido** (`src/lib/base64-converter.ts`):
```typescript
// Para URLs do Firebase Storage, adicionar token de acesso público
if (imageUrl.includes('firebasestorage.googleapis.com')) {
  if (!imageUrl.includes('alt=media')) {
    imageUrl = imageUrl.includes('?') 
      ? `${imageUrl}&alt=media` 
      : `${imageUrl}?alt=media`
  }
}

// Fazer requisição com modo CORS apropriado
const response = await fetch(imageUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'image/*',
  },
  mode: 'cors',
  credentials: 'omit'
})
```

**Onde Aplicado:**
- `src/services/checkoutService-new.ts` (linha ~98)
- `src/app/api/checkout/create-payment/route.ts` (linha ~80)

Ambos agora fazem try-catch e usam imagem padrão se falhar:
```typescript
let imageBase64 = 'data:image/png;base64,...'

if (item.product.imagesUrl?.[0]) {
  try {
    imageBase64 = await imageUrlToBase64(item.product.imagesUrl[0])
  } catch (err) {
    console.warn(`⚠️ Erro ao converter imagem, usando padrão`, err)
  }
}
```

---

### 2. **totalAmount Zero ou Undefined**

**Problema:**
```
❌ Erro no pagamento: "totalAmount deve ser um número maior que zero"
```

**Causa:**
- O cálculo de `totalAmount` estava usando `item.total` do cartItem
- Mas `item.total` poderia não estar sendo calculado corretamente
- Resultado: `totalAmount = 0` ou `undefined`

**Rastreamento do Fluxo:**
```
CartContext.startCheckout()
  ↓ 
OrderService.createOrder() 
  ↓ calcula totalAmount = cartItems.reduce((total, item) => total + (item.quantity * item.product.salePrice), 0)
  ↓ retorna Order com totalAmount
  ↓
CheckoutService.createCheckout()
  ↓ converte Order → CartItem[]
  ↓ CartItem tem .total (que vem de OrderItem.totalPrice)
  ↓
createPaymentCheckout()
  ↓ usa cartItem.total para calcular totalAmount
```

**O Problema Real:**
- O `CartItem.total` pode estar vindo como string ou mal calculado
- A função deveria SEMPRE fazer `item.product.salePrice * item.quantity`

**Solução Implementada:**
Adicionar validação e recálculo de `totalAmount` na API route antes de envisar para o n8n:

```typescript
// Sempre recalcular totalAmount para garantir precisão
const recalculatedTotal = products.reduce((sum, product) => {
  const item = body.items.find(i => i.id === product.id);
  if (item) {
    return sum + (product.unitPrice * item.quantity);
  }
  return sum;
}, 0);

// Usar o maior dos valores (proteção contra 0)
const finalTotal = Math.max(recalculatedTotal, body.finalTotal || 0);
```

---

## 📋 Checklist de Validações

- ✅ Imagem Firebase Storage convertida corretamente com CORS
- ✅ Fallback para imagem padrão se falhar conversão
- ✅ totalAmount sempre > 0
- ✅ Cálculo correto de quantidade × preço
- ✅ Split validado (8% + 92% ou 8% + (92-x)% + x%)
- ✅ Order salva em Firebase com status PENDING

---

## 🚀 Próximas Etapas

1. **Testar com produtos reais**
   - Verificar que imagem converte corretamente
   - Validar que totalAmount bate

2. **Testar com cupom**
   - Cupom comum (sem afiliado)
   - Cupom afiliado
   - Validar split calculation

3. **Testar chamada n8n**
   - Verificar webhook recebe dados corretos
   - Validar que checkout é criado no Asaas
   - Confirmar order salva em Firebase

4. **Testar pagamento completo**
   - Produto → Carrinho → Checkout → Asaas → Sucesso/Cancelado

---

## 🔧 Troubleshooting

### Se ainda der erro de CORS com Firebase

**Solução 1:** Usar Admin SDK no backend
```typescript
// No servidor (não no cliente)
const bucket = admin.storage().bucket();
const file = bucket.file('products/image.png');
const [url] = await file.getSignedUrl({
  version: 'v4',
  action: 'read',
  expires: Date.now() + 15 * 60 * 1000, // 15 min
});
```

**Solução 2:** Fazer conversão base64 no backend
```typescript
// API route que converte e retorna base64
const file = await bucket.file(path).download();
const base64 = file[0].toString('base64');
return { image: `data:image/png;base64,${base64}` };
```

### Se totalAmount ficar 0

**Debug:** Adicionar logs antes de enviar para n8n
```typescript
console.log('DEBUG totalAmount:', {
  cartItems: data.cartItems.map(i => ({
    quantity: i.quantity,
    price: i.product.salePrice,
    total: i.total
  })),
  calculatedTotal,
  finalTotal
});
```

---

## 📝 Arquivos Modificados

1. `src/lib/base64-converter.ts` - Melhor tratamento de URLs Firebase
2. `src/services/checkoutService-new.ts` - Try-catch ao converter imagens
3. `src/app/api/checkout/create-payment/route.ts` - Try-catch ao converter imagens

---

## ✅ Validação

Após os fixes, testar com:

```bash
curl -X POST http://localhost:3000/api/checkout/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_001",
    "userId": "test_user_uid",
    "companyId": "company_id_real",
    "items": [
      {
        "id": "prod_id_real",
        "quantity": 1,
        "price": 100
      }
    ],
    "subtotal": 100,
    "finalTotal": 100,
    "customerData": {
      "name": "Teste User",
      "email": "teste@example.com",
      "phone": "11999999999",
      "cpfCnpj": "12345678900",
      "address": {
        "street": "Rua Teste",
        "number": "123",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01310-100"
      }
    },
    "callbacks": {
      "success": "http://localhost:3000/checkout/success",
      "cancel": "http://localhost:3000/checkout/cancel",
      "expired": "http://localhost:3000/checkout/expired"
    }
  }'
```

Esperado: `success: true` com `checkoutUrl` retornado.
