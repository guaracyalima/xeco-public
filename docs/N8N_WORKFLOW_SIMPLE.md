# Workflow n8n Simplificado para Xeco

## Estrutura Recomendada

Crie um workflow novo no n8n com estes nós:

### 1️⃣ Webhook (Entrada)
```
Name: Webhook
Type: n8n-nodes-base.webhook
Path: xeco-create-checkout
Method: POST
Response Mode: Last Node
```

### 2️⃣ Create Checkout Asaas
```
Name: Create Checkout
Type: n8n-nodes-base.httpRequest
Method: POST
URL: https://api-sandbox.asaas.com/v3/checkouts
Auth: Header Authentication
Headers:
  x-api-key: {{ seu_token_asaas }}
Body: {{ $json }}
```

### 3️⃣ Check Success
```
Name: Check Success
Type: n8n-nodes-base.if
Condition: $json.id exists?
True Branch: → Node "Return Success"
False Branch: → Node "Handle Error"
```

### 4️⃣ Return Success
```
Name: Return Success
Type: n8n-nodes-base.set
Output:
{
  "checkoutId": "{{ $node['Create Checkout'].json.id }}",
  "checkoutUrl": "{{ $node['Create Checkout'].json.link }}",
  "message": "Checkout criado com sucesso"
}
```

### 5️⃣ Handle Error
```
Name: Handle Error
Type: n8n-nodes-base.set
Output:
{
  "error": "{{ $node['Create Checkout'].json.message || 'Erro ao criar checkout' }}"
}
```

### 6️⃣ Respond Success
```
Name: Respond Success
Type: n8n-nodes-base.respondToWebhook
Body: $json (do node anterior)
```

### 7️⃣ Respond Error
```
Name: Respond Error
Type: n8n-nodes-base.respondToWebhook
Body: $json (do Handle Error)
Response Code: 400
```

## Conexões

```
Webhook
  ↓
Create Checkout
  ↓
Check Success
  ├─ (True) → Return Success → Respond Success
  └─ (False) → Handle Error → Respond Error
```

## O Que Muda vs Seu Workflow Original

### ❌ Removido
- Node de validação (backend faz)
- Query Firebase para empresa
- Query Firebase para produtos
- Validação de estoque
- Validação de cupom
- Cálculo de splits
- Salvar order (backend faz)

### ✅ Mantido
- Webhook para receber dados
- HTTP Request para Asaas
- Validação de sucesso
- Tratamento de erro
- Response ao webhook

### ➕ Adicionado
- Backend valida tudo antes de chamar
- Splits já vêm calculados
- Dados do cliente já formatados
- ImageBase64 já convertido

## Testando

### 1. Copie o payload de exemplo:

```bash
curl -X POST http://localhost:5678/webhook-test/xeco-create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-123",
    "companyId": "company-123",
    "userId": "user-123",
    "totalAmount": 100,
    "items": [{"productId": "prod-1", "quantity": 1, "unitPrice": 100}],
    "customerData": {
      "name": "Teste",
      "cpfCnpj": "12345678900",
      "email": "teste@test.com",
      "phone": "11999999999",
      "address": "Rua Teste",
      "addressNumber": "123",
      "province": "Centro",
      "postalCode": "01310000",
      "city": "São Paulo"
    },
    "billingTypes": ["CREDIT_CARD"],
    "chargeTypes": ["DETACHED"],
    "minutesToExpire": 15,
    "splits": [{"walletId": "wallet-123", "percentageValue": 100}],
    "items": [{"name": "Teste", "quantity": 1, "value": 100}],
    "installment": {"maxInstallmentCount": 1}
  }'
```

### 2. Verifique se retorna:

```json
{
  "checkoutId": "...",
  "checkoutUrl": "...",
  "message": "Checkout criado com sucesso"
}
```

## Prioridade de Mudanças

1. ✅ Backend valida (já feito)
2. ⏳ n8n simplificado (este guia)
3. ⏳ Testar integração completa
4. ⏳ Configurar URLs de callback
