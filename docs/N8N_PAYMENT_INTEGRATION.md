# Integração de Pagamento com n8n - Documentação

## Visão Geral

Esta documentação descreve a implementação da integração de pagamento com o webhook n8n para o sistema Xeco.

## Arquivos Criados/Modificados

### 1. Configurações

#### `src/lib/config.ts`
Configurações globais da aplicação incluindo:
- Detecção automática de ambiente (development/production)
- URLs base parametrizáveis
- Callbacks de checkout (success, cancel, expired)

```typescript
// Exemplo de uso
import { APP_BASE_URL, CHECKOUT_CALLBACKS } from '@/lib/config'
```

#### `src/lib/n8n-config.ts`
Configurações específicas do n8n:
- Endpoints parametrizáveis via variável de ambiente
- Tipos TypeScript para requisições e respostas
- Type guards para validação de respostas
- Tratamento de erros

### 2. Serviços

#### `src/services/checkoutService-new.ts`
Novo serviço principal de checkout com:
- Função `createPaymentCheckout()` - cria pagamento via n8n
- Conversão automática de imagens para base64 (CRÍTICO)
- Cálculo de splits de pagamento (plataforma + afiliados)
- Tratamento robusto de erros
- Logs detalhados para debug

**Estrutura da Requisição enviada ao n8n:**

```typescript
{
  billingTypes: ["CREDIT_CARD", "PIX"],
  chargeTypes: ["DETACHED", "INSTALLMENT"],
  minutesToExpire: 15,
  externalReference: "uuid-da-ordem",
  callback: {
    successUrl: "https://xeco.com.br/checkout/success",
    cancelUrl: "https://xeco.com.br/checkout/cancel",
    expiredUrl: "https://xeco.com.br/checkout/expired"
  },
  items: [
    {
      externalReference: "product-id",
      description: "Descrição do produto",
      imageBase64: "base64-encoded-image",
      name: "Nome do Produto",
      quantity: 2,
      value: 100
    }
  ],
  customerData: {
    name: "Nome do Cliente",
    cpfCnpj: "12345678900",
    email: "cliente@email.com",
    phone: "11999999999",
    address: "Rua Exemplo",
    addressNumber: "123",
    complement: "Apto 45",
    province: "Centro",
    postalCode: "01310000",
    city: "São Paulo"
  },
  installment: {
    maxInstallmentCount: 1
  },
  splits: [
    {
      walletId: "wallet-id-afiliado",
      percentageValue: 10
    }
  ],
  companyId: "company-id",
  companyOrder: "Nome da Empresa",
  userId: "user-id",
  productList: [
    {
      productId: "product-id",
      quantity: 2
    }
  ]
}
```

**Resposta de Sucesso:**

```typescript
{
  id: "checkout-id",
  link: "https://checkout-link.com",
  status: "ACTIVE",
  // ... outros campos
}
```

**Resposta de Erro:**

```typescript
{
  errors: [
    {
      code: "ERROR_CODE",
      description: "Descrição do erro"
    }
  ]
}
```

#### `src/services/checkoutService.ts` (Atualizado)
Adaptador que conecta o fluxo antigo com o novo serviço:
- Mantém compatibilidade com código existente
- Converte Order para CartItem
- Delega para `checkoutService-new.ts`

### 3. Contextos

#### `src/contexts/CartContext.tsx` (Atualizado)
- Agora passa dados de endereço completo para o checkout
- Mantém compatibilidade com fluxo existente

## Variáveis de Ambiente

Adicione ao seu arquivo `.env.local`:

```bash
# n8n Webhook URL
NEXT_PUBLIC_N8N_URL=https://primary-production-9acc.up.railway.app
```

Para desenvolvimento local:
```bash
NEXT_PUBLIC_N8N_URL=http://localhost:5678
```

## Pontos Importantes

### 1. Conversão de Imagens para Base64
**CRÍTICO**: Todas as imagens dos produtos DEVEM ser convertidas para base64 antes de enviar ao n8n. Isso é feito automaticamente pelo serviço usando `imageUrlToBase64()`.

```typescript
// Conversão automática
const imageBase64 = await imageUrlToBase64(product.imagesUrl[0])
```

### 2. Domínio Parametrizável
O domínio é configurado automaticamente baseado no ambiente:
- **Development**: `http://localhost:3000`
- **Production**: `https://xeco.com.br`

Para mudar o domínio de produção, edite `src/lib/config.ts`.

### 3. CompanyId e UserId
- **companyId**: Vem do campo `product.companyOwner`
- **userId**: É o ID do usuário logado (Firebase UID)

### 4. Split de Pagamento
O sistema calcula automaticamente:
- Taxa da plataforma (8%)
- Comissão do afiliado (se houver)
- Valor da loja (restante)

### 5. Tratamento de Erros
O sistema captura e formata erros de forma user-friendly:
- Erros de rede
- Erros de validação
- Erros do servidor de pagamento
- Respostas inesperadas

## Fluxo de Checkout

1. **Usuário clica em "Finalizar Compra"**
   - Verifica autenticação
   - Valida carrinho
   - Abre modal de checkout

2. **Usuário preenche dados**
   - CPF
   - Endereço completo

3. **Sistema processa**
   - Cria Order no Firebase
   - Converte imagens para base64
   - Calcula splits
   - Envia requisição para n8n

4. **n8n responde**
   - **Sucesso**: Retorna link de pagamento
   - **Erro**: Retorna lista de erros

5. **Usuário é redirecionado**
   - Para o link de pagamento (sucesso)
   - Vê mensagem de erro (falha)

## Testes

### Testar em Development

1. Configure a variável de ambiente:
```bash
NEXT_PUBLIC_N8N_URL=http://localhost:5678
```

2. Execute o n8n localmente

3. Faça um checkout de teste

### Testar em Production

1. Use a URL de produção:
```bash
NEXT_PUBLIC_N8N_URL=https://primary-production-9acc.up.railway.app
```

2. Faça um checkout real

## Logs e Debug

O sistema gera logs detalhados em cada etapa:
- 🚀 Início do processo
- 📦 Processamento de itens
- 💰 Cálculo de splits
- 📤 Envio para n8n
- 📥 Resposta recebida
- ✅ Sucesso
- ❌ Erros

Verifique o console do navegador para acompanhar o fluxo.

## Próximos Passos

1. **Webhooks de Confirmação**: Implementar endpoint para receber confirmação de pagamento do Asaas via n8n
2. **Limpar Carrinho**: Só limpar após confirmação de pagamento
3. **Notificações**: Email/SMS de confirmação
4. **Rastreamento**: Integrar com sistema de pedidos

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console
2. Valide as variáveis de ambiente
3. Confirme que o n8n está respondendo
4. Verifique se as imagens estão sendo convertidas para base64
