# N8N Complete Payload Reference

## O que o Backend Envia (Payload Completo)

O backend valida TUDO e envia pra n8n um payload COMPLETO com todas as regras já aplicadas:

```json
{
  "orderId": "order_123456789",
  "userId": "user_firebase_uid",
  "companyId": "company_id",
  "environment": "sandbox",
  
  "customerData": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "cpfCnpj": "12345678900",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apt 456",
      "neighborhood": "Bairro da Zona",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    }
  },
  
  "items": [
    {
      "name": "Produto 1",
      "description": "Descrição do Produto 1",
      "quantity": 2,
      "price": 100.00,
      "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/..."
    },
    {
      "name": "Produto 2",
      "description": "Descrição do Produto 2",
      "quantity": 1,
      "price": 250.00,
      "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/..."
    }
  ],
  
  "subtotal": 450.00,
  "discount": 50.00,
  "finalTotal": 400.00,
  
  "coupon": {
    "code": "AFFILIATE_CODE_123",
    "type": "affiliate",
    "discountPercentage": 12.5,
    "discountValue": 50.00,
    "affiliateId": "affiliate_123"
  },
  
  "splits": [
    {
      "walletId": "platform_wallet_id",
      "value": 32.00,
      "description": "Plataforma Xeco (8%)"
    },
    {
      "walletId": "company_wallet_id",
      "value": 318.00,
      "description": "Empresa"
    },
    {
      "walletId": "affiliate_wallet_id",
      "value": 50.00,
      "description": "Comissão Afiliado"
    }
  ],
  
  "callbacks": {
    "success": "https://xeco.com.br/carrinho/sucesso?orderId=order_123456789",
    "cancel": "https://xeco.com.br/carrinho/cancelado?orderId=order_123456789",
    "expired": "https://xeco.com.br/carrinho/expirado?orderId=order_123456789"
  },
  
  "productList": [
    {
      "id": "prod_1",
      "name": "Produto 1",
      "price": 100.00,
      "quantity": 2,
      "companyId": "company_id"
    },
    {
      "id": "prod_2",
      "name": "Produto 2",
      "price": 250.00,
      "quantity": 1,
      "companyId": "company_id"
    }
  ]
}
```

## Validações que o Backend Já Fez (NÃO FAZER NO N8N)

1. ✅ **Empresa existe e está ativa**
   - Validou se existe em Firebase
   - Validou se status = "active"
   - Validou se tem `asaasWalletId` configurado

2. ✅ **Produtos existem**
   - Confirmou cada produto em Firebase
   - Confirmou que pertencem à mesma empresa

3. ✅ **Stock disponível**
   - Validou quantidade no estoque
   - Retorna erro se não tiver quantidade suficiente

4. ✅ **Cupom válido**
   - Validou se cupom existe
   - Validou se está ativo
   - Validou se pertence à empresa
   - Se for afiliado, buscou dados do afiliado

5. ✅ **Preço correto**
   - Calculou quantidade × preço unitário
   - Comparou com total enviado pelo frontend
   - Retorna erro se não bater (proteção contra fraude)

6. ✅ **Split calculado corretamente**
   - 8% sempre vai para a plataforma
   - Se SEM cupom: 92% para empresa
   - Se COM cupom afiliado: (92 - discountPercentage)% para empresa + discountPercentage% para afiliado

## O que o N8N Precisa Fazer

1. **Receber o webhook** com dados já validados
2. **Transformar o payload** para formato Asaas
3. **Chamar API Asaas** com billingType e chargeType corretos
4. **Retornar** checkoutId e checkoutUrl para o frontend

## Payload Enviado para Asaas

