# N8N Workflow - JSON Export (Ready to Import)

## 🚀 Como Usar Este Arquivo

1. Copie o JSON abaixo
2. No N8N: `File → Import from URL` ou `File → Import workflow`
3. Cole o JSON
4. Configure credenciais do Firebase
5. Teste!

---

## 📋 Workflow JSON Completo

```json
{
  "name": "Checkout - Validação Completa",
  "description": "Frontend → Validação → Asaas → Firestore",
  "active": true,
  "nodes": [
    {
      "parameters": {
        "path": "checkout",
        "responseMode": "responseNode",
        "authentication": "none"
      },
      "id": "1",
      "name": "HTTP Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [100, 100]
    },
    {
      "parameters": {
        "code": "const timestamp = new Date().toISOString();\nconst orderId = $json.body?.orderId || 'unknown';\nconst totalAmount = $json.body?.totalAmount || 0;\nconst productCount = $json.body?.productList?.length || 0;\n\nreturn {\n  timestamp,\n  orderId,\n  totalAmount,\n  productCount,\n  received: true\n};"
      },
      "id": "2",
      "name": "Log Entry",
      "type": "n8n-nodes-base.executeCommand",
      "typeVersion": 1,
      "position": [300, 100],
      "credentials": {}
    },
    {
      "parameters": {
        "conditions": {
          "conditions": [
            {
              "value1": "$json.body.orderId",
              "condition": "notEmpty"
            }
          ]
        }
      },
      "id": "3",
      "name": "Validate Fields",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [500, 100]
    },
    {
      "parameters": {
        "documentId": "$json.body.orderId",
        "collection": "orders",
        "limit": 1
      },
      "id": "4",
      "name": "Query Order",
      "type": "n8n-nodes-base.firebaseRealtimeDatabase",
      "typeVersion": 1,
      "position": [700, 100],
      "credentials": {
        "googleFirebaseRealtimeDatabase": "firebase-credentials"
      }
    },
    {
      "parameters": {
        "code": "if (!$json.body) {\n  return {\n    success: false,\n    error: 'ORDER_NOT_FOUND',\n    status: 404\n  };\n}\n\nif ($json.body.status !== 'PENDING_PAYMENT') {\n  return {\n    success: false,\n    error: 'INVALID_ORDER_STATUS',\n    status: 409\n  };\n}\n\nreturn {\n  success: true,\n  order: $json.body\n};"
      },
      "id": "5",
      "name": "Validate Order",
      "type": "n8n-nodes-base.executeCommand",
      "typeVersion": 1,
      "position": [900, 100]
    },
    {
      "parameters": {
        "code": "const crypto = require('crypto');\n\nconst data = {\n  companyId: $json.body.companyId,\n  totalAmount: $json.body.totalAmount,\n  items: $json.body.productList.map(p => ({\n    productId: p.productId,\n    quantity: p.quantity,\n    unitPrice: p.unitPrice\n  }))\n};\n\nconst secret = process.env.CHECKOUT_SIGNATURE_SECRET;\nconst dataString = JSON.stringify(data);\nconst calculatedSignature = crypto\n  .createHmac('sha256', secret)\n  .update(dataString)\n  .digest('hex');\n\nconst receivedSignature = $json.body.signature;\nconst isValid = crypto.timingSafeEqual(\n  Buffer.from(calculatedSignature),\n  Buffer.from(receivedSignature)\n);\n\nreturn {\n  isValid,\n  received: receivedSignature,\n  calculated: calculatedSignature\n};"
      },
      "id": "6",
      "name": "Validate Signature",
      "type": "n8n-nodes-base.executeCommand",
      "typeVersion": 1,
      "position": [1100, 100]
    },
    {
      "parameters": {
        "conditions": {
          "conditions": [
            {
              "value1": "$json.isValid",
              "condition": "equals",
              "value2": true
            }
          ]
        }
      },
      "id": "7",
      "name": "Check Signature Valid",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [1300, 100]
    },
    {
      "parameters": {
        "documentId": "$json.body.productList[0].productId",
        "collection": "products",
        "limit": 1
      },
      "id": "8",
      "name": "Query Product",
      "type": "n8n-nodes-base.firebaseRealtimeDatabase",
      "typeVersion": 1,
      "position": [1500, 100],
      "credentials": {
        "googleFirebaseRealtimeDatabase": "firebase-credentials"
      }
    },
    {
      "parameters": {
        "url": "https://api.asaas.com/v3/payments",
        "method": "POST",
        "headers": {\n          "X-API-KEY": "{{ $secret.ASAAS_API_KEY }}"\n        },
        "body": "$json.asaasPayload"
      },
      "id": "9",
      "name": "Call Asaas API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1700, 100]
    },
    {
      "parameters": {
        "url": "https://firestore.googleapis.com/v1/projects/{{ $secret.FIREBASE_PROJECT_ID }}/databases/(default)/documents/orders/{{ $json.body.orderId }}",
        "method": "PATCH",
        "headers": {\n          "Authorization": "Bearer {{ $secret.FIREBASE_TOKEN }}"\n        },
        "body": {\n          "fields": {\n            \"asaasPaymentId\": { \"stringValue\": \"{{ $json.id }}\" },\n            \"checkoutUrl\": { \"stringValue\": \"{{ $json.checkoutUrl }}\" },\n            \"status\": { \"stringValue\": \"CHECKOUT_CREATED\" },\n            \"updatedAt\": { \"timestampValue\": \"{{ new Date().toISOString() }}\" }\n          }\n        }\n      },
      "id": "10",
      "name": "Update Firestore",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1900, 100]
    },
    {
      "parameters": {
        "responseData": "{\n  \"success\": true,\n  \"checkoutUrl\": \"{{ $json.checkoutUrl }}\",\n  \"orderId\": \"{{ $json.body.orderId }}\",\n  \"asaasPaymentId\": \"{{ $json.id }}\"\n}"
      },
      "id": "11",
      "name": "Response Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [2100, 100]
    },
    {
      "parameters": {
        "responseData": "{\n  \"success\": false,\n  \"error\": \"{{ $error.message }}\",\n  \"code\": 400\n}"
      },
      "id": "12",
      "name": "Response Error",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [2100, 300]
    }
  ],
  "connections": {
    "HTTP Webhook": [
      {
        "node": "Log Entry",
        "type": "main",
        "index": 0
      }
    ],
    "Log Entry": [
      {
        "node": "Validate Fields",
        "type": "main",
        "index": 0
      }
    ],
    "Validate Fields": [
      {
        "node": "Query Order",
        "type": "main",
        "index": 0
      },
      {
        "node": "Response Error",
        "type": "main",
        "index": 1
      }
    ],
    "Query Order": [
      {
        "node": "Validate Order",
        "type": "main",
        "index": 0
      }
    ],
    "Validate Order": [
      {
        "node": "Validate Signature",
        "type": "main",
        "index": 0
      }
    ],
    "Validate Signature": [
      {
        "node": "Check Signature Valid",
        "type": "main",
        "index": 0
      }
    ],
    "Check Signature Valid": [
      {
        "node": "Query Product",
        "type": "main",
        "index": 0
      },
      {
        "node": "Response Error",
        "type": "main",
        "index": 1
      }
    ],
    "Query Product": [
      {
        "node": "Call Asaas API",
        "type": "main",
        "index": 0
      }
    ],
    "Call Asaas API": [
      {
        "node": "Update Firestore",
        "type": "main",
        "index": 0
      }
    ],
    "Update Firestore": [
      {
        "node": "Response Success",
        "type": "main",
        "index": 0
      }
    ]
  }
}
```

---

## 🔑 Environment Variables Necessárias

Configure no N8N:

```
ASAAS_API_KEY=sk_live_xxxxx
CHECKOUT_SIGNATURE_SECRET=seu_secret_aqui
FIREBASE_PROJECT_ID=xeco-public
FIREBASE_TOKEN=seu_token_aqui
```

---

## ⚡ Próximos Passos

1. **Import workflow** no N8N usando o JSON acima
2. **Configure credentials**: Firebase + Asaas API key
3. **Teste com Postman**: Use docs/N8N_PAYLOAD_EXEMPLO_REAL.md
4. **Deploy e pronto!**

---

**Base workflow criado! Agora complete as validações conforme o checklist!** 🚀
