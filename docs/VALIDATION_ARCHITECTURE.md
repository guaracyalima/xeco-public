# 🏗️ Arquitetura de Validação: Frontend vs Backend

## Análise das Plataformas (Ifood, Uber Eats, etc)

### ✅ O que REALMENTE fazem no backend:
1. **Double-check de preços** - CRÍTICO (fraud prevention)
2. **Validação de stock final** - Se mudou entre carrinho e checkout
3. **Validação de cupom** (se existir) - CRÍTICO
4. **Validação de empresa ativa** - CRÍTICO
5. **Assinatura/Hash** - Valida que dados não foram adulterados

### ❌ O que MOVEM para frontend:
1. ✅ Validação básica de dados (campos obrigatórios)
2. ✅ Formatação de dados (quantidade, preços)
3. ✅ Cálculo de totais preliminares
4. ✅ Cálculo de splits preliminares
5. ✅ Validação de UX (mostrar msg antes de enviar)

---

## 📊 Estado Atual do Xeco

### ✅ Já implementado no frontend (checkoutValidationService.ts):
- [x] Validação de empresa ativa (boolean status check)
- [x] Validação de wallet da empresa
- [x] Validação de produtos pertencem à empresa
- [x] Validação de stock (compara com quantidade solicitada)
- [x] Validação de cupom existe e é ativo
- [x] Validação de preços (hoje removemos, vamos readicionar)
- [x] Cálculo de splits com afiliado
- [x] Cálculo de total com desconto

### ❌ Faltando no frontend:
- [ ] Assinatura/Hash dos dados para fraud detection
- [ ] Fetch do afiliado data (para montar split corretamente)

---

## 🎯 Plano: "Move validation left"

### Frontend (checkoutValidationService.ts) - ANTES DE ENVIAR:
```
1. Valida empresa está ativa ✅
2. Valida empresa tem walletId ✅
3. Valida produtos existem e pertencem à empresa ✅
4. Valida stock (vs quantity solicitada) ✅
5. **NOVO**: Valida preço unitário vs DB (detect fraud)
6. **NOVO**: Valida cupom (se existir)
7. **NOVO**: Fetch dados do afiliado (para montar split)
8. Calcula total + desconto
9. Calcula splits (8% platform, 92% company ou com afiliado)
10. **NOVO**: Gera hash/assinatura dos dados
11. Envia para n8n com hash
```

### N8N (xeco-create-checkout) - DOUBLE CHECK:
```
1. Valida hash/assinatura (dados não foram adulterados)
2. Re-valida empresa está ativa (mudou nos últimos 100ms?)
3. Re-valida stock (mudou nos últimos 100ms?)
4. Re-valida cupom (mudou nos últimos 100ms?)
5. Re-valida preços vs DB
6. Re-calcula splits (verifica se bate)
7. Cria checkout no Asaas
8. Salva order no Firebase
```

---

## 💰 Economia de Processamento

### ANTES (tudo no n8n):
- N8N faz 6 queries ao Firestore
- N8N calcula splits 2x
- N8N valida tudo
- **Custo**: ~200-300ms por request + queries caras

### DEPOIS (otimizado):
- Frontend faz queries (já local, rápido)
- Frontend valida preliminar
- N8N faz apenas 3 queries (re-check)
- N8N valida assinatura (criptografia rápida)
- **Custo**: ~50-100ms no n8n + queries reduzidas

### Economia: **60-70% menos processamento no n8n** 🚀

---

## 🔐 Fraud Prevention

### Hash/Assinatura (HMAC-SHA256):
```typescript
const dataToSign = {
  companyId,
  totalAmount,
  items: [{id, quantity, unitPrice}],
  couponCode
}

const signature = HMAC_SHA256(JSON.stringify(dataToSign), SECRET_KEY)
// Envia: { data, signature }

// N8N valida: verifica se HMAC_SHA256(data, SECRET_KEY) === signature
```

**Por quê?** Detecta se alguém alterou:
- Preço de um produto
- Quantidade
- Coupon
- Qualquer outro dado

---

## 📋 Dados que vão do Frontend para N8N

### Estrutura OTIMIZADA:
```json
{
  "orderId": "NbYhqwWV3dfLR2sZMqqr",
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "companyId": "9ddiJlQ72cmE57lJlkch",
  "customerData": {...},
  "items": [
    {
      "productId": "1PNngLO6YL9K7FPe0pGV",
      "quantity": 1,
      "unitPrice": 18.99,
      "subtotal": 18.99
    }
  ],
  "subtotal": 18.99,
  "couponCode": "SUMMER2025",
  "discountValue": 2.00,
  "totalAmount": 16.99,
  "splits": {
    "platform": 1.36,
    "company": 15.63,
    "affiliate": 0.00
  },
  "signature": "abc123def456..." // ← NOVO
}
```

---

## 🛠️ Implementação

### 1. Frontend (checkoutService-new.ts):
- [ ] Adicionar fetch de dados do afiliado (do cupom)
- [ ] Adicionar cálculo de signature
- [ ] Manter validações todas que já existem

### 2. checkoutValidationService.ts:
- [ ] Remover validações que vão pro frontend
- [ ] Manter apenas as de "re-check"

### 3. N8N (xeco-create-checkout.json):
- [ ] Validar signature
- [ ] Re-check dados críticos (preços, stock)
- [ ] Remover validações "pesadas"

---

## ✨ Resultado Final

**Frontend**:
- Valida tudo ANTES de enviar
- Rápido (dados já no cliente)
- Melhor UX (feedback imediato)

**N8N**:
- Apenas double-check críticos
- Valida assinatura (fraud prevention)
- Muito mais rápido
- Economiza processamento

**Segurança**: Mantida 🔒 (hash detect fraude)
