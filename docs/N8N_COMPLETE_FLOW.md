# Fluxo Completo: Frontend → Backend → n8n → Asaas

## Diagrama Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React/Next.js)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User clica "Finalizar Compra"                                              │
│         ↓                                                                   │
│  Modal de Checkout abre (dados de endereço)                                 │
│         ↓                                                                   │
│  Envia: cartItems + userData + couponCode                                   │
│         ↓                                                                   │
│  checkoutService-new.ts monta payload                                       │
│         ↓                                                                   │
│  Chama: POST /api/checkout/create-payment                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND - API ROUTE (Next.js)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /api/checkout/create-payment                                               │
│         ↓                                                                   │
│  ✅ Valida Request                                                          │
│     └─ companyId, userId, items, totalAmount obrigatórios                  │
│         ↓                                                                   │
│  ✅ Valida Empresa                                                          │
│     └─ Existe? Está ACTIVE? Tem walletId?                                  │
│         ↓                                                                   │
│  ✅ Valida Produtos & Estoque                                              │
│     └─ Existe? Pertence à empresa? Tem estoque?                            │
│         ↓                                                                   │
│  ✅ Valida Cupom (se fornecido)                                            │
│     └─ Existe? É da empresa? Está ativo?                                   │
│         └─ Se é afiliado, busca dados do afiliado                          │
│         ↓                                                                   │
│  ✅ Double-check: Valida Preços & Total                                    │
│     └─ Soma (qty * unitPrice) bate com total enviado?                      │
│         ↓                                                                   │
│  💰 Calcula Splits                                                          │
│     ├─ 8% Plataforma                                                       │
│     ├─ 92% - discountValue → Empresa                                       │
│     └─ discountValue → Afiliado (se houver)                                │
│         ↓                                                                   │
│  🖼️ Converte Imagens para Base64                                            │
│         ↓                                                                   │
│  📦 Monta Payload para n8n com:                                             │
│     ├─ Items com imageBase64                                               │
│     ├─ CustomerData formatado                                              │
│     ├─ Splits calculados                                                   │
│     ├─ Company ID & User ID                                                │
│     └─ Cupom info (se houver)                                              │
│         ↓                                                                   │
│  📤 Chama n8n Webhook (POST xeco-create-checkout)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            n8n WORKFLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ Webhook recebe payload                                                  │
│         ↓                                                                   │
│  2️⃣ HTTP Request → Asaas                                                    │
│     POST https://api-sandbox.asaas.com/v3/checkouts                        │
│     Headers: x-api-key: {{ TOKEN }}                                        │
│     Body: {{ $json }}                                                      │
│         ↓                                                                   │
│  3️⃣ Check Success: $json.id existe?                                         │
│     ├─ SIM → Return Success                                                │
│     └─ NÃO → Handle Error                                                  │
│         ↓                                                                   │
│  4️⃣ Return:                                                                 │
│     {                                                                      │
│       "checkoutId": "id",                                                  │
│       "checkoutUrl": "https://...",                                        │
│       "message": "Checkout criado com sucesso"                             │
│     }                                                                      │
│         ↓                                                                   │
│  5️⃣ Respond to Webhook                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND - Continua API ROUTE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Recebe resposta do n8n:                                                    │
│     ↓                                                                       │
│  Valida: Tem checkoutId? Tem checkoutUrl?                                  │
│     ↓                                                                       │
│  💾 Salva Order no Firebase:                                                │
│     Collection: orders                                                     │
│     Doc: orderId                                                           │
│     Dados:                                                                 │
│     ├─ orderId                                                             │
│     ├─ userId                                                              │
│     ├─ companyId                                                           │
│     ├─ products (lista)                                                    │
│     ├─ subtotal                                                            │
│     ├─ discount                                                            │
│     ├─ total                                                               │
│     ├─ couponCode                                                          │
│     ├─ affiliateId                                                         │
│     ├─ status: "PENDING" ⭐                                                 │
│     ├─ checkoutId                                                          │
│     ├─ checkoutUrl                                                         │
│     ├─ splits (detalhes)                                                   │
│     └─ createdAt, updatedAt                                                │
│         ↓                                                                   │
│  📤 Retorna para Frontend:                                                  │
│     {                                                                      │
│       "success": true,                                                     │
│       "checkoutId": "...",                                                 │
│       "checkoutUrl": "...",                                                │
│       "orderId": "...",                                                    │
│       "message": "Checkout criado com sucesso"                             │
│     }                                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND - Recebe Resposta                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Se sucesso:                                                                │
│  ✅ Mostra "Redirecionando para pagamento..."                              │
│     ↓                                                                       │
│  🔗 Abre checkoutUrl em nova aba: window.open(url)                         │
│     ↓                                                                       │
│  User vai para Asaas para pagar                                            │
│     ↓                                                                       │
│  Após pagamento:                                                            │
│  ├─ Sucesso → https://xeco.com.br/checkout/success                        │
│  ├─ Cancelado → https://xeco.com.br/checkout/cancel                       │
│  └─ Expirou → https://xeco.com.br/checkout/expired                        │
│                                                                             │
│  Se erro:                                                                   │
│  ❌ Modal permanece aberto                                                  │
│  ❌ Mostra mensagem de erro                                                │
│  ❌ User pode tentar novamente                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### Request Frontend → Backend

