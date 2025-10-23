# 🔥 N8N WORKFLOW COMPLETO 100% - XECO CHECKOUT

**Status:** ✅ PRONTO PARA IMPORTAR E USAR

## O QUE TEM AQUI

**23 NODOS COMPLETOS - TODAS AS 6 FASES:**

### ✅ FASE 1: Validação de Campos (Node 1)
- Valida: orderId, userId, companyId, totalAmount, productList, signature
- Erro: MISSING_FIELD:campo

### ✅ FASE 2: Auditoria Completa (Nodes 2-6)
- Query Order no Firestore
- Valida se order existe
- Valida se customerId bate com userId
- Valida se company bate com companyId
- Valida se status é PENDING_PAYMENT
- Query Company no Firestore
- Valida se company existe
- Valida se company está ativa
- Erros: ORDER_NOT_FOUND, USER_MISMATCH, COMPANY_MISMATCH, INVALID_ORDER_STATUS, COMPANY_NOT_FOUND, COMPANY_INACTIVE

### ✅ FASE 3: Validação de Produtos (Nodes 7-10)
- **LOOP de produtos** (um por um)
- Para CADA produto:
  - Query no Firestore
  - Valida se produto existe
  - Valida se preço bate (salePrice === unitPrice)
  - Valida se tem estoque suficiente (stock >= quantity)
  - Valida se total do item está correto (quantity × unitPrice = totalPrice)
- Soma TODOS os totals dos produtos
- Valida se soma total = totalAmount do request
- Erros: PRODUCT_NOT_FOUND, PRICE_MISMATCH, INSUFFICIENT_STOCK, ITEM_TOTAL_MISMATCH, TOTAL_MISMATCH

### ✅ FASE 4: Segurança (Node 11)
- Valida HMAC-SHA256 signature
- Usa timingSafeEqual para evitar timing attacks
- Recalcula a assinatura esperada
- Compara de forma segura
- Erro: INVALID_SIGNATURE

### ✅ FASE 5: Integração Asaas (Nodes 12-15)
- Prepara payload para Asaas (sem campos internos)
- Chama Asaas API para criar payment
- Extrai response (id, checkoutUrl)
- Atualiza order no Firestore com: asaasPaymentId, checkoutUrl, status=CHECKOUT_CREATED, asaasStatus, updatedAt
- Retorna checkoutUrl para o frontend

### ✅ FASE 6: Error Handling Centralizado (Nodes 16-17)
- **Todos os erros vão para Error Handler**
- Determina errorCode baseado no tipo de erro:
  - 400 = VALIDATION_ERROR (campos faltando)
  - 403 = AUDIT_ERROR, FRAUD_DETECTION, SECURITY_ERROR
  - 409 = PRODUCT_ERROR
- Retorna estrutura consistente: {success: false, error, errorType, code, orderId}
- Logging de erros em console

### ✅ LOGGING (Nodes 18-19)
- Success logs com orderId, asaasPaymentId, checkoutUrl
- Error logs com erro, tipo, código

---

## IMPORTAR NO N8N

### ⚠️ IMPORTANTE: Configure Credencial Firebase Primeiro!

**Antes de importar, siga:** [N8N_FIREBASE_CREDENTIALS_SETUP.md](N8N_FIREBASE_CREDENTIALS_SETUP.md)

1. Gere service account do Firebase
2. Crie credencial no N8N chamada "firebase"
3. DEPOIS importe o workflow

---

### Passo 1: Configurar Credencial Firebase
```
Settings → Credentials → New Credential
Type: Firebase (Google Cloud Firestore)
Colar JSON do Firebase Service Account
Name: firebase
Save
```

### Passo 2: Importar Workflow
```
Menu → Import from File
```
- Selecionar arquivo: `N8N_WORKFLOW_COMPLETO.json`
- N8N vai pedir credencial: Selecionar "firebase"

### Passo 3: Configurar Secrets (Variáveis de Ambiente)
```
Settings → Secrets
```

Adicionar 2 secrets obrigatórios:
```
ASAAS_API_KEY = (sua API key do Asaas)
CHECKOUT_SIGNATURE_SECRET = (DEVE SER EXATAMENTE IGUAL ao frontend)
```

