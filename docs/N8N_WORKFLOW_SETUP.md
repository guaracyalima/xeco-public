# Setup Workflow N8N - Xeco Create Checkout

## 📋 Visão Geral

Este workflow n8n implementa TODAS as validações no servidor n8n conforme especificado:

- ✅ Valida estrutura do request
- ✅ Valida se empresa existe e está ativa com walletId
- ✅ Valida se produtos pertencem à empresa
- ✅ Valida stock disponível para cada produto
- ✅ Valida cupom (existe, está ativo, pertence à empresa)
- ✅ Valida quantidade × preço = total (double-check anti-fraude)
- ✅ Calcula splits (8% plataforma + variável empresa/afiliado)
- ✅ Cria checkout no Asaas
- ✅ Salva order em Firebase com status PENDING
- ✅ Retorna checkoutUrl para frontend

## 🚀 Como Importar

1. **Abra o n8n**
2. **Clique em Import**
3. **Selecione o arquivo**: `/workflows/xeco-create-checkout.json`
4. **Pronto!** O workflow estará pronto para configurar

## ⚙️ Configurações Necessárias

### 1. Firebase Service Account

Você precisa configurar as credenciais do Firebase em cada nó Firestore:

**Nós que usam Firebase:**
- Get Company
- Get Product 1 Stock (repetir para cada produto)
- Get Coupon Data
- Get Affiliate Data
- Save Order to Firebase

**Como configurar:**
1. No n8n, vá para Credentials
2. Crie nova credencial: Google Firebase Cloud Firestore
3. Cole seu arquivo `serviceAccountKey.json`
4. Na credencial, configure:
   - Project ID: `xeco-334f5`
5. Salve e use em todos os nós Firestore

### 2. Asaas API Key

Configure a credencial para chamar API Asaas:

**Nó que usa:**
- Create Checkout Asaas

**Como configurar:**
1. No n8n, vá para Credentials
2. Crie nova credencial: Header Auth
3. Configure:
   - Name: `Asaas`
   - Add Header:
     - Header name: `x-api-key`
     - Header value: `sua-chave-asaas-aqui`
4. Use em "Create Checkout Asaas"

## 📊 Fluxo de Nós

```
Webhook
  ↓
Validate Request Structure (Validar estrutura básica)
  ↓
Get Company (Buscar empresa em Firebase)
  ↓
Check Company Active and Has Wallet (Verificar status e walletId)
  ├─ Sucesso → Validate Products Belong to Company
  └─ Erro → Return Company Error → Respond Error
  ↓
Validate Products Belong to Company (Validar que produtos pertencem à empresa)
  ↓
Prepare Stock Validations (Preparar busca de stock)
  ↓
Get Product 1 Stock (Buscar stock em Firebase)
  ↓
Validate Stock Quantity (Validar quantidade disponível)
  ↓
Check if Has Coupon (Verificar se tem cupom)
  ↓
Has Coupon? (Se node)
  ├─ Sim → Get Coupon Data → Validate Coupon → Get Affiliate Data
  └─ Não → No Coupon Data
  ↓
Validate and Prepare Coupon Data (Double-check preço + preparar dados)
  ↓
Calculate Splits (Calcular split: 8% plataforma + 92% ou (92-x)% + x%)
  ↓
Mount Asaas Payload (Montar payload para Asaas)
  ↓
Create Checkout Asaas (Chamar API Asaas)
  ↓
Check Asaas Success (Verificar se criou com sucesso)
  ├─ Sucesso → Prepare Order Data → Save Order to Firebase → Return Success → Respond Success
  └─ Erro → Return Asaas Error → Respond Error
```

## 🔄 Validações em Detalhes

### 1. Validate Request Structure
Verifica se o request tem:
- `orderId`
- `userId`
- `companyId`
- `cartItems` (array com pelo menos 1 item)
- `customerData`
- `finalTotal`

### 2. Check Company Active and Has Wallet
Valida:
- Empresa existe em Firebase
- `status === 'active'`
- Tem `asaasWalletId` configurado

### 3. Validate Products Belong to Company
Verifica:
- Cada produto tem `companyOwner === companyId`

### 4. Validate Stock Quantity
Checa:
- `product.stock >= item.quantity`
- Se falhar, retorna erro com produto e quantidade disponível

### 5. Validate Coupon
Se houver cupom:
- Existe em Firebase
- `status === 'active'`
- `companyId` bate

Se for afiliado:
- Busca dados do afiliado
- Pega `walletId`

### 6. Validate and Prepare Coupon Data
Double-check anti-fraude:
- `quantidade × preço unitário = subtotal` (comparar com enviado)
- `subtotal - desconto = finalTotal` (validar total final)
- Se não bater, retorna erro

