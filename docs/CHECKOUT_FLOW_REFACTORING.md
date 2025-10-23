# 🔄 Refactoring do Fluxo de Checkout

## Problema Atual

Atualmente a Order é criada **APENAS NO FINAL** do checkout, quando usuário clica "Confirmar Pedido".

**Fluxo problemático:**
```
AddToCart → LocalStorage → /carrinho → Click "Confirmar" → OrderService.createOrder() ← ⚠️ AQUI!
```

## Solução: Order Imediata (Draft)

Criar a Order **IMEDIATAMENTE** quando o usuário adiciona o primeiro produto ao carrinho.

**Novo fluxo:**
```
AddToCart → OrderService.createOrder() ← ✅ AQUI! (DRAFT status)
        → LocalStorage + Firestore sincronizados
        → /carrinho (ordem já existe, pode editar)
        → Click "Confirmar" → OrderService.updateOrderStatus(PENDING) ← atualiza
        → n8n checkout
```

## Mudanças Necessárias

### 1. CartContext.tsx - addToCart()

**Antes:**
```typescript
const addToCart = async (product: Product, quantity: number): Promise<boolean> => {
  // ... apenas adiciona ao localStorage
  dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
  return true
}
```

**Depois:**
```typescript
const addToCart = async (product: Product, quantity: number): Promise<boolean> => {
  // Se é o PRIMEIRO item, cria Order no Firestore
  if (cart.items.length === 0) {
    try {
      const newOrder = await OrderService.createOrder(
        [{ product, quantity, total: product.salePrice * quantity }],
        firebaseUser.uid,
        firebaseUser.email,
        userProfile.name,
        userProfile.phone,
        product.companyOwner,
        companyData.owner
      )
      // Armazena orderId no localStorage/context
      dispatch({ type: 'SET_ORDER_ID', payload: { orderId: newOrder.id } })
    } catch (error) {
      console.error('❌ Erro ao criar order:', error)
      return false
    }
  } else {
    // Se já existe order, atualiza itens
    try {
      await OrderService.updateOrderItems(orderId, [...cart.items, { product, quantity }])
    } catch (error) {
      console.error('❌ Erro ao atualizar items:', error)
      return false
    }
  }
  
  // Adiciona ao localStorage
  dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
  return true
}
```

### 2. OrderService.ts - Novo método updateOrderItems()

```typescript
static async updateOrderItems(orderId: string, items: CartItem[]): Promise<void> {
  const orderItems = items.map(item => ({
    id: item.product.id,
    productId: item.product.id,
    productName: item.product.name,
    quantity: item.quantity,
    unitPrice: item.product.salePrice,
    totalPrice: item.quantity * item.product.salePrice,
    productImage: item.product.imagesUrl[0]
  }))
  
  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
  
  await updateDoc(doc(db, 'orders', orderId), {
    items: orderItems,
    totalAmount,
    updatedAt: serverTimestamp()
  })
}
```

### 3. Carrinho - Integração

Ao **remover item**, se ficar vazio:
```typescript
const removeFromCart = async (productId: string) => {
  dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
  
  // Se carrinho ficou vazio, cancela order
  if (newCart.items.length === 0) {
    await OrderService.updateOrderStatus(orderId, 'CANCELLED')
    dispatch({ type: 'CLEAR_ORDER_ID' })
  } else {
    await OrderService.updateOrderItems(orderId, newCart.items)
  }
}
```

## Benefícios

✅ **User Experience:**
- Order existe imediatamente no sistema
- Pode editar carrinho e ver mudanças em tempo real
- Menos cliques para finalizar

✅ **Backend:**
- Rastreamento completo de quando pedido foi criado
- Histórico de modificações
- Melhor para analytics e fraud detection

✅ **Escalabilidade:**
- Suporta reserva de estoque (quando implementar)
- Notificações em tempo real
- Sincronização mais fácil entre cliente/servidor

## Status

- [ ] Adicionar orderId ao Cart context
- [ ] Implementar createOrder no addToCart
- [ ] Implementar updateOrderItems
- [ ] Atualizar removeFromCart
- [ ] Testar fluxo completo
- [ ] Remover createOrder da finalização (apenas update status)
