# Fluxo n8n - Criar Checkout Asaas

## Visão Geral

Este fluxo n8n recebe os dados **JÁ VALIDADOS** do backend Next.js e cria o checkout no Asaas. O backend faz TODAS as validações (empresa, estoque, cupom, preços), o n8n só cria o checkout.

## Estrutura do Fluxo

### 1. Webhook (Entrada)
- **Path**: `xeco-create-checkout`
- **Method**: POST
- **Recebe**: Dados validados do backend

### 2. Criar Checkout Asaas (HTTP Request)
- **URL**: `https://api-sandbox.asaas.com/v3/checkouts` (sandbox) ou produção
- **Headers**: Auth com API Key do Asaas
- **Body**: Dados formatados para o Asaas

### 3. Salvar Checkout (Firebase - Opcional)
- **Collection**: `orders`
- **Operation**: upsert
- **Update Key**: `orderId`
- Atualiza a order com os dados do checkout criado

### 4. Responder ao Backend (Return Response)
- **Retorna**: 
  ```json
  {
    "checkoutId": "id-do-checkout",
    "checkoutUrl": "link-do-checkout",
    "message": "Checkout criado com sucesso"
  }
  ```

## Payload Recebido do Backend

```json
{
  "orderId": "uuid",
  "companyId": "company-id",
  "userId": "firebase-uid",
  "totalAmount": 150.50,
  "couponCode": "opcional",
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2,
      "unitPrice": 75.25
    }
  ],
  "customerData": {
    "name": "João Silva",
    "cpfCnpj": "12345678900",
    "email": "joao@example.com",
    "phone": "11999999999",
    "address": "Rua Teste",
    "addressNumber": "123",
    "complement": "Apto 45",
    "province": "Centro",
    "postalCode": "01310000",
    "city": "São Paulo"
  }
}
```

## Dados que o Backend Envia Adicionalmente (em headers ou body)

O backend também envia (veja o código da API route):
- `splits`: Array com splits calculados (empresa + afiliado se houver)
- `productList`: Lista de produtos com IDs
- `billingTypes`: ["CREDIT_CARD", "PIX"]
- `chargeTypes`: ["DETACHED", "INSTALLMENT"]
- `minutesToExpire`: 15
- `callback`: URLs de success, cancel, expired
- `items`: Produtos formatados com imageBase64

## Nós do n8n (Simplificado)

### Node 1: Webhook
```
- Type: Webhook
- Path: xeco-create-checkout
- Method: POST
- Response Mode: Last Node
```

### Node 2: Create Checkout (HTTP Request)
```
- Type: HTTP Request
- Method: POST
- URL: https://api-sandbox.asaas.com/v3/checkouts
- Auth: Header (x-api-key)
- Body: Recebes do webhook via $json
```

### Node 3: Check Success (If)
```
- Type: If
- Condition: $json.id ? true : false
- True: Próximo node (Save/Return)
- False: Return Error
```

### Node 4: Return Success
```
- Type: Set
- Output:
{
  "checkoutId": "{{ $json.id }}",
  "checkoutUrl": "{{ $json.link }}",
  "message": "Checkout criado com sucesso"
}
```

### Node 5: Respond to Webhook
```
- Type: Respond to Webhook
- Response Body: $json
```

## Diferenças Importantes vs Seu Workflow Original

1. **Sem validações complexas**: Backend já validou tudo
2. **Sem query ao Firebase**: Backend já buscou empresa, produtos, cupom
3. **Sem cálculo de splits**: Backend já calculou
4. **Apenas criar e retornar**: n8n só orquestra e cria o checkout

## Próximos Passos

1. Criar novo workflow no n8n
2. Configurar webhook em `xeco-create-checkout`
3. Configurar HTTP Request com credenciais Asaas
4. Testar com payload do backend
5. Configurar URLs de callback corretas

## URLs de Callback

Configure no seu n8n ou edite no backend em `/src/app/api/checkout/create-payment/route.ts`:

```
Success: https://xeco.com.br/checkout/success
Cancel: https://xeco.com.br/checkout/cancel
Expired: https://xeco.com.br/checkout/expired
```

Para desenvolvimento local:
```
Success: http://localhost:3000/checkout/success
Cancel: http://localhost:3000/checkout/cancel
Expired: http://localhost:3000/checkout/expired
```

## Importante: Dados que Vêm no Body

O backend monta **todo o payload** para o Asaas já pronto:

```typescript
// Você recebe isso do backend no n8n:
{
  billingTypes: ["CREDIT_CARD", "PIX"],
  chargeTypes: ["DETACHED", "INSTALLMENT"],
  minutesToExpire: 15,
  externalReference: "order-uuid",
  callback: { ... },
  items: [ /* com imageBase64 */ ],
  customerData: { ... },
  installment: { maxInstallmentCount: 1 },
  splits: [ /* calculado: empresa + afiliado */ ],
  companyId: "...",
  companyOrder: "...",
  userId: "...",
  productList: [ ... ]
}
```

**No n8n**, você só passa o $json para o Asaas:

```javascript
// HTTP Request body
{{ $json }}
```

## Tratamento de Erros

Se Asaas retorna erro:
1. Check Success node vai pra branch false
2. Return error response
3. Backend recebe erro e mostra pro user

## Salvar Order (Opcional no n8n)

Se quiser salvar os dados do checkout na order:

```
Node: Save Order
Type: Firebase Cloud Firestore
Operation: upsert
Collection: orders
Update Key: orderId
Fields: checkoutId, checkoutUrl, status=PENDING
```

**OU** deixa o backend fazer isso (mais seguro).
