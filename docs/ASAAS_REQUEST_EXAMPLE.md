# Exemplo Real do Request JSON Completo

## Cenário

Um usuário (João Silva) quer comprar:
- 2x Camiseta Preta (R$ 75,25 cada = R$ 150,50)
- Da loja: Minha Loja LTDA
- Com afiliado (cupom de afiliado)

## Request JSON Completo

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
      "externalReference": "prod-camiseta-preta-123",
      "productId": "prod-camiseta-preta-123",
      "description": "Camiseta Preta Tamanho M",
      "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
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
      "productId": "prod-camiseta-preta-123",
      "quantity": 2
    }
  ],
  "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z"
}
```

## Explicação de Cada Campo

### SEÇÃO 1: Configuração Asaas

```json
{
  "billingTypes": ["CREDIT_CARD", "PIX"],
  // ↑ Cliente pode pagar com Cartão de Crédito ou PIX
  
  "chargeTypes": ["DETACHED"],
  // ↑ DETACHED = Link de checkout (não é fatura)
  
  "minutesToExpire": 15,
  // ↑ O link expira em 15 minutos
  
  "totalAmount": 150.50,
  // ↑ Valor total: 2 × 75,25 = 150,50 reais
  
  "externalReference": "dcf4dff9-b080-425c-b234-765f2ffac0ae"
  // ↑ ID único da transação (UUID)
}
```

### SEÇÃO 2: Callbacks (URLs de Retorno)

```json
{
  "callback": {
    "successUrl": "https://xeco.com.br/checkout/success",
    // ↑ Para onde ir se pagamento deu certo
    
    "cancelUrl": "https://xeco.com.br/checkout/cancel",
    // ↑ Para onde ir se usuário cancelou
    
    "expiredUrl": "https://xeco.com.br/checkout/expired"
    // ↑ Para onde ir se link expirou
  }
}
```

### SEÇÃO 3: Itens do Carrinho

```json
{
  "items": [
    {
      "externalReference": "prod-camiseta-preta-123",
      // ↑ ID único do produto na loja (mesmo que productId)
      
      "productId": "prod-camiseta-preta-123",
      // ↑ ID do produto no Firebase (para double-check backend)
      
      "description": "Camiseta Preta Tamanho M",
      // ↑ Descrição do produto (que Asaas mostra)
      
      "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
      // ↑ Imagem em base64 (convertida de URL)
      
      "name": "Camiseta Preta",
      // ↑ Nome do produto
      
      "quantity": 2,
      // ↑ Quantidade: 2 unidades
      
      "value": 75.25,
      // ↑ Preço unitário: R$ 75,25
      
      "unitPrice": 75.25
      // ↑ Duplicado: unitPrice para segurança
    }
  ]
  
  // Verificação: 2 × 75,25 = 150,50 ✓
}
```

### SEÇÃO 4: Dados do Cliente

```json
{
  "customerData": {
    "name": "João Silva",
    // ↑ Nome completo do cliente
    
    "cpfCnpj": "12345678900",
    // ↑ CPF/CNPJ sem caracteres especiais (era 123.456.789-00)
    
    "email": "joao@example.com",
    // ↑ Email do cliente
    
    "phone": "11987654321",
    // ↑ Telefone sem caracteres especiais (era 11 98765-4321)
    
    "address": "Rua das Flores",
    // ↑ Nome da rua
    
    "addressNumber": "150",
    // ↑ Número
    
    "complement": "Apto 201",
    // ↑ Complemento (apto, sala, etc)
    
    "province": "Centro",
    // ↑ Bairro
    
    "postalCode": "01310000",
    // ↑ CEP sem caracteres especiais (era 01310-000)
    
    "city": "São Paulo"
    // ↑ Cidade
  }
}
```

### SEÇÃO 5: Parcelamento

```json
{
  "installment": {
    "maxInstallmentCount": 12
    // ↑ Cliente pode parcelar em até 12 vezes
  }
}
```

### SEÇÃO 6: Split de Pagamento

```json
{
  "splits": [
    {
      "walletId": "7bafd95a-e783-4a62-9be1-23999af742c6",
      // ↑ Wallet da empresa (recebe a maior parte)
      
      "percentageValue": 90
      // ↑ Empresa recebe 90% = R$ 135,45
    },
    {
      "walletId": "8cbfd95a-e783-4a62-9be1-23999af742c7",
      // ↑ Wallet do afiliado
      
      "percentageValue": 10
      // ↑ Afiliado recebe 10% = R$ 15,05
    }
  ]
  
  // Verificação: 90% + 10% = 100% ✓
  // Empresa recebe: 150,50 × 0,90 = 135,45
  // Afiliado recebe: 150,50 × 0,10 = 15,05
}
```

### SEÇÃO 7: Dados Internos (NOVO!)

```json
{
  "orderId": "NbYhqwWV3dfLR2sZMqqr",
  // ↑ ID da ordem no Firebase (para auditoria)
  // Criada quando usuário adicionou primeiro item ao carrinho
  
  "companyId": "9ddiJlQ72cmE57lJlkch",
  // ↑ ID da empresa (para validação backend)
  
  "companyOrder": "Minha Loja LTDA",
  // ↑ Nome da empresa (para logs)
  
  "userId": "RRFPNnuygPZ6QlXhmUFlMVqVNwj1",
  // ↑ ID do usuário (para tracking)
  
  "productList": [
    {
      "productId": "prod-camiseta-preta-123",
      "quantity": 2
    }
  ]
  // ↑ Lista de produtos (para rastreamento detalhado)
}
```

### SEÇÃO 8: Segurança

```json
{
  "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z"
  // ↑ HMAC-SHA256 dos dados críticos:
  //   - companyId: "9ddiJlQ72cmE57lJlkch"
  //   - totalAmount: 150.50
  //   - items[0].productId: "prod-camiseta-preta-123"
  //   - items[0].quantity: 2
  //   - items[0].unitPrice: 75.25
  //
  // Se algum desses valores for alterado no DevTools:
  // → Signature não vai bater
  // → API retorna 403 Forbidden "Fraud detected"
}
```

## Origem de Cada Campo

| Campo | Origem | Quando |
|-------|--------|--------|
| billingTypes | Hardcoded | Sempre |
| chargeTypes | Hardcoded | Sempre |
| minutesToExpire | Hardcoded | Sempre |
| totalAmount | CartContext | Recalculado no frontend |
| externalReference | UUID gerado | Antes de enviar |
| callback.successUrl | config.ts | Antes de enviar |
| callback.cancelUrl | config.ts | Antes de enviar |
| callback.expiredUrl | config.ts | Antes de enviar |
| items[].externalReference | CartContext (product.id) | Do carrinho |
| items[].productId | CartContext (product.id) | Do carrinho |
| items[].description | CartContext (product.description) | Do carrinho |
| items[].imageBase64 | Convertida de product.imagesUrl | Do carrinho |
| items[].name | CartContext (product.name) | Do carrinho |
| items[].quantity | CartContext (item.quantity) | Do carrinho |
| items[].value | CartContext (product.salePrice) | Do carrinho |
| items[].unitPrice | CartContext (product.salePrice) | Do carrinho |
| customerData.name | Checkout Form (userName) | Do usuário |
| customerData.cpfCnpj | Firebase User ou Checkout Form | Do usuário |
| customerData.email | Firebase User | Autenticação |
| customerData.phone | Checkout Form | Formulário |
| customerData.address | Checkout Form | Formulário |
| customerData.addressNumber | Checkout Form | Formulário |
| customerData.complement | Checkout Form | Formulário |
| customerData.province | Checkout Form | Formulário |
| customerData.postalCode | Checkout Form | Formulário |
| customerData.city | Checkout Form | Formulário |
| installment.maxInstallmentCount | Hardcoded | Sempre |
| splits[].walletId | OrderService | Calculado |
| splits[].percentageValue | OrderService | Calculado |
| orderId | CartContext | Criado ao adicionar item |
| companyId | CartContext (product.companyOwner) | Do carrinho |
| companyOrder | Firebase companies | Buscado no DB |
| userId | Firebase Auth | Autenticação |
| productList | CartContext | Do carrinho |
| signature | Gerado no frontend | Antes de enviar |

## Validações em Cada Camada

### Frontend (checkoutService-new.ts)
```
✓ Carrinho não vazio
✓ totalAmount > 0
✓ Todos os itens têm quantity > 0
✓ Empresa existe
✓ Produtos têm imagem (ou usa default)
✓ CPF, CEP, Telefone formatados corretamente
```

### API Route (/api/checkout/create-payment)
```
✓ Signature é válida (HMAC-SHA256)
✓ orderId existe no Firebase
✓ userId existe no Firebase
✓ companyId existe e tem walletId
✓ Cada produto existe e tem estoque
✓ Cada produto tem o preço correto
✓ Cupom (se houver) é válido
✓ Afiliado (se houver) é válido
✓ totalAmount recalculado BATE com frontend
```

### n8n
```
✓ Todos os campos obrigatórios presentes
✓ Formatos corretos (números, strings, arrays)
✓ Valores numéricos válidos
✓ URLs válidas
```

### Asaas
```
✓ Tipos de pagamento suportados
✓ Valores numéricos válidos
✓ Cliente existe ou será criado
✓ Wallets existem
```

## Fluxo de Teste

Para testar este request:

### 1. Adicionar ao Console do Browser
```javascript
// Depois de fazer login
localStorage.setItem('test-order-id', 'NbYhqwWV3dfLR2sZMqqr')

