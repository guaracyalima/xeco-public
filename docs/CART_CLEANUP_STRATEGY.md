# Sistema de Limpeza de Carrinho - Xeco

## 📋 Resumo Executivo

Este documento explica a estratégia implementada para limpar o carrinho após checkout e acompanhar pagamentos em tempo real.

## 🎯 Estratégia Escolhida: Multi-Camada

### Por que NÃO usar webhook no frontend?

1. **Segurança**: Webhooks do Asaas devem ir direto para backend (N8N)
2. **Confiabilidade**: Frontend pode estar fechado quando webhook chegar
3. **Performance**: Firebase Realtime é mais eficiente que polling

## 🔄 Fluxo Completo

```
┌─────────────┐
│   Usuário   │
│  no Cart    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ 1. Finalizar Compra         │
│    - Criar Order Firebase   │
│    - Chamar N8N Checkout    │
│    - Salvar orderId local   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 2. Redirecionar para Asaas  │
│    (NÃO limpar carrinho)    │
└──────┬──────────────────────┘
       │
       ├───────────┬──────────────┐
       ▼           ▼              ▼
  ┌────────┐  ┌────────┐    ┌─────────┐
  │Paga PIX│  │Boleto  │    │Desiste  │
  └───┬────┘  └───┬────┘    └────┬────┘
      │           │              │
      │           │              ▼
      │           │         Volta ao site
      │           │         /checkout/success
      │           │         LIMPA CARRINHO
      │           │
      ▼           ▼
  ┌──────────────────────────┐
  │ 3. Asaas envia webhook   │
  │    para N8N (backend)    │
  └──────┬───────────────────┘
         │
         ▼
  ┌──────────────────────────┐
  │ 4. N8N atualiza Firebase │
  │    paymentStatus=CONFIRMED│
  │    status=CONFIRMED       │
  │    hasFullStock=true/false│
  └──────┬───────────────────┘
         │
         ▼
  ┌──────────────────────────┐
  │ 5. Firebase Realtime      │
  │    notifica frontend      │
  └──────┬───────────────────┘
         │
         ▼
  ┌──────────────────────────┐
  │ 6. Frontend detecta       │
  │    LIMPA CARRINHO         │
  └───────────────────────────┘
```

## 📁 Arquivos Criados

### 1. `/src/app/checkout/success/page.tsx`

**Função**: Página de retorno após criar checkout

**Comportamento**:
- ✅ Limpa carrinho IMEDIATAMENTE ao entrar
- ✅ Remove `pendingOrderId` do localStorage
- ✅ Countdown de 5s
- ✅ Redireciona para `/perfil?tab=pedidos`

**Quando usar**:
- Redirecionar usuário para `window.location.href = '/checkout/success?orderId=' + orderId` após criar checkout

### 2. `/src/app/pedido/[orderId]/status/page.tsx`

**Função**: Acompanhamento em tempo real do status do pagamento

**Comportamento**:
- 🔥 **Firebase Realtime Listener** - escuta mudanças na order
- ✅ Limpa carrinho quando `paymentStatus === 'CONFIRMED'`
- 📊 Mostra status visual (pendente, confirmado, sem estoque, etc.)
- 🔄 Auto-atualiza sem refresh

**Quando usar**:
- Opcional: Redirecionar para `/pedido/[orderId]/status` se quiser acompanhamento real-time

## 🛠️ Implementação no Checkout

### Atualizar CheckoutForm.tsx

```typescript
// src/components/checkout/CheckoutForm.tsx

const handleCheckout = async () => {
  try {
    setProcessing(true)

    // 1. Criar order no Firebase
    const order = await OrderService.createOrder({
      customerId: user.uid,
      customerName: user.displayName || '',
      customerEmail: user.email || '',
      customerPhone: formData.phone,
      items: cart.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.imagesUrl?.[0],
        quantity: item.quantity,
        unitPrice: parseFloat(item.product.salePrice),
        totalPrice: item.total,
        companyId: item.product.companyOwner
      })),
      totalAmount: cart.totalAmount,
      description: `Pedido de ${cart.items.length} produtos`,
      status: 'CREATED',
      channel: 'WEB',
      type: 'PRODUCT'
    })

    console.log('✅ Order criada:', order.id)

    // 2. Criar checkout no Asaas via N8N
    const checkoutResponse = await CheckoutService.createCheckout(
      order,
      companyData,
      {
        id: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        address: formData.address
      },
      affiliateData
    )

    console.log('✅ Checkout criado:', checkoutResponse.checkoutUrl)

    // 3. Salvar orderId no localStorage para limpar carrinho depois
    localStorage.setItem('pendingOrderId', order.id)

    // 4. Redirecionar para página de sucesso (que limpa carrinho)
    window.location.href = `/checkout/success?orderId=${order.id}`

    // OU redirecionar direto para Asaas (e limpar na volta)
    // window.location.href = checkoutResponse.checkoutUrl

  } catch (error) {
    console.error('❌ Erro no checkout:', error)
    setError(error.message)
  } finally {
    setProcessing(false)
  }
}
```

## 🎨 Opções de UX

### Opção A: Redirecionar para Página de Sucesso (RECOMENDADO)

