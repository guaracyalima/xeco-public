# Fluxo Completo de Dados do Checkout

## Visão Geral

O sistema de checkout agora captura **TODOS** os dados necessários:

1. ✅ **Dados Asaas** - Para gerar o link de checkout
2. ✅ **Dados Internos** - Para auditoria, double-check e rastreamento
3. ✅ **Signature HMAC** - Para fraud prevention

## Fluxo Passo-a-Passo

### Etapa 1: Usuário Clica em "Finalizar Compra"

```
CheckoutButton.handleCheckoutClick()
├─ Valida autenticação
├─ Valida se carrinho tem itens
├─ Valida se todos os itens são da mesma empresa
├─ Busca dados existentes do usuário (para pré-preencher formulário)
└─ Abre CheckoutModal
```

### Etapa 2: Usuário Preenche Dados de Entrega

```
CheckoutModal
├─ Formulário com:
│  ├─ CPF (não editável se já cadastrado)
│  ├─ Endereço (Rua, Número, Bairro, CEP, Cidade, Estado)
│  └─ Complemento (opcional)
└─ Clica "Pagar"
```

### Etapa 3: Sistema Processa Checkout (CartContext.startCheckout)

```
startCheckout(userData, discount)
│
├─ Valida usuário autenticado
├─ Valida carrinho não vazio
├─ Pega orderId do CartContext (criada quando adicionou primeiro item)
├─ Atualiza Order: status CREATED → PENDING_PAYMENT (no Firebase)
│
└─ Chama CheckoutService.createCheckout()
    │
    └─ Converte Order items → CartItem format
       └─ Chama createPaymentCheckout()
```

### Etapa 4: Serviço de Pagamento Monta Request

```
checkoutService-new.createPaymentCheckout(data)
│
├─ Valida itens e total
├─ Pega companyId do primeiro produto
├─ Busca dados da empresa (walletId)
│
├─ SEÇÃO 1: Dados Asaas
│  ├─ billingTypes: ['CREDIT_CARD', 'PIX']
│  ├─ chargeTypes: ['DETACHED']
│  ├─ minutesToExpire: 15
│  ├─ totalAmount: (recalculado: quantity × price)
│  ├─ externalReference: UUID único
│  ├─ callback: URLs (success, cancel, expired)
│
├─ SEÇÃO 2: Items
│  └─ Para cada item:
│     ├─ externalReference (productId)
│     ├─ productId (para double-check)
│     ├─ description
│     ├─ imageBase64 (convertida de URL)
│     ├─ name
│     ├─ quantity
│     ├─ value (unitPrice)
│     └─ unitPrice (duplicado)
│
├─ SEÇÃO 3: Customer Data
│  ├─ name
│  ├─ cpfCnpj (sem caracteres especiais)
│  ├─ email
│  ├─ phone (sem caracteres especiais)
│  ├─ address (rua)
│  ├─ addressNumber
│  ├─ complement
│  ├─ province (bairro)
│  ├─ postalCode (sem caracteres especiais)
│  └─ city
│
├─ SEÇÃO 4: Parcelamento
│  └─ maxInstallmentCount: 12
│
├─ SEÇÃO 5: Splits (Divisão de Pagamento)
│  ├─ Wallet 1: Empresa (ex: 90%)
│  └─ Wallet 2: Afiliado se houver (ex: 10%)
│
├─ SEÇÃO 6: Dados Internos (NOVO!)
│  ├─ orderId: (Firebase Order ID) ← CRÍTICO
│  ├─ companyId: (empresa dona dos produtos)
│  ├─ companyOrder: (nome da empresa)
│  ├─ userId: (usuário que está comprando)
│  └─ productList: [{productId, quantity}]
│
└─ SEÇÃO 7: Segurança
   ├─ Gera signature HMAC-SHA256
   │  └─ Assinados: companyId, totalAmount, items[].productId/quantity/unitPrice
   └─ signature: "a1b2c3d4..."
```

### Etapa 5: Envia para API Route

```
fetch('/api/checkout/create-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paymentRequest)
})
```

