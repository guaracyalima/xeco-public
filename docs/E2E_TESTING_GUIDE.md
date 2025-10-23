# 🧪 Guia de Testes End-to-End - Checkout Completo

## 📋 Pré-requisitos

- [ ] Servidor n8n rodando com workflow `xeco-create-checkout.json` ativado
- [ ] Firebase Firestore com dados de teste (empresa, produtos, cupons)
- [ ] Next.js dev server rodando (`npm run dev`)
- [ ] Asaas sandbox credenciais configuradas no n8n
- [ ] Postman ou cURL para testes de API

---

## 🚀 Teste 1: Validação de Empresa

### Objetivo
Verificar se o workflow valida corretamente empresa ativa com walletId

### Dados de Teste
```json
{
  "orderId": "test_company_001",
  "userId": "test_user_uid",
  "companyId": "empresa_ativa_com_wallet",
  "cartItems": [
    {
      "id": "prod_teste_1",
      "name": "Produto Teste",
      "price": 100,
      "quantity": 1,
      "companyOwner": "empresa_ativa_com_wallet"
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
      "complement": "",
      "neighborhood": "Bairro",
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
}
```

### Teste Caso 1a: Empresa Válida
```bash
# Request para n8n webhook
curl -X POST https://seu-n8n-url/webhook/xeco-create-checkout \
  -H "Content-Type: application/json" \
  -d '{ ...payload acima... }'
```

**Esperado:**
- ✅ Response 200
- ✅ `success: true`
- ✅ `checkoutUrl` retornado
- ✅ Order criada em Firebase com status PENDING

### Teste Caso 1b: Empresa Inativa
```json
{
  "companyId": "empresa_inativa",
  // ... resto igual
}
```

**Esperado:**
- ✅ Response 400 ou 500
- ✅ `success: false`
- ✅ Erro: "Empresa não encontrada ou não configurada"

### Teste Caso 1c: Empresa sem Wallet
```json
{
  "companyId": "empresa_sem_wallet",
  // ... resto igual
}
```

**Esperado:**
- ✅ Response 400 ou 500
- ✅ `success: false`
- ✅ Erro: "Empresa não tem carteira configurada"

---

## 🛒 Teste 2: Validação de Produtos

### Objetivo
Verificar validação de stock e produtos que pertencem à empresa

### Teste Caso 2a: Produto com Stock Suficiente
```json
{
  "cartItems": [
    {
      "id": "prod_com_stock",
      "quantity": 2,
      "companyOwner": "empresa_ativa_com_wallet"
    }
  ],
  "subtotal": 200,
  "finalTotal": 200,
  // ... resto igual
}
```

**Esperado:**
- ✅ Validação passa
- ✅ Checkout criado

### Teste Caso 2b: Produto sem Stock Suficiente
```json
{
  "cartItems": [
    {
      "id": "prod_stock_10",
      "quantity": 20,  // Pedir mais que tem
      "companyOwner": "empresa_ativa_com_wallet"
    }
  ],
  // ... resto igual
}
```

**Esperado:**
- ❌ Erro: "Produto X não tem estoque suficiente. Disponível: 10, Solicitado: 20"

### Teste Caso 2c: Produto de Empresa Diferente
```json
{
  "companyId": "empresa_a",
  "cartItems": [
    {
      "id": "prod_empresa_b",
      "companyOwner": "empresa_b"  // Empresa diferente
    }
  ],
  // ... resto igual
}
```

**Esperado:**
- ❌ Erro: "Produto XXX não pertence à empresa"

---

## 🎟️ Teste 3: Validação de Cupom

### Teste Caso 3a: Sem Cupom (92% empresa)
```json
{
  "orderId": "test_no_coupon",
  "cartItems": [
    {
      "id": "prod_1",
      "price": 100,
      "quantity": 1,
      "companyOwner": "empresa_ativa"
    }
  ],
  "subtotal": 100,
  "finalTotal": 100,
  "couponCode": null,  // SEM cupom
  // ... resto igual
}
```

**Esperado - Splits:**
- Platform: 8.00 (8%)
- Company: 92.00 (92%)
- Affiliate: 0