```typescript
// Após criar checkout
window.location.href = `/checkout/success?orderId=${order.id}`
```

**Vantagens**:
- ✅ Feedback visual imediato
- ✅ Limpa carrinho na hora
- ✅ Usuário sabe que funcionou
- ✅ Pode adicionar countdown/animação

### Opção B: Redirecionar Direto para Asaas

```typescript
// Após criar checkout
window.location.href = checkoutResponse.checkoutUrl
```

**Vantagens**:
- ✅ Mais rápido (menos clicks)
- ✅ Carrinho limpo ao voltar

**Desvantagens**:
- ⚠️ Sem feedback se deu certo
- ⚠️ Usuário pode se confundir

### Opção C: Modal + Countdown

```typescript
// Mostrar modal
showSuccessModal({
  title: 'Pedido Criado!',
  message: 'Redirecionando para pagamento...',
  countdown: 3
})

// Após 3s
window.location.href = checkoutResponse.checkoutUrl
```

## 📊 Monitoramento em Tempo Real

### Como Funciona

1. **Firebase Realtime Listener**:
```typescript
onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
  const order = docSnap.data()
  
  if (order.paymentStatus === 'CONFIRMED') {
    clearCart() // 🧹 Limpar carrinho
    showSuccessNotification()
  }
})
```

2. **Webhook N8N → Firebase**:
```javascript
// Node 14 do workflow
{
  paymentStatus: 'CONFIRMED',
  status: 'CONFIRMED',
  paymentConfirmedAt: new Date().toISOString()
}
```

3. **Frontend Detecta**:
```typescript
// Página /pedido/[orderId]/status
useEffect(() => {
  // Listener detecta mudança
  // Limpa carrinho automaticamente
}, [])
```

## 🔒 Segurança e Idempotência

### Prevenir Limpeza Duplicada

```typescript
const clearCart = async () => {
  const alreadyCleared = localStorage.getItem('cart_cleared_' + orderId)
  
  if (alreadyCleared) {
    console.log('⚠️ Carrinho já foi limpo anteriormente')
    return
  }
  
  // Limpar carrinho
  await clearCartFromFirebase()
  localStorage.setItem('cart_cleared_' + orderId, 'true')
}
```

### Prevenir Processamento Duplicado (N8N)

Já implementado no workflow node 4:
```javascript
if (order.paymentStatus === 'CONFIRMED' && order.status === 'CONFIRMED') {
  return { alreadyProcessed: true }
}
```

## 📱 Casos de Uso

### Caso 1: Usuário Paga PIX Imediatamente

1. Finaliza compra → `/checkout/success`
2. Carrinho limpo ✅
3. Vê "Aguardando pagamento"
4. Paga PIX
5. Asaas → Webhook → N8N → Firebase
6. Página atualiza para "Confirmado" ✅

### Caso 2: Usuário Gera Boleto

1. Finaliza compra → `/checkout/success`
2. Carrinho limpo ✅
3. Vê "Aguardando pagamento"
4. Volta em 2 dias
5. Acessa `/pedido/[orderId]/status`
6. Vê status atualizado

### Caso 3: Usuário Desiste

1. Finaliza compra → `/checkout/success`
2. Carrinho limpo ✅
3. Fecha página
4. Order fica `PENDING_PAYMENT`
5. Pode recomprar normalmente

## ⚡ Performance

### Firebase Realtime vs Polling

**Realtime (Implementado)**:
- ✅ Atualização instantânea
- ✅ Baixo custo (só escuta mudanças)
- ✅ Não sobrecarrega servidor

**Polling (NÃO usar)**:
- ❌ Delay de 5-10s
- ❌ Alto custo (requests constantes)
- ❌ Pode sobrecarregar Firebase

## 🎯 Conclusão

### ✅ O que foi implementado

1. **Página de Sucesso** (`/checkout/success`)
   - Limpa carrinho imediatamente
   - Feedback visual
   - Redirect automático

2. **Página de Status** (`/pedido/[orderId]/status`)
   - Monitoramento em tempo real
   - Limpa carrinho quando confirmar pagamento
   - UI responsiva com status visual

3. **Tipos Atualizados** (`order.ts`)
   - Novos status: `CONFIRMED`, `PARTIAL_STOCK`
   - Novos campos do webhook Asaas

### ❌ O que NÃO fazer

- ❌ Criar webhook no frontend
- ❌ Limpar carrinho antes de redirecionar
- ❌ Usar polling ao invés de Realtime
- ❌ Confiar em localStorage sem validação

### 🚀 Próximos Passos

1. Testar fluxo completo:
   - Criar checkout
   - Pagar PIX sandbox
   - Verificar se carrinho limpa

2. Adicionar notificações:
   - Toast quando pagamento confirmar
   - Email de confirmação

3. Melhorar UX:
   - Animações de transição
   - Skeleton loading
   - Erro handling robusto

## 📚 Referências

- Workflow N8N: `/workflows/webhook-confirm-payment-FINAL.json`
- Tipos: `/src/types/order.ts`
- Cart Context: `/src/contexts/CartContext.tsx`
- Checkout Service: `/src/services/checkoutService.ts`