### Etapa 6: API Route Valida Request

```
/api/checkout/create-payment (route.ts)
│
├─ VALIDAÇÃO 1: Signature
│  ├─ Extrai signature do request
│  ├─ Recalcula: HMAC-SHA256(companyId, totalAmount, items)
│  └─ Se não bater: Retorna 403 Forbidden "Fraud detected"
│
├─ VALIDAÇÃO 2: Dados Internos (Double-Check)
│  ├─ Verifica orderId existe no Firebase
│  ├─ Verifica userId existe
│  ├─ Verifica companyId existe e tem walletId
│  ├─ Valida cada produto:
│  │  ├─ Existe no Firebase?
│  │  ├─ Tem estoque suficiente?
│  │  └─ Tem preço correto?
│  ├─ Valida cupom se houver
│  ├─ Valida afiliado se houver
│  └─ Recalcula totalAmount
│
├─ Se todas validações passarem:
│  ├─ Relay para n8n webhook
│  └─ n8n comunica com Asaas API
│
└─ n8n retorna checkoutId e link
   └─ API Route retorna para frontend
```

### Etapa 7: Frontend Redireciona para Asaas

```
Asaas Checkout Link
│
├─ Usuário vê produtos e valores confirmados
├─ Escolhe forma de pagamento (Crédito/PIX)
├─ Insere dados de pagamento
└─ Confirma pagamento
```

### Etapa 8: Asaas Processa Pagamento

```
Asaas API
│
├─ Se pagamento sucede:
│  └─ Callback para: callback.successUrl
│     └─ Frontend salva checkoutId no localStorage
│        └─ Atualiza Order status: PENDING_PAYMENT → PAID
│
└─ Se pagamento falha/expira:
   └─ Callback para: callback.cancelUrl ou callback.expiredUrl
      └─ Usuário pode tentar novamente
```

## Dados por Fase

### Fase 1: Frontend (CheckoutButton)
```
- Cart items
- Total amount
- User email, name
- User CPF, address
```

### Fase 2: CartContext (startCheckout)
```
+ orderId (da order criada ao adicionar primeiro item)
+ companyId (da empresa)
+ companyWalletId (para splits)
+ affiliateData se houver (walletId, commission)
```

### Fase 3: checkoutService-new (createPaymentCheckout)
```
+ Imagens convertidas para base64
+ CEP, telefone, CPF com caracteres especiais removidos
+ totalAmount RECALCULADO (quantidade × preço)
+ signature HMAC-SHA256
+ externalReference (UUID)
```

### Fase 4: API Route (Validação)
```
+ Valida signature
+ Double-check de orderId, userId, companyId
+ Recalcula total (DEVE BATER com frontend)
+ Valida cada produto (existe, tem estoque, preço correto)
```

### Fase 5: n8n (Relay)
```
Passa EXATAMENTE como veio do frontend para Asaas
(exceto validações/rejeições no API Route)
```

## Estrutura Final do Request JSON

```json
{
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED"],
  "minutesToExpire": 15,
  "totalAmount": 150.50,
  "externalReference": "uuid-123-456",
  "callback": {
    "successUrl": "https://xeco.com.br/checkout/success",
    "cancelUrl": "https://xeco.com.br/checkout/cancel",
    "expiredUrl": "https://xeco.com.br/checkout/expired"
  },
  "items": [
    {
      "externalReference": "prod-123",
      "productId": "prod-123",
      "description": "Camiseta",
      "imageBase64": "data:image/png;base64,...",
      "name": "Camiseta Preta",
      "quantity": 2,
      "value": 75.25,
      "unitPrice": 75.25
    }
  ],
  "customerData": {
    "name": "João Silva",
    "cpfCnpj": "12345678900",
    "email": "joao@example.com",
    "phone": "11987654321",
    "address": "Rua das Flores",
    "addressNumber": "150",
    "complement": "Apto 201",
    "province": "Centro",
    "postalCode": "01310000",
    "city": "São Paulo"
  },
  "installment": {
    "maxInstallmentCount": 12
  },
  "splits": [
    {
      "walletId": "empresa-wallet-id",
      "percentageValue": 90
    },
    {
      "walletId": "afiliado-wallet-id",
      "percentageValue": 10
    }
  ],
  "orderId": "NbYhqwWV3dfLR2sZMqqr",
  "companyId": "9ddiJlQ72cmE57lJlkch",
  "companyOrder": "Minha Loja",
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "productList": [
    {
      "productId": "prod-123",
      "quantity": 2
    }
  ],
  "signature": "a1b2c3d4e5f6..."
}
```

