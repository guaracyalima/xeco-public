# Estrutura Completa do Request Asaas para Checkout

## Visão Geral

O checkout agora envia um request **COMPLETO** para o Asaas (via n8n) que inclui:
1. ✅ **Dados Asaas**: Tudo que o Asaas espera para gerar o link de checkout
2. ✅ **Dados Internos**: Campos para auditoria, double-check e rastreamento

## Estrutura do Request

```typescript
{
  // ============================================
  // SEÇÃO 1: CONFIGURAÇÃO DO ASAAS
  // ============================================
  
  // Tipos de pagamento disponíveis
  "billingTypes": ["CREDIT_CARD", "PIX"],
  
  // Tipo de cobrança: DETACHED = link de checkout
  "chargeTypes": ["DETACHED"],
  
  // Tempo de expiração do link em minutos
  "minutesToExpire": 15,
  
  // Valor total em reais (número)
  "totalAmount": 150.50,
  
  // ID externo único para esta transação (UUID)
  "externalReference": "dcf4dff9-b080-425c-b234-765f2ffac0ae",
  
  // ============================================
  // SEÇÃO 2: CALLBACKS (URLs de retorno)
  // ============================================
  "callback": {
    // URL para após pagamento bem-sucedido
    "successUrl": "https://xeco.com.br/checkout/success",
    
    // URL para se usuário cancelar
    "cancelUrl": "https://xeco.com.br/checkout/cancel",
    
    // URL para se link expirar
    "expiredUrl": "https://xeco.com.br/checkout/expired"
  },
  
  // ============================================
  // SEÇÃO 3: ITENS DO CARRINHO
  // ============================================
  "items": [
    {
      // ID único do item (geralmente = productId)
      "externalReference": "prod-12345",
      
      // ID do produto no banco (para double-check)
      "productId": "prod-12345",
      
      // Descrição curta
      "description": "Camiseta Preta Tamanho M",
      
      // Imagem em base64 (ou data:image/png;base64,...)
      "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
      
      // Nome do produto
      "name": "Camiseta",
      
      // Quantidade
      "quantity": 2,
      
      // Valor unitário
      "value": 75.25,
      
      // Unitário (duplicado para double-check)
      "unitPrice": 75.25
    },
    // ... mais itens
  ],
  
  // ============================================
  // SEÇÃO 4: DADOS DO CLIENTE
  // ============================================
  "customerData": {
    // Nome completo
    "name": "João Silva",
    
    // CPF ou CNPJ (apenas números)
    "cpfCnpj": "12345678900",
    
    // Email
    "email": "joao@example.com",
    
    // Telefone (apenas números)
    "phone": "11987654321",
    
    // Endereço (rua)
    "address": "Rua das Flores",
    
    // Número
    "addressNumber": "150",
    
    // Complemento (apto, sala, etc)
    "complement": "Apto 201",
    
    // Bairro
    "province": "Centro",
    
    // CEP (apenas números)
    "postalCode": "01310000",
    
    // Cidade (ID ou nome)
    "city": "São Paulo"
  },
  
  // ============================================
  // SEÇÃO 5: PARCELAS
  // ============================================
  "installment": {
    // Máximo de parcelas (1 = sem parcelamento)
    "maxInstallmentCount": 12
  },
  
  // ============================================
  // SEÇÃO 6: SPLIT DE PAGAMENTO
  // ============================================
  "splits": [
    {
      // Wallet ID da empresa (recebe a maior parte)
      "walletId": "7bafd95a-e783-4a62-9be1-23999af742c6",
      
      // Percentual que vai para essa wallet (ex: 90%)
      "percentageValue": 90
    },
    {
      // Wallet ID do afiliado (se houver)
      "walletId": "8cbfd95a-e783-4a62-9be1-23999af742c7",
      
      // Percentual para afiliado (ex: 10%)
      "percentageValue": 10
    }
  ],
  
  // ============================================
  // SEÇÃO 7: DADOS INTERNOS (AUDITORIA & DOUBLE-CHECK)
  // ============================================
  
  // ID da ordem criada no Firebase
  "orderId": "NbYhqwWV3dfLR2sZMqqr",
  
  // ID da empresa no Firebase
  "companyId": "9ddiJlQ72cmE57lJlkch",
  
  // Nome da empresa (para logs)
  "companyOrder": "Minha Loja LTDA",
  
  // ID do usuário no Firebase
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  
  // Lista de produtos (para rastreamento)
  "productList": [
    {
      "productId": "prod-12345",
      "quantity": 2
    },
    {
      "productId": "prod-67890",
      "quantity": 1
    }
  ],
  
  // ============================================
  // SEÇÃO 8: SEGURANÇA
  // ============================================
  
  // Assinatura HMAC-SHA256 do payload
  // Assinada com: companyId, totalAmount, items[].productId/quantity/unitPrice
  "signature": "a1b2c3d4e5f6..."
}
```