```json
{
  "cartItems": [
    {
      "product": {
        "id": "prod-1",
        "name": "Camiseta",
        "salePrice": 50
      },
      "quantity": 2,
      "total": 100
    }
  ],
  "userData": {
    "cpf": "123.456.789-00",
    "address": {
      "street": "Rua Test",
      "number": "123",
      "neighborhood": "Centro",
      "city": "SP",
      "state": "SP",
      "zipCode": "01310-000"
    }
  },
  "userId": "firebase-uid",
  "companyId": "company-id",
  "couponCode": "AFFILIATE123" (opcional),
  "userEmail": "user@test.com",
  "userName": "João",
  "userPhone": "(11) 99999-9999"
}
```

### Backend → n8n

```json
{
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED", "INSTALLMENT"],
  "minutesToExpire": 15,
  "externalReference": "uuid-da-ordem",
  "callback": {
    "successUrl": "https://xeco.com.br/checkout/success",
    "cancelUrl": "https://xeco.com.br/checkout/cancel",
    "expiredUrl": "https://xeco.com.br/checkout/expired"
  },
  "items": [
    {
      "name": "Camiseta",
      "description": "...",
      "quantity": 2,
      "value": 50,
      "imageBase64": "data:image/jpeg;base64,..."
    }
  ],
  "customerData": {
    "name": "João",
    "cpfCnpj": "12345678900",
    "email": "user@test.com",
    "phone": "11999999999",
    "address": "Rua Teste",
    "addressNumber": "123",
    "province": "Centro",
    "postalCode": "01310000",
    "city": "São Paulo"
  },
  "splits": [
    {
      "walletId": "company-wallet-id",
      "percentageValue": 92
    },
    {
      "walletId": "affiliate-wallet-id",
      "percentageValue": 0
    }
  ],
  "installment": {
    "maxInstallmentCount": 1
  }
}
```

### n8n → Asaas

```
Mesmos dados acima
(n8n só passa adiante)
```

### Asaas Response

```json
{
  "id": "checkout-session-id",
  "link": "https://checkout.asaas.com/...",
  "status": "ACTIVE"
}
```

### n8n → Backend

```json
{
  "checkoutId": "checkout-session-id",
  "checkoutUrl": "https://checkout.asaas.com/...",
  "message": "Checkout criado com sucesso"
}
```

### Backend → Firebase

Salva order com status PENDING:

```json
{
  "orderId": "uuid",
  "userId": "firebase-uid",
  "companyId": "company-id",
  "status": "PENDING",
  "checkoutId": "checkout-session-id",
  "checkoutUrl": "https://...",
  "products": [...],
  "total": 100,
  "splits": {...}
}
```

### Backend → Frontend

```json
{
  "success": true,
  "checkoutId": "...",
  "checkoutUrl": "...",
  "orderId": "...",
  "message": "Checkout criado com sucesso"
}
```

## Pontos Críticos

1. ✅ **Backend valida tudo** antes de chamar n8n
2. ✅ **n8n só cria checkout** no Asaas
3. ✅ **Splits já calculados** (8% plataforma + resto empresa/afiliado)
4. ✅ **ImageBase64 convertido** antes de enviar
5. ✅ **Order salva com status PENDING** antes de redirecionar
6. ✅ **Double-check de preços** para evitar fraude