## Traceback para Debugging

Se algo der errado, seguir este traceback:

```
❌ Erro: "Fraud detected"
└─ Verificar: /src/lib/checkout-signature.ts
   ├─ validateCheckoutSignature() funcionando?
   └─ Signature gerada corretamente no frontend?

❌ Erro: "Order not found"
└─ Verificar: CartContext → orderId está sendo passado?
   ├─ Order foi criada ao adicionar primeiro item?
   └─ orderId está no localStorage?

❌ Erro: "Data mismatch"
└─ Verificar: /src/services/checkoutValidationService.ts
   ├─ Recalcular: quantity × price = totalAmount esperado?
   └─ Produtos ainda existem com mesmo preço?

❌ Erro: "Product out of stock"
└─ Verificar: Firebase → quantidade em estoque
   ├─ Produto foi deletado?
   └─ Outro usuário comprou no mesmo tempo?

❌ Erro: "Coupon invalid"
└─ Verificar: /src/lib/coupon-service.ts
   ├─ Cupom ainda é válido?
   └─ Limite de uso não foi atingido?
```

## Timeline de Dados

```
T0: Usuário adiciona produto
   └─ CartContext.addToCart()
      └─ OrderService.createOrder() ← Order criada no Firebase
         └─ orderId salvo no CartContext

T1: Usuário clica "Finalizar Compra"
   └─ CheckoutButton.handleCheckoutClick()
      └─ CheckoutModal abre

T2: Usuário preenche formulário e clica "Pagar"
   └─ CheckoutButton.handleConfirmCheckout()
      └─ CartContext.startCheckout(userData, discount)
         └─ CheckoutService.createCheckout()
            └─ createPaymentCheckout()
               ├─ Monta request completo
               ├─ Gera signature
               └─ Envia para API

T3: API Route valida
   ├─ Valida signature
   ├─ Double-check orderId, userId, companyId, produtos
   ├─ Se tudo OK: relay para n8n
   └─ n8n passa para Asaas

T4: Asaas gera checkout
   └─ Retorna checkoutId + link

T5: Frontend redireciona para Asaas
   └─ Usuário faz pagamento

T6: Asaas chama callback
   └─ Frontend redireciona para success/cancel/expired
      └─ OrderService atualiza status
```

## Segurança em Cada Camada

```
Frontend:
├─ HMAC-SHA256 signature (fraud prevention)
└─ Validação básica do formulário

API Route:
├─ Valida signature (403 Forbidden se inválida)
├─ Double-check de orderId, userId, companyId
├─ Recalcula totalAmount (DEVE BATER)
└─ Valida estoque, cupons, afiliados

n8n:
├─ Query histórico de transações
├─ Valida limites de crédito
└─ Query status de carteira

Asaas:
├─ Processamento de pagamento (PCI-DSS)
└─ Webhook com callback
```

## Checklist de Implementação

- [x] CartContext gera orderId ao adicionar primeiro item
- [x] checkoutService recebe orderId
- [x] createPaymentCheckout recebe orderId
- [x] N8NPaymentRequest tem orderId como required
- [x] checkoutService-new.ts inclui orderId no payload
- [x] checkout-signature.ts gera HMAC-SHA256
- [x] API Route valida signature
- [x] Documentação estrutura completa

## Próximos Passos

- [ ] Testar checkout no browser (dev environment)
- [ ] Verificar se orderId chega correto no n8n
- [ ] Validar signature funciona
- [ ] Testar double-check no API Route
- [ ] Testar Asaas webhook callback
- [ ] Testar pagamento end-to-end