### Teste Caso 3b: Cupom Válido sem Afiliado
```json
{
  "orderId": "test_coupon_no_affiliate",
  "cartItems": [{...}],
  "subtotal": 100,
  "discount": 10,
  "finalTotal": 90,
  "couponCode": "DESCONTO10",  // Cupom válido, SEM afiliado
  // ... resto igual
}
```

**Esperado - Splits:**
- Platform: 7.20 (8% de 90)
- Company: 82.80 (92% de 90)
- Affiliate: 0

### Teste Caso 3c: Cupom Afiliado (50% desconto = 50% afiliado)
```json
{
  "orderId": "test_coupon_affiliate",
  "cartItems": [{...}],
  "subtotal": 100,
  "discount": 50,
  "finalTotal": 50,
  "couponCode": "AFILIAD050",  // 50% de desconto
  // ... resto igual
}
```

**Esperado - Splits:**
- Platform: 4.00 (8% de 50)
- Company: 42.00 (84% de 50) = (92% - 50%)
- Affiliate: 4.00 (8% de 50) = descontado

**Wait, isso tá errado!** Deveria ser:
- Platform: 4.00 (8%)
- Company: 23.00 (92% - 50%)
- Affiliate: 23.00 (50%)

Verificar cálculo em `splitCalculationService.ts`!

### Teste Caso 3d: Cupom Inválido
```json
{
  "couponCode": "CUPOM_INEXISTENTE",
  // ... resto igual
}
```

**Esperado:**
- ❌ Erro: "Cupom não encontrado"

### Teste Caso 3e: Cupom Inativo
```json
{
  "couponCode": "CUPOM_INATIVO",
  // ... resto igual
}
```

**Esperado:**
- ❌ Erro: "Cupom não está ativo"

### Teste Caso 3f: Cupom de Outra Empresa
```json
{
  "companyId": "empresa_a",
  "couponCode": "CUPOM_EMPRESA_B",  // Cupom pertence a empresa_b
  // ... resto igual
}
```

**Esperado:**
- ❌ Erro: "Cupom não pertence à esta empresa"

---

## 💰 Teste 4: Validação de Preço (Anti-fraude)

### Objetivo
Double-check para evitar que usuário altere preço no frontend

### Teste Caso 4a: Preço Correto
```json
{
  "cartItems": [
    {
      "id": "prod_1",
      "price": 100,
      "quantity": 2,
      "companyOwner": "empresa_a"
    }
  ],
  "subtotal": 200,  // 100 * 2 = 200 ✅
  "finalTotal": 200,
  // ... resto igual
}
```

**Esperado:**
- ✅ Validação passa

### Teste Caso 4b: Preço Alterado (FRAUDE)
```json
{
  "cartItems": [
    {
      "id": "prod_1",
      "price": 100,
      "quantity": 2,
      "companyOwner": "empresa_a"
    }
  ],
  "subtotal": 100,  // Deveria ser 200, mas enviou 100 ❌
  "finalTotal": 100,
  // ... resto igual
}
```

**Esperado:**
- ❌ Erro: "Erro de cálculo de preço"

### Teste Caso 4c: Subtotal OK mas Final Total Errado
```json
{
  "cartItems": [{...}],
  "subtotal": 200,  // Correto
  "discount": 50,   // Cupom de 50
  "finalTotal": 120,  // Deveria ser 150 (200-50), mas é 120 ❌
  // ... resto igual
}
```

**Esperado:**
- ❌ Erro: "Erro no total final"

---

## 🖼️ Teste 5: Conversão de Imagem (CORS)

### Objetivo
Validar que imagem Firebase Storage converte para base64 corretamente

### Teste Caso 5a: Imagem Firebase Storage Válida
```json
{
  "cartItems": [
    {
      "id": "prod_com_imagem_firebase",
      "imagesUrl": [
        "https://firebasestorage.googleapis.com/v0/b/xeco-334f5.firebasestorage.app/..."
      ],
      "price": 100,
      "quantity": 1
    }
  ],
  // ... resto igual
}
```

**Esperado:**
- ✅ Imagem convertida para base64
- ✅ Console: "🖼️ Convertendo imagens..."
- ✅ Sem erro "Failed to fetch"
- ✅ Checkout criado com item.imageBase64 preenchido

