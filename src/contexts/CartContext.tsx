'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { Product, Cart, CartItem, CartDiscount } from '@/types'
import { CheckoutUserData } from '@/types/order'
import { OrderService } from '@/services/orderService'
import { CheckoutService } from '@/services/checkoutService'
import { useAuth } from '@/context/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface CartContextType {
  cart: Cart
  addToCart: (product: Product, quantity: number) => Promise<boolean>
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartItemsCount: () => number
  getCartTotal: () => number
  startCheckout: (userData: CheckoutUserData, discount?: CartDiscount | null) => Promise<string> // Retorna URL do checkout
}

const CartContext = createContext<CartContextType | undefined>(undefined)

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_COMPANY'; payload: { companyId: string; companyName: string } }
  | { type: 'LOAD_CART'; payload: Cart }

const CART_STORAGE_KEY = 'xeco-cart'

const initialCart: Cart = {
  items: [],
  companyId: null,
  companyName: null,
  totalItems: 0,
  totalPrice: 0
}

// Função para salvar carrinho no localStorage
const saveCartToStorage = (cart: Cart) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
      console.log('💾 Carrinho salvo no localStorage:', cart.totalItems, 'itens')
    }
  } catch (error) {
    console.error('❌ Erro ao salvar carrinho no localStorage:', error)
  }
}

// Função para carregar carrinho do localStorage
const loadCartFromStorage = (): Cart => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsedCart = JSON.parse(stored)
        console.log('📦 Carrinho carregado do localStorage:', parsedCart.totalItems, 'itens')
        return parsedCart
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar carrinho do localStorage:', error)
  }
  return initialCart
}

function cartReducer(state: Cart, action: CartAction): Cart {
  let newState: Cart
  
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload

    case 'ADD_ITEM': {
      const { product, quantity } = action.payload
      const existingItemIndex = state.items.findIndex(item => item.product.id === product.id)
      
      let newItems: CartItem[]
      
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.product.salePrice
              }
            : item
        )
      } else {
        // Add new item
        const newItem: CartItem = {
          product,
          quantity,
          total: quantity * product.salePrice
        }
        newItems = [...state.items, newItem]
      }

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + item.total, 0)

      newState = {
        ...state,
        items: newItems,
        companyId: product.companyOwner,
        companyName: product.companyOwnerName || null,
        totalItems,
        totalPrice
      }
      
      saveCartToStorage(newState)
      return newState
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product.id !== action.payload.productId)
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + item.total, 0)

      newState = {
        ...state,
        items: newItems,
        companyId: newItems.length > 0 ? state.companyId : null,
        companyName: newItems.length > 0 ? state.companyName : null,
        totalItems,
        totalPrice
      }
      
      saveCartToStorage(newState)
      return newState
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId } })
      }

      const newItems = state.items.map(item =>
        item.product.id === productId
          ? { 
              ...item, 
              quantity,
              total: quantity * item.product.salePrice
            }
          : item
      )

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = newItems.reduce((sum, item) => sum + item.total, 0)

      newState = {
        ...state,
        items: newItems,
        totalItems,
        totalPrice
      }
      
      saveCartToStorage(newState)
      return newState
    }

    case 'CLEAR_CART':
      saveCartToStorage(initialCart)
      return initialCart

    case 'SET_COMPANY':
      newState = {
        ...state,
        companyId: action.payload.companyId,
        companyName: action.payload.companyName
      }
      
      saveCartToStorage(newState)
      return newState

    default:
      return state
  }
}

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart)
  const { firebaseUser } = useAuth() // Usar firebaseUser que tem uid e displayName

  // Carregar carrinho do localStorage quando o componente é montado
  useEffect(() => {
    const savedCart = loadCartFromStorage()
    if (savedCart.totalItems > 0) {
      dispatch({ type: 'LOAD_CART', payload: savedCart })
    }
  }, [])

  const addToCart = async (product: Product, quantity: number): Promise<boolean> => {
    console.log('🛒 CartContext: Tentando adicionar produto:', { nome: product.name, quantidade: quantity })
    console.log('🏢 CartContext: Estado atual do carrinho:', { companyId: cart.companyId, totalItems: cart.totalItems })
    
    // Check if trying to add product from different company
    if (cart.companyId && cart.companyId !== product.companyOwner) {
      console.log('❌ CartContext: Conflito de empresa detectado')
      return false // Will trigger company conflict modal
    }

    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
    console.log('✅ CartContext: Produto adicionado com sucesso!')
    return true
  }

  const removeFromCart = (productId: string) => {
    console.log('🗑️ Removendo produto do carrinho:', productId)
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    console.log('🔄 Atualizando quantidade:', { productId, quantity })
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    console.log('🧹 Limpando carrinho completo')
    dispatch({ type: 'CLEAR_CART' })
  }

  const getCartItemsCount = () => {
    console.log('📊 getCartItemsCount chamado:', cart.totalItems)
    return cart.totalItems
  }

  const getCartTotal = () => cart.totalPrice

  // Função para iniciar processo de checkout
  const startCheckout = async (userData: CheckoutUserData, discount?: CartDiscount | null): Promise<string> => {
    
    if (!firebaseUser) {
      throw new Error('Usuário não autenticado')
    }

    if (cart.items.length === 0) {
      throw new Error('Carrinho vazio')
    }

    // Valida se todos os produtos são da mesma empresa
    const companies = [...new Set(cart.items.map(item => item.product.companyOwner))]
    if (companies.length > 1) {
      throw new Error('Produtos de empresas diferentes no carrinho')
    }

    const companyId = companies[0]

    try {
      // Busca dados da empresa
      const companyDoc = await getDoc(doc(db, 'companies', companyId))
      if (!companyDoc.exists()) {
        throw new Error('Empresa não encontrada')
      }
      
      const companyData = { id: companyDoc.id, ...companyDoc.data() }

      // Busca dados completos do usuário
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      const userProfileData = userDoc.exists() ? userDoc.data() : {}

      // Cria a order
      const order = await OrderService.createOrder(
        cart.items,
        firebaseUser.uid,
        firebaseUser.email || '',
        userProfileData.name || firebaseUser.displayName || '',
        userProfileData.phone || '',
        companyId,
        (companyData as any).owner || ''
      )

      // Prepara dados do usuário para o checkout
      const checkoutUserData = {
        id: firebaseUser.uid,
        name: userProfileData.name || firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        phone: userProfileData.phone || '',
        cpf: userData.cpf
      }

      // Prepara dados do afiliado se houver cupom de afiliado
      let affiliateData = undefined
      if (discount?.affiliate) {
        affiliateData = {
          walletId: discount.affiliate.walletId || '',
          commissionPercentage: discount.affiliate.commissionRate || 0
        }
        console.log('🎯 Dados do afiliado para split:', affiliateData)
      }

      // Chama serviço de checkout
      const checkoutResponse = await CheckoutService.createCheckout(
        order,
        companyData,
        checkoutUserData,
        affiliateData
      )

      // NÃO limpar o carrinho automaticamente aqui!
      // O carrinho só deve ser limpo quando o pagamento for confirmado
      // Para isso, será necessário implementar um webhook de confirmação de pagamento

      return checkoutResponse.checkoutUrl

    } catch (error) {
      console.error('❌ Erro no checkout:', error)
      throw error
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItemsCount,
        getCartTotal,
        startCheckout
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}