```json
{
  "billingType": "CHECKOUT",
  "chargeType": "ASAAS_SUBSCRIPTION",
  "currency": "BRL",
  "redirect": {
    "success": "https://xeco.com.br/carrinho/sucesso?orderId=order_123456789",
    "cancel": "https://xeco.com.br/carrinho/cancelado?orderId=order_123456789",
    "expired": "https://xeco.com.br/carrinho/expirado?orderId=order_123456789"
  },
  "checkoutId": "order_123456789",
  "items": [
    {
      "name": "Produto 1",
      "quantity": 2,
      "price": 100.00,
      "image": "data:image/jpeg;base64,..."
    },
    {
      "name": "Produto 2",
      "quantity": 1,
      "price": 250.00,
      "image": "data:image/jpeg;base64,..."
    }
  ],
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "cpfCnpj": "12345678900",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apt 456",
      "neighborhood": "Bairro da Zona",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    }
  },
  "paymentList": [
    {
      "checkoutId": "order_123456789",
      "value": 400.00,
      "installmentCount": 1,
      "paymentType": "CREDIT_CARD"
    }
  ],
  "splits": [
    {
      "walletId": "platform_wallet_id",
      "value": 32.00,
      "description": "Plataforma Xeco (8%)"
    },
    {
      "walletId": "company_wallet_id",
      "value": 318.00,
      "description": "Empresa"
    },
    {
      "walletId": "affiliate_wallet_id",
      "value": 50.00,
      "description": "Comissão Afiliado"
    }
  ]
}
```

## Resposta Esperada do Asaas

```json
{
  "id": "chk_123456789",
  "link": "https://sandbox.asaas.com/checkout/xyzabc123",
  "checkoutId": "order_123456789",
  "value": 400.00,
  "installmentCount": 1,
  "status": "PENDING"
}
```

## Resposta do N8N para o Frontend

```json
{
  "success": true,
  "checkoutId": "chk_123456789",
  "checkoutUrl": "https://sandbox.asaas.com/checkout/xyzabc123",
  "asaasResponse": {
    "id": "chk_123456789",
    "link": "https://sandbox.asaas.com/checkout/xyzabc123",
    "checkoutId": "order_123456789",
    "value": 400.00,
    "installmentCount": 1,
    "status": "PENDING"
  }
}
```

## Fluxo Completo

```
Frontend
   ↓ (click Finalizar Compra)
   ↓ POST /api/checkout/create-payment
   ↓ (cartItems, userData, couponCode, etc)
   
Backend (Next.js API Route)
   ↓ validateCheckoutRequest() - VALIDA TUDO
     - Empresa existe + ativa + tem walletId
     - Produtos existem + stock disponível + pertencem à empresa
     - Cupom válido + ativo
     - Preço correto (quantidade × preço = total)
   ↓ calculateSplits() - CALCULA SPLITS
     - 8% plataforma
     - (92 - desconto)% empresa
     - desconto% afiliado (se aplicável)
   ↓ Converte imagens para base64
   ↓ POST https://n8n-webhook-url/xeco-create-checkout
   ↓ (payload completo com tudo validado e calculado)

N8N Workflow
   ↓ Webhook recebe dados
   ↓ Transforma payload
   ↓ POST https://api-sandbox.asaas.com/v3/checkouts
   ↓ (com splits, items, customer, etc)

Asaas
   ↓ Cria checkout
   ↓ Retorna id + link

N8N
   ↓ Valida se id existe
   ↓ Se sucesso: Return Success (id + link)
   ↓ Se erro: Return Error (mensagem de erro)
   ↓ Respond to Webhook

Backend (Next.js API Route)
   ↓ Recebe resposta n8n
   ↓ Se erro: retorna erro para frontend
   ↓ Se sucesso: 
     - Salva order em Firebase com status PENDING
     - Retorna checkoutUrl

Frontend
   ↓ window.open(checkoutUrl)
   ↓ Cliente faz pagamento no Asaas
   ↓ Asaas redireciona para success/cancel/expired callback
```

## Checklist para Testar

- [ ] Backend valida empresa corretamente
- [ ] Backend valida produtos corretamente  
- [ ] Backend valida stock corretamente
- [ ] Backend valida cupom corretamente
- [ ] Backend calcula split corretamente (8% + 92% ou 8% + (92-x)% + x%)
- [ ] Backend converte imagens para base64
- [ ] N8N recebe payload completo
- [ ] N8N transforma payload para Asaas
- [ ] N8N chama Asaas corretamente
- [ ] Asaas retorna checkout id + link
- [ ] N8N valida sucesso
- [ ] N8N retorna resposta correto para backend
- [ ] Backend salva order com status PENDING
- [ ] Frontend abre link de checkout
- [ ] Usuário consegue pagar
- [ ] Callback de sucesso funciona