### Passo 4: Verificar Nodos Firestore
```
Cada nodo Firestore deve ter:
Node Settings → Credentials → "firebase" (selecionado)

Nodos:
- Query Order ✓
- Query Company ✓
- Query Product ✓
- Update Firestore ✓
```

### Passo 5: Testar Conexão
```
Clicar em qualquer nodo Firestore
Icon ◉ → Test
Deve retornar ✅ e dados do documento
```

### Passo 6: Deploy
```
Deploy → Ativar
```

### Passo 7: Copiar Webhook URL
Depois que deployar, copiar a URL do webhook que aparecer

---

## CONFIGURAR FRONTEND

### Arquivo: `.env.local`
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n-webhook-url-aqui
```

### Arquivo: `/src/lib/n8n-config.ts`
Verificar se `CHECKOUT_SIGNATURE_SECRET` é IGUAL ao configurado no N8N

---

## TESTAR

### Teste 1: Request Válido
```bash
curl -X POST https://seu-n8n-webhook-url \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "userId": "user-456",
    "companyId": "company-789",
    "totalAmount": 150.00,
    "productList": [
      {
        "productId": "prod-1",
        "productName": "Produto 1",
        "quantity": 2,
        "unitPrice": 75.00,
        "totalPrice": 150.00
      }
    ],
    "signature": "seu-hmac-aqui",
    "billingType": "CREDIT_CARD"
  }'
```

Resultado esperado:
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.asaas.com/...",
  "orderId": "order-123",
  "asaasPaymentId": "pay_xxx",
  "status": "CHECKOUT_CREATED"
}
```

### Teste 2: Fraude (Preço Errado)
Alterar unitPrice para diferente do Firestore → Erro 403 FRAUD_DETECTION

### Teste 3: Produto Inexistente
Usar productId que não existe → Erro 409 PRODUCT_NOT_FOUND

### Teste 4: Assinatura Inválida
Alterar signature → Erro 403 SECURITY_ERROR

---

## FLUXO COMPLETO

```
Frontend (POST com payload + HMAC-SHA256)
   ↓
N8N Webhook
   ↓
1. Valida campos obrigatórios
   ↓
2. Query Order no Firestore
   ↓
3. Valida Order (user, company, status)
   ↓
4. Query Company no Firestore
   ↓
5. Valida Company (existe, ativa)
   ↓
6. Loop CADA produto:
   - Query Firestore
   - Valida existe, preço, estoque, total
   ↓
7. Soma todos os totals
   ↓
8. Valida HMAC-SHA256 signature
   ↓
9. Prepara payload Asaas (remove campos internos)
   ↓
10. POST Asaas API
    ↓
11. Update Firestore com asaasPaymentId + checkoutUrl
    ↓
12. Response OK com checkoutUrl
    ↓
Frontend redireciona para checkout.asaas.com
```

**EM QUALQUER ERRO:**
- Error Handler centralizado
- Log do erro
- Response com status code correto
- Update order status (opcional)

---

## ENVIRONMENT VARIABLES NECESSÁRIOS

| Variável | Fonte | Exemplo |
|----------|--------|---------|
| FIREBASE_PROJECT_ID | Google Cloud | xeco-public |
| FIREBASE_TOKEN | Firebase Service Account | eyJhbGc... |
| ASAAS_API_KEY | Dashboard Asaas | api_prod_xxx |
| CHECKOUT_SIGNATURE_SECRET | Frontend config | seu-secret-muito-seguro |

---

## LOGS

**Success Log:**
```
N8N CHECKOUT LOG: {
  event: checkout_success,
  orderId: order-123,
  asaasPaymentId: pay_xxx,
  checkoutUrl: https://checkout.asaas.com/...
}
```

**Error Log:**
```
N8N CHECKOUT ERROR LOG: {
  event: checkout_error,
  error: PRODUCT:PRICE_MISMATCH:prod-1,
  errorType: PRODUCT_ERROR,
  code: 409,
  orderId: order-123
}
```

---

## SUPORTE

Se tiver erro:
1. Checar console.log do N8N
2. Verificar se todos os secrets estão configurados
3. Verificar se URLs do Firestore/Asaas estão corretas
4. Validar CHECKOUT_SIGNATURE_SECRET é igual frontend ↔ N8N

**PRONTO! Importa e usa! 🚀**