### 7. Calculate Splits
Monta splits conforme especificado:
```
Platform: 8% do finalTotal
Se SEM cupom afiliado:
  Company: 92% do finalTotal
  
Se COM cupom afiliado:
  Company: (92 - discountPercentage)% do finalTotal
  Affiliate: discountPercentage% do finalTotal
```

## 📝 Formato do Request (do Backend)

```json
{
  "orderId": "order_123456789",
  "userId": "user_uid_firebase",
  "companyId": "company_id",
  "cartItems": [
    {
      "id": "prod_1",
      "name": "Produto 1",
      "price": 100.00,
      "quantity": 2,
      "description": "Descrição",
      "companyOwner": "company_id",
      "image": "data:image/jpeg;base64,...",
      "stock": 10
    }
  ],
  "subtotal": 200.00,
  "discount": 0.00,
  "finalTotal": 200.00,
  "couponCode": "AFFILIATE_CODE_123",
  "customerData": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "cpfCnpj": "12345678900",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apt 456",
      "neighborhood": "Bairro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    }
  },
  "callbacks": {
    "success": "https://xeco.com.br/carrinho/sucesso?orderId=order_123456789",
    "cancel": "https://xeco.com.br/carrinho/cancelado?orderId=order_123456789",
    "expired": "https://xeco.com.br/carrinho/expirado?orderId=order_123456789"
  }
}
```

## 📤 Resposta de Sucesso

```json
{
  "success": true,
  "checkoutId": "chk_123456789",
  "checkoutUrl": "https://sandbox.asaas.com/checkout/abc123",
  "orderId": "order_123456789"
}
```

## ❌ Resposta de Erro

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva"
}
```

## 🧪 Como Testar

### 1. Ativar o Webhook

1. Abra o workflow no n8n
2. Clique em "Webhook"
3. Copie o URL do webhook
4. Use em seu teste

### 2. Testar com cURL

```bash
curl -X POST https://seu-n8n-url/webhook/xeco-create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_test_123",
    "userId": "user_uid",
    "companyId": "company_test_id",
    "cartItems": [
      {
        "id": "prod_1",
        "name": "Produto Teste",
        "price": 100,
        "quantity": 1,
        "companyOwner": "company_test_id",
        "description": "Teste"
      }
    ],
    "subtotal": 100,
    "finalTotal": 100,
    "customerData": {
      "name": "Teste",
      "email": "teste@example.com",
      "phone": "11999999999",
      "cpfCnpj": "12345678900",
      "address": {
        "street": "Rua Teste",
        "number": "123",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01310-100"
      }
    },
    "callbacks": {
      "success": "https://xeco.com.br/sucesso",
      "cancel": "https://xeco.com.br/cancelado",
      "expired": "https://xeco.com.br/expirado"
    }
  }'
```

### 3. Verificar Firebase

Após sucesso:
1. Abra Firebase Console
2. Vá para Firestore
3. Collection `orders`
4. Procure pelo `orderId` que você enviou
5. Confirme que tem status `PENDING`

## ⚠️ Pontos Importantes

1. **Firebase Project ID**: Confirme que é `xeco-334f5`
2. **Asaas Environment**: Está usando `api-sandbox.asaas.com` por padrão (para produção mudar para `api.asaas.com`)
3. **Stock Dinâmico**: Se tiver múltiplos produtos, você precisa adicionar mais nós "Get Product X Stock" para cada um
4. **Cupom Afiliado**: Só busca dados do afiliado se `coupon.type === 'affiliate'`
5. **Double-Check**: Sempre valida preço para evitar fraude (quantidade × preço deve bater)

## 🔧 Troubleshooting

### Erro: "Firebase credentials not configured"
- Verifique se você configurou a credencial do Firebase em todos os nós Firestore

### Erro: "Asaas API Key invalid"
- Confirme que copiou corretamente a chave Asaas
- Verifique se está usando sandboxkey para sandbox ou production key para produção

### Erro: "Produto não encontrado"
- Verifique se os produtos existem em Firebase
- Confirme que `companyOwner` em cada produto bate com `companyId` do request

### Erro: "Cupom não pertence à esta empresa"
- Certifique-se que o cupom foi criado com `companyId` correto

### Ordem não salva em Firebase
- Verifique se todos os campos obrigatórios estão sendo passados
- Confirme que Firebase credencial está correta

## 📚 Próximos Passos

1. ✅ Importar workflow
2. ✅ Configurar credenciais Firebase e Asaas
3. ✅ Testar com cURL
4. ✅ Ativar webhook em produção
5. ⏳ Conectar frontend ao endpoint do webhook
6. ⏳ Implementar callbacks (sucesso/cancelado/expirado)