## Fluxo de Validação

### Frontend (checkoutService-new.ts)
1. ✅ Monta o request completo com todos os dados
2. ✅ Gera a assinatura HMAC-SHA256
3. ✅ Envia para a API route do Next.js

### Backend (API Route: /api/checkout/create-payment)
1. ✅ **Valida a assinatura** (403 Forbidden se inválida)
2. ✅ **Valida os dados internos** (double-check):
   - Verifica se orderId existe no Firebase
   - Valida companyId, userId, produtos
   - Recalcula o total (DEVE BATER)
3. ✅ **Se tudo estiver OK**, relay para n8n
4. ✅ n8n processa e retorna link do Asaas

## Dados Internos para Double-Check

### orderId
```
Por quê: Cada pagamento está vinculado a um orderId no Firebase
Uso: Validar que a ordem foi realmente criada
Ação se falhar: Retornar erro 400 "Order not found"
```

### userId
```
Por quê: Rastreamento de quem está fazendo o pagamento
Uso: Validar que o usuário existe e está autenticado
Ação se falhar: Retornar erro 401 "User not found"
```

### companyId
```
Por quê: Garantir que o split vai para a empresa correta
Uso: Validar que a empresa existe e tem walletId
Ação se falhar: Retornar erro 400 "Company not found"
```

### productList
```
Por quê: Rastreamento de quais produtos foram comprados
Uso: Validar que cada produto existe e tem estoque
Ação se falhar: Retornar erro 400 "Product out of stock"
```

### signature
```
Por quê: Prevenir tampering de preços/quantidades
Uso: Validar que companyId, totalAmount, items não foram alterados
Ação se falhar: Retornar erro 403 "Signature invalid - fraud detected"
```

## Exemplo de Request Completo (JSON Real)

```json
{
  "billingTypes": ["CREDIT_CARD", "PIX"],
  "chargeTypes": ["DETACHED"],
  "minutesToExpire": 15,
  "totalAmount": 150.50,
  "externalReference": "dcf4dff9-b080-425c-b234-765f2ffac0ae",
  "callback": {
    "successUrl": "https://xeco.com.br/checkout/success",
    "cancelUrl": "https://xeco.com.br/checkout/cancel",
    "expiredUrl": "https://xeco.com.br/checkout/expired"
  },
  "items": [
    {
      "externalReference": "prod-12345",
      "productId": "prod-12345",
      "description": "Camiseta Preta",
      "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "name": "Camiseta",
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
      "walletId": "7bafd95a-e783-4a62-9be1-23999af742c6",
      "percentageValue": 90
    },
    {
      "walletId": "8cbfd95a-e783-4a62-9be1-23999af742c7",
      "percentageValue": 10
    }
  ],
  "orderId": "NbYhqwWV3dfLR2sZMqqr",
  "companyId": "9ddiJlQ72cmE57lJlkch",
  "companyOrder": "Minha Loja LTDA",
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  "productList": [
    {
      "productId": "prod-12345",
      "quantity": 2
    }
  ],
  "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

## Mapeamento: Frontend → Asaas

| Campo | Origem | Propósito |
|-------|--------|----------|
| billingTypes | Hardcoded | Permite CREDIT_CARD e PIX |
| chargeTypes | Hardcoded | DETACHED = link de checkout |
| minutesToExpire | Hardcoded (15) | Validade do link |
| totalAmount | CartContext items | Valor total do carrinho |
| externalReference | UUID gerado | ID único da transação |
| callback | config.ts | URLs de retorno |
| items | CartContext | Produtos do carrinho |
| customerData | Checkout Form + Firebase | Dados do cliente |
| installment | Hardcoded (12) | Parcelas disponíveis |
| splits | OrderService | Divisão entre empresa e afiliado |
| **orderId** | **Firebase Order** | **Auditoria interna** |
| **companyId** | **Primeiro item** | **Double-check** |
| **userId** | **Auth Context** | **Rastreamento** |
| **productList** | **CartContext** | **Logging** |
| **signature** | **HMAC-SHA256** | **Fraud prevention** |

## Modificações Necessárias no Frontend

### 1. Adicionar orderId ao createPaymentCheckout()

```typescript
// components/checkout/CheckoutComponent.tsx
const paymentResult = await createPaymentCheckout({
  cartItems: cart.items,
  userData: formData,
  orderId: cart.orderId,  // ← NOVO: Pega do CartContext
  userId: user.uid,
  companyWalletId: company.walletId,
  affiliateData: affiliate,
  userEmail: user.email,
  userName: user.displayName,
  userPhone: formData.phone
})
```

## Modificações Necessárias no Backend (n8n)

### 1. Usar orderId para validação

```
No n8n webhook:
- Pegar o orderId do request
- Fazer query no Firebase: orders/{orderId}
- Comparar userId, companyId, totalAmount
- Se divergir: retornar erro 400 "Data mismatch"
```

### 2. Validar signature

```
No API Route (/api/checkout/create-payment):
- Extrair signature do request
- Recalcular: HMAC-SHA256(companyId, totalAmount, items)
- Se não bater: retornar 403 "Fraud detected"
```

### 3. Salvar referência Asaas no Firebase

```typescript
// Após receber resposta do Asaas
await updateOrder(orderId, {
  asaasCheckoutId: responseData.id,  // ID do checkout no Asaas
  asaasCheckoutUrl: responseData.link,
  asaasExternalReference: externalReference,
  status: 'PENDING_PAYMENT'
})
```

## Status Flow

```
CartContext: addToCart()
  ↓
OrderService: createOrder()
  → Firestore: Order created (status: CREATED)
  ↓
CheckoutComponent: startCheckout()
  ↓
checkoutService: createPaymentCheckout()
  → Include: orderId, signature, all Asaas data
  ↓
API Route: /api/checkout/create-payment
  → Validate: signature, orderId, data
  ↓
n8n: Relay to Asaas API
  → Create payment link
  ↓
Asaas: Returns link + checkoutId
  ↓
API Route: Returns response
  ↓
OrderService: updateOrder()
  → Update Firestore: asaasCheckoutId, asaasCheckoutUrl, status: PENDING_PAYMENT
  ↓
Frontend: Redirect to Asaas link
```

## Checklist de Implementação

- [ ] CartContext exporta `orderId`
- [ ] checkoutService recebe `orderId` em CreatePaymentData
- [ ] checkoutService inclui `orderId` em N8NPaymentRequest
- [ ] N8NPaymentRequest interface tem `orderId` como required
- [ ] checkoutService gera signature (já feito ✅)
- [ ] API Route valida signature (já feito ✅)
- [ ] API Route valida orderId existe
- [ ] API Route valida dados internos
- [ ] n8n relay para Asaas (usando dados do request)
- [ ] Asaas retorna checkoutId
- [ ] API Route salva checkoutId no Firestore
- [ ] Frontend redireciona para Asaas link