// Adicionar produto ao carrinho
// Preencher checkout

// Verificar na Network:
// POST /api/checkout/create-payment
// Body deve conter todos esses campos
```

### 2. Inspecionar no DevTools
```javascript
// Abrir DevTools → Network → XHR/Fetch
// Clicar em "Finalizar Compra"
// Procurar por: POST /api/checkout/create-payment
// Verificar payload completo no Preview
```

### 3. Testar Tampering
```javascript
// Abrir DevTools → Console
// No listener do form, modificar preço:
// Exemplo: mudar 75.25 para 1.00
// Submeter
// Resultado esperado: 403 Forbidden "Fraud detected"
```

## Formato de Resposta de Sucesso

```json
{
  "success": true,
  "id": "checkout-id-123",
  "link": "https://asaas.com/checkout/...",
  "status": "PENDING",
  "externalReference": "dcf4dff9-b080-425c-b234-765f2ffac0ae"
}
```

## Formato de Resposta de Erro

```json
{
  "success": false,
  "errors": [
    {
      "code": "FRAUD_DETECTED",
      "description": "Signature inválida - dados foram alterados"
    }
  ]
}
```

## Checklist de Integridade

Ao enviar este request:

- [ ] billingTypes contém apenas valores válidos (CREDIT_CARD, PIX, BOLETO)
- [ ] chargeTypes contém apenas DETACHED ou INSTALLMENT
- [ ] minutesToExpire está entre 1 e 525600
- [ ] totalAmount é > 0 e < 99999999
- [ ] externalReference é único (UUID)
- [ ] Todos os items têm quantity > 0
- [ ] Todos os items têm value > 0
- [ ] CPF/CNPJ tem exatamente 11 ou 14 dígitos
- [ ] CEP tem exatamente 8 dígitos
- [ ] Telefone tem entre 10 e 11 dígitos
- [ ] email é válido
- [ ] Splits somam 100%
- [ ] orderId existe no Firebase
- [ ] userId existe no Firebase
- [ ] companyId existe no Firebase
- [ ] signature é válida para os dados
- [ ] Nenhum campo obrigatório é null ou undefined
