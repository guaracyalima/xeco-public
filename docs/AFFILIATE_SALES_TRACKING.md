# Sistema de Rastreamento de Vendas de Afiliados

## Visão Geral

Este documento descreve o sistema completo de rastreamento de vendas de afiliados implementado no Xeco Public. O sistema permite que as vendas realizadas através de cupons de afiliados sejam automaticamente rastreadas e as comissões calculadas.

## Funcionalidades Principais

### 1. Criação Automática de Registros de Venda
- Quando um cliente usa um cupom de afiliado no checkout, o sistema automaticamente cria um registro `AffiliateSale`
- O registro inclui todas as informações necessárias para calcular e pagar comissões

### 2. Cálculo de Comissões
- Comissões são calculadas automaticamente baseadas na taxa de comissão do afiliado
- Suporte para diferentes taxas de comissão por afiliado

### 3. Status de Acompanhamento
- Status da venda: `PENDING`, `CONFIRMED`, `CANCELLED`
- Status do pagamento: `PENDING`, `PAID`, `CANCELLED`

## Estrutura de Dados

### AffiliateSale Interface

```typescript
export interface AffiliateSale {
  id: string
  affiliateId: string           // ID do afiliado
  storeId: string              // ID da empresa/loja
  orderId: string              // ID do pedido no sistema de pagamento
  customerEmail: string        // Email do cliente
  orderValue: number           // Valor total do pedido
  commissionValue: number      // Valor da comissão calculada
  commissionRate: number       // Taxa de comissão (0-1)
  couponUsed: string          // Código do cupom utilizado
  clickId?: string            // ID do click (para tracking futuro)
  saleDate: Date              // Data da venda
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED'
  createdAt: Date
}
```

## Implementação Técnica

### 1. Serviço de Vendas de Afiliados (`affiliate-sales-service.ts`)

#### Funções Principais:

##### `createAffiliateSale()`
```typescript
const createAffiliateSale = async (
  affiliate: Affiliated,
  orderId: string,
  customerEmail: string,
  orderValue: number,
  couponCode: string,
  clickId?: string
): Promise<{ success: boolean; saleId?: string; error?: string }>
```

**Parâmetros:**
- `affiliate`: Objeto completo do afiliado com informações de comissão
- `orderId`: ID do pedido (inicialmente vazio, atualizado após pagamento)
- `customerEmail`: Email do cliente que fez a compra
- `orderValue`: Valor total do pedido
- `couponCode`: Código do cupom utilizado
- `clickId`: (Opcional) ID do click para tracking

**Funcionalidade:**
- Calcula automaticamente o valor da comissão
- Cria registro na collection `affiliate_sales`
- Retorna ID do registro criado

##### `updateAffiliateSaleStatus()`
```typescript
const updateAffiliateSaleStatus = async (
  saleId: string,
  status: AffiliateSale['status'],
  paymentStatus?: AffiliateSale['paymentStatus'],
  orderId?: string
): Promise<{ success: boolean; error?: string }>
```

**Funcionalidade:**
- Atualiza status da venda
- Atualiza status do pagamento
- Permite associar ID do pedido após criação no gateway de pagamento

##### `calculateCommission()`
```typescript
const calculateCommission = (
  orderValue: number,
  commissionRate: number
): number
```

**Funcionalidade:**
- Calcula valor da comissão baseado no valor do pedido e taxa
- Retorna valor com 2 casas decimais

### 2. Integração com Checkout (`CheckoutButton.tsx`)

#### Fluxo de Integração:

1. **Verificação de Desconto de Afiliado:**
   ```typescript
   if (discount?.affiliate) {
     // Tem cupom de afiliado ativo
   }
   ```

2. **Criação do Registro de Venda:**
   ```typescript
   await createAffiliateSale(
     discount.affiliate,
     '', // orderId será atualizado após pagamento
     firebaseUser?.email || '',
     subtotalAmount,
     discount.coupon.code
   );
   ```

3. **Tratamento de Erros:**
   - Erros no tracking não bloqueiam o checkout
   - Logs de erro são registrados para debug

### 3. Tipos de Dados

#### CartDiscount (atualizado)
```typescript
export interface CartDiscount {
  coupon: Coupon
  affiliate?: Affiliated        // Informações do afiliado (se aplicável)
  discountAmount: number
  originalTotal: number
  finalTotal: number
}
```

## Fluxo Completo de Venda com Afiliado

### 1. Cliente Aplica Cupom
1. Cliente insere código do cupom no carrinho
2. `CouponField` valida o cupom
3. Se é cupom de afiliado, busca informações do afiliado
4. Cria objeto `CartDiscount` com dados do afiliado

### 2. Checkout
1. `CheckoutButton` recebe o `discount` com informações do afiliado
2. Cliente confirma dados e inicia pagamento
3. Sistema cria registro `AffiliateSale` automaticamente
4. Checkout prossegue normalmente

### 3. Pós-Pagamento (Futuro)
1. Webhook do gateway de pagamento confirma pagamento
2. Status da venda é atualizado para `CONFIRMED`
3. `orderId` é associado ao registro
4. Comissão fica disponível para pagamento

## Benefícios do Sistema

### 1. Rastreamento Completo
- Todas as vendas de afiliados são automaticamente rastreadas
- Histórico completo de vendas por afiliado
- Dados detalhados para relatórios

### 2. Cálculo Automático de Comissões
- Comissões calculadas automaticamente
- Suporte para taxas diferentes por afiliado
- Precisão nos cálculos

### 3. Auditoria e Transparência
- Registros detalhados de cada venda
- Associação clara entre cupom, afiliado e venda
- Status de pagamento transparente

### 4. Escalabilidade
- Sistema preparado para crescimento
- Fácil integração com sistemas de pagamento
- Estrutura flexível para novos recursos

## Próximos Passos

### 1. Integração com Webhooks
- Implementar webhooks do Asaas para atualizar status
- Automatizar confirmação de pagamentos

### 2. Dashboard de Afiliados
- Interface para afiliados visualizarem suas vendas
- Relatórios de comissões
- Histórico de pagamentos

### 3. Sistema de Pagamento de Comissões
- Automação de pagamentos de comissões
- Integração com PIX/transferências
- Relatórios financeiros

### 4. Analytics Avançado
- Métricas de performance de afiliados
- Análise de conversão por cupom
- ROI de programa de afiliados

## Monitoramento e Debug

### Logs Importantes
- Criação de vendas de afiliado
- Erros no tracking (não bloqueiam checkout)
- Atualizações de status

### Métricas para Acompanhar
- Número de vendas por afiliado
- Valor total de comissões geradas
- Taxa de conversão de cupons
- Tempo médio entre venda e confirmação

## Considerações de Segurança

### 1. Validação de Dados
- Validação rigorosa de dados de entrada
- Verificação de existência do afiliado
- Validação de valores de comissão

### 2. Integridade dos Dados
- Uso de transações do Firestore quando necessário
- Logs de auditoria para alterações
- Backup automático de dados críticos

### 3. Prevenção de Fraudes
- Validação de cupons únicos
- Rastreamento de IP/dispositivo (futuro)
- Análise de padrões suspeitos

Esta implementação fornece uma base sólida para o programa de afiliados do Xeco, permitindo rastreamento preciso e cálculo automático de comissões.