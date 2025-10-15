'use client'

import { useCart } from '@/contexts/CartContext'
import { Product } from '@/types'

export function useCartOperations() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartItemsCount, getCartTotal } = useCart()

  const addProductToCart = async (product: Product, quantity: number = 1) => {
    try {
      const success = await addToCart(product, quantity)
      return { success, needsConfirmation: !success }
    } catch (error) {
      console.error('Erro ao adicionar produto ao carrinho:', error)
      return { success: false, needsConfirmation: false, error }
    }
  }

  const removeProductFromCart = (productId: string) => {
    try {
      removeFromCart(productId)
      return { success: true }
    } catch (error) {
      console.error('Erro ao remover produto do carrinho:', error)
      return { success: false, error }
    }
  }

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    try {
      updateQuantity(productId, newQuantity)
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error)
      return { success: false, error }
    }
  }

  const clearCartCompletely = () => {
    try {
      clearCart()
      return { success: true }
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error)
      return { success: false, error }
    }
  }

  const getCartSummary = () => {
    return {
      items: cart.items,
      totalItems: getCartItemsCount(),
      totalPrice: getCartTotal(),
      companyName: cart.companyName,
      companyId: cart.companyId,
      isEmpty: cart.items.length === 0
    }
  }

  const isProductInCart = (productId: string) => {
    return cart.items.some(item => item.product.id === productId)
  }

  const getProductQuantityInCart = (productId: string) => {
    const item = cart.items.find(item => item.product.id === productId)
    return item ? item.quantity : 0
  }

  const canAddProduct = (product: Product) => {
    // Se carrinho vazio, pode adicionar qualquer produto
    if (cart.items.length === 0) return true
    
    // Se já existe produto da mesma empresa, pode adicionar
    return cart.companyId === product.companyOwner
  }

  return {
    cart,
    addProductToCart,
    removeProductFromCart,
    updateProductQuantity,
    clearCartCompletely,
    getCartSummary,
    isProductInCart,
    getProductQuantityInCart,
    canAddProduct
  }
}