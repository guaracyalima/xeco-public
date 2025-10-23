# 🧪 Guia de Teste - Webhook Confirm Payment

## 🚀 Setup Rápido

### 1. Importar Workflow no N8N

```bash
# Copiar JSON
cat workflows/webhook-confirm-payment.json | pbcopy
```

No N8N:
1. Click "Add workflow"
2. Click menu (⋮) > "Import from file"
3. Cole o JSON
4. Salve com nome "Xeco - Confirm Payment"

### 2. Configurar Firebase

1. Click no node "Find Order"
2. Em "Credential to connect with", click "+Add credential"
3. Selecione "Google Service Account"
4. Cole o JSON do service account do Firebase
5. Salve como "Firebase Service Account"
6. Repita para o node "Update Order"

### 3. Ativar Workflow

- Toggle "Active" (canto superior direito)
- Copiar URL do webhook (aparece no node "Webhook: Payment Confirmed")

Exemplo de URL:
```
https://primary-production-9acc.up.railway.app/webhook/xeco-confirm-payment
```

## 🧪 Testes

### Teste 1: Pagamento Cartão de Crédito

```bash
curl -X POST https://SEU-N8N.railway.app/webhook/xeco-confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_test_123",
      "customer": "cus_test_001",
      "externalReference": "hqAmTlS7VT6nL11FQB2T",
      "value": 142.32,
      "netValue": 135.80,
      "status": "CONFIRMED",
      "billingType": "CREDIT_CARD",
      "confirmedDate": "2025-10-22",
      "paymentDate": "2025-10-22T10:30:00Z",
      "estimatedCreditDate": "2025-10-23",
      "invoiceUrl": "https://sandbox.asaas.com/invoice/123",
      "transactionReceiptUrl": "https://sandbox.asaas.com/receipt/123"
    }
  }'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "message": "Pagamento confirmado com sucesso",
  "orderId": "hqAmTlS7VT6nL11FQB2T",
  "paymentId": "pay_test_123",
  "status": "CONFIRMED",
  "netValue": 135.80,
  "billingType": "CREDIT_CARD"
}
```

### Teste 2: Pagamento PIX

```bash
curl -X POST https://SEU-N8N.railway.app/webhook/xeco-confirm-payment \
  -H "Content-Type: application/json" \
  -d @workflows/test-payment-confirmed.json
```

Use o payload `confirmPaymentPix` do arquivo.

### Teste 3: Order Não Encontrada (404)

```bash
curl -X POST https://SEU-N8N.railway.app/webhook/xeco-confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_test_404",
      "customer": "cus_test_001",
      "externalReference": "ORDER_NAO_EXISTE",
      "value": 100.00,
      "netValue": 95.00,
      "status": "CONFIRMED",
      "billingType": "PIX"
    }
  }'
```

**Resultado Esperado:**
```json
{
  "success": false,
  "error": "ORDER_NOT_FOUND",
  "message": "Pedido não encontrado no Firebase",
  "orderId": "ORDER_NAO_EXISTE"
}
```

### Teste 4: Evento Inválido (500)

```bash
curl -X POST https://SEU-N8N.railway.app/webhook/xeco-confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_UPDATED",
    "payment": { "id": "pay_123" }
  }'
```

**Resultado Esperado:**
```json
{
  "error": "Evento inválido: PAYMENT_UPDATED. Esperado: PAYMENT_CONFIRMED"
}
```

## ✅ Checklist de Validação

Após cada teste, verificar:

### No N8N
- [ ] Execution aparece em "Executions"
- [ ] Status = Success (verde)
- [ ] Todos nodes executaram
- [ ] Logs de console aparecem

### No Firebase
- [ ] Order foi atualizada
- [ ] Campo `paymentStatus` = "CONFIRMED"
- [ ] Campo `status` = "PAYMENT_CONFIRMED"
- [ ] Campo `asaasPaymentId` preenchido
- [ ] Campo `netValue` correto
- [ ] Campo `paymentConfirmedAt` tem timestamp

### Consulta Firebase

```javascript
// Firebase Console ou via código
const order = await db.collection('orders')
  .doc('hqAmTlS7VT6nL11FQB2T')
  .get()

console.log(order.data())
// Deve mostrar:
// {
//   paymentStatus: "CONFIRMED",
//   status: "PAYMENT_CONFIRMED",
//   asaasPaymentId: "pay_test_123",
//   netValue: 135.80,
//   ...
// }
```

## 🐛 Debugging

### Ver Logs Detalhados

1. N8N > Executions > Click na execução
2. Ver output de cada node
3. Expandir "console.log" outputs

### Erro: "Order not found"

```bash
# Verificar se order existe
curl https://firestore.googleapis.com/v1/projects/xeco-334f5/databases/(default)/documents/orders/hqAmTlS7VT6nL11FQB2T
```

### Erro: "Firebase permission denied"

- Verificar credencial do service account
- Verificar permissões do service account no Firebase

### Webhook não é chamado

- Verificar se workflow está ATIVO
- Verificar URL copiada corretamente
- Testar com cURL primeiro

## 📊 Monitorar em Produção

### Configurar no Asaas

```
1. Dashboard Asaas > Configurações > Webhooks
2. Adicionar novo webhook
3. URL: https://SEU-N8N.railway.app/webhook/xeco-confirm-payment
4. Eventos: PAYMENT_CONFIRMED
5. Salvar
```

### Fazer Pagamento Teste

1. Criar checkout no Xeco
2. Pagar com cartão teste do Asaas:
   - Número: 5162 3060 0000 0000
   - CVV: 123
   - Validade: 12/2030
3. Asaas confirma automaticamente
4. Webhook é disparado
5. Order é atualizada

### Ver Resultado

```bash
# Verificar order no Firebase
# Deve ter campos de pagamento preenchidos
```

## 🎯 Próximos Passos

Após confirmar que funciona:

1. [ ] Habilitar notificações (email/push)
2. [ ] Criar webhook de pagamento recusado
3. [ ] Criar webhook de reembolso
4. [ ] Monitorar métricas de pagamentos

---

**🔥 Bora testar essa porra e meter a mão em code!** 🚀