### Teste Caso 5b: Produto sem Imagem
```json
{
  "cartItems": [
    {
      "id": "prod_sem_imagem",
      "imagesUrl": [],  // Sem imagem
      "price": 100,
      "quantity": 1
    }
  ],
  // ... resto igual
}
```

**Esperado:**
- ✅ Usar fallback image base64
- ✅ Checkout criado normalmente
- ✅ Console: "⚠️ Erro ao converter, usando padrão"

---

## 🔀 Teste 6: Múltiplos Produtos Mesma Empresa

### Objetivo
Validar cálculo correto com vários produtos

### Setup
```json
{
  "orderId": "test_multiple_products",
  "cartItems": [
    {
      "id": "prod_a",
      "name": "Produto A",
      "price": 100,
      "quantity": 2,
      "companyOwner": "empresa_1"
    },
    {
      "id": "prod_b",
      "name": "Produto B",
      "price": 50,
      "quantity": 3,
      "companyOwner": "empresa_1"
    }
  ],
  "subtotal": 350,  // (100*2) + (50*3) = 350
  "finalTotal": 350,
  // ... resto igual
}
```

**Cálculo esperado:**
- Subtotal: 350
- Platform (8%): 28.00
- Company (92%): 322.00
- Affiliate: 0

**Esperado:**
- ✅ Validação passa para AMBOS produtos
- ✅ Stock validado para AMBOS
- ✅ Splits calculados corretamente
- ✅ Checkout criado com 2 items

---

## ✅ Checklist Final de Testes

| Teste | Status | Data | Notas |
|-------|--------|------|-------|
| Empresa válida | [ ] | | |
| Empresa inativa | [ ] | | |
| Empresa sem wallet | [ ] | | |
| Produto stock OK | [ ] | | |
| Produto sem stock | [ ] | | |
| Produto outra empresa | [ ] | | |
| Sem cupom (92%) | [ ] | | |
| Com cupom sem afiliado | [ ] | | |
| Com cupom afiliado | [ ] | | |
| Cupom inválido | [ ] | | |
| Preço correto | [ ] | | |
| Preço alterado (fraude) | [ ] | | |
| Total final errado | [ ] | | |
| Imagem Firebase | [ ] | | |
| Sem imagem (fallback) | [ ] | | |
| Múltiplos produtos | [ ] | | |
| Order salva Firebase | [ ] | | |
| Status PENDING | [ ] | | |

---

## 🐛 Troubleshooting

### Se der erro "Failed to fetch" na imagem
```javascript
// Verificar console do navegador
console.log('URL da imagem:', imageUrl);
console.log('Tem alt=media?', imageUrl.includes('alt=media'));

// Se não tiver, adicionar manualmente:
const url = `${imageUrl}?alt=media`;
```

### Se totalAmount for 0
```javascript
// Debug: adicionar log antes de enviar
console.log('cartItems:',  data.cartItems.map(i => ({
  product: i.product.salePrice,
  quantity: i.quantity,
  total: i.total
})));
console.log('totalAmount calculado:', totalAmount);
```

### Se n8n não receber payload
```javascript
// Verificar logs do n8n
// Execute o webhook manualmente em Debug mode
// Verifique se o webhook URL está correto
// Teste com cURL diretamente
```

---

## 📝 Logs Esperados (Ordem Correta)

```
🚀 Iniciando criação de pagamento...
💰 Calculando splits de pagamento...
📦 Processando itens do carrinho...
🖼️ Convertendo imagens...
📤 Montando payload para n8n...
📞 Chamando n8n...
📥 Resposta do n8n: 200
✅ Pagamento criado com sucesso!
💾 Salvando order em Firebase...
🎉 Checkout URL retornado para frontend
```

---

## 🎯 Próximos Passos após Testes Passarem

1. Testar pagamento real no Asaas sandbox
2. Testar callbacks de sucesso/cancelamento
3. Testar webhook de confirmação de pagamento
4. Implementar retry logic se falhar
5. Setup monitoring e logging
6. Migrar para Asaas produção

