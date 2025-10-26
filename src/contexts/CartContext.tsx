'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { Product, Cart, CartItem, CartDiscount } from '@/types'
import { CheckoutUserData } from '@/types/order'
import { OrderService } from '@/services/orderService'
import { CheckoutService } from '@/services/checkoutService'
import { useAuth } from '@/context/AuthContext'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface CartContextType {
  cart: Cart & { orderId?: string }
  addToCart: (product: Product, quantity: number) => Promise<boolean>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
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
  | { type: 'SET_ORDER_ID'; payload: { orderId: string } }
  | { type: 'CLEAR_ORDER_ID' }

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

    case 'SET_ORDER_ID':
      newState = {
        ...state,
        orderId: action.payload.orderId
      } as any
      
      saveCartToStorage(newState)
      return newState

    case 'CLEAR_ORDER_ID':
      const { orderId: _orderId, ...stateWithoutOrderId } = state as any
      saveCartToStorage(stateWithoutOrderId)
      return stateWithoutOrderId

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

  // 🔍 Verificar se há orders pagas/canceladas e limpar carrinho
  useEffect(() => {
    const checkPendingOrders = async () => {
      if (!firebaseUser) return

      try {
        const savedCart = loadCartFromStorage()
        const orderId = (savedCart as any).orderId

        // Se tem um orderId no carrinho, verificar status
        if (orderId) {
          console.log('🔍 Verificando status da order:', orderId)
          
          const order = await OrderService.getOrder(orderId)
          
          if (order) {
            const shouldClearCart = 
              order.paymentStatus === 'CONFIRMED' || 
              order.paymentStatus === 'PAID' ||
              order.status === 'CONFIRMED' ||
              order.status === 'PAID' ||
              order.status === 'CANCELLED' ||
              order.status === 'EXPIRED'

            if (shouldClearCart) {
              console.log('🧹 Order já foi processada/cancelada. Limpando carrinho...', {
                paymentStatus: order.paymentStatus,
                status: order.status
              })
              
              // Limpar carrinho
              localStorage.removeItem(CART_STORAGE_KEY)
              dispatch({ type: 'CLEAR_CART' })
              return // Não carregar carrinho antigo
            }
          }
        }

        // Se passou nas verificações, carregar carrinho normal
        if (savedCart.totalItems > 0) {
          dispatch({ type: 'LOAD_CART', payload: savedCart })
        }

      } catch (error) {
        console.error('❌ Erro ao verificar orders pendentes:', error)
        // Em caso de erro, carrega carrinho normalmente
        const savedCart = loadCartFromStorage()
        if (savedCart.totalItems > 0) {
          dispatch({ type: 'LOAD_CART', payload: savedCart })
        }
      }
    }

    checkPendingOrders()
  }, [firebaseUser])

  const addToCart = async (product: Product, quantity: number): Promise<boolean> => {
    console.log('🛒 CartContext: Tentando adicionar produto:', { nome: product.name, quantidade: quantity })
    console.log('🏢 CartContext: Estado atual do carrinho:', { companyId: cart.companyId, totalItems: cart.totalItems })
    
    // Check if trying to add product from different company
    if (cart.companyId && cart.companyId !== product.companyOwner) {
      console.log('❌ CartContext: Conflito de empresa detectado')
      return false // Will trigger company conflict modal
    }

    try {
      const cartWithNewItem: Cart & { orderId?: string } = {
        ...cart,
        items: [...cart.items, { product, quantity, total: product.salePrice * quantity }]
      }

      // Se é PRIMEIRO item, cria Order no Firestore
      if (cart.items.length === 0 && firebaseUser) {
        console.log('📝 Criando nova Order (primeiro item)...')
        
        // Busca dados da empresa
        const companyDoc = await getDoc(doc(db, 'companies', product.companyOwner))
        if (!companyDoc.exists()) {
          throw new Error('Empresa não encontrada')
        }
        
        const companyData = { id: companyDoc.id, ...companyDoc.data() }

        // Busca dados completos do usuário
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const userProfileData = userDoc.exists() ? userDoc.data() : {}

        // Cria a order
        const newOrder = await OrderService.createOrder(
          [{ product, quantity, total: product.salePrice * quantity }],
          firebaseUser.uid,
          firebaseUser.email || '',
          userProfileData.name || firebaseUser.displayName || '',
          userProfileData.phone || '',
          product.companyOwner,
          (companyData as any).owner || ''
        )

        console.log('✅ Order criada com sucesso:', newOrder.id)
        dispatch({ type: 'SET_ORDER_ID', payload: { orderId: newOrder.id } })
      } else if (cart.items.length > 0 && (cart as any).orderId) {
        // Se já existe order, atualiza items
        console.log('🔄 Atualizando items na Order existente:', (cart as any).orderId)
        const newCartItems: CartItem[] = [
          ...cart.items,
          { product, quantity, total: product.salePrice * quantity }
        ]
        await OrderService.updateOrderItems((cart as any).orderId, newCartItems)
      }

      dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
      console.log('✅ CartContext: Produto adicionado com sucesso!')
      return true
    } catch (error) {
      console.error('❌ Erro ao adicionar produto:', error)
      return false
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      console.log('🗑️ Removendo produto do carrinho:', productId)
      
      // Remove do estado local
      dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
      
      // Se existe order, atualiza ou cancela
      const orderId = (cart as any).orderId
      if (orderId) {
        // Filtra os items que vão ficar
        const remainingItems = cart.items.filter(item => item.product.id !== productId)
        
        if (remainingItems.length === 0) {
          // Se carrinho ficou vazio, cancela order
          console.log('❌ Cancelando order (carrinho vazio):', orderId)
          await OrderService.updateOrderStatus(orderId, 'CANCELLED')
          dispatch({ type: 'CLEAR_ORDER_ID' })
        } else {
          // Se ainda tem items, atualiza order
          console.log('🔄 Atualizando items da order:', orderId)
          await OrderService.updateOrderItems(orderId, remainingItems)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao remover produto:', error)
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      console.log('🔄 Atualizando quantidade:', { productId, quantity })
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })

      // Se existe order, atualiza items
      const orderId = (cart as any).orderId
      if (orderId) {
        const updatedItems = cart.items.map(item =>
          item.product.id === productId
            ? { ...item, quantity, total: quantity * item.product.salePrice }
            : item
        )
        
        if (quantity <= 0) {
          // Remover item se quantidade <= 0
          const remainingItems = updatedItems.filter(item => item.product.id !== productId)
          if (remainingItems.length === 0) {
            await OrderService.updateOrderStatus(orderId, 'CANCELLED')
            dispatch({ type: 'CLEAR_ORDER_ID' })
          } else {
            await OrderService.updateOrderItems(orderId, remainingItems)
          }
        } else {
          await OrderService.updateOrderItems(orderId, updatedItems)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error)
    }
  }

  const clearCart = async () => {
    try {
      console.log('🧹 Limpando carrinho completo')
      
      // Se existe order, cancela
      const orderId = (cart as any).orderId
      if (orderId) {
        console.log('❌ Cancelando order:', orderId)
        await OrderService.updateOrderStatus(orderId, 'CANCELLED')
        dispatch({ type: 'CLEAR_ORDER_ID' })
      }
      
      dispatch({ type: 'CLEAR_CART' })
    } catch (error) {
      console.error('❌ Erro ao limpar carrinho:', error)
    }
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

      // ✅ Atualiza order EXISTENTE (foi criada quando adicionou primeiro produto)
      const orderId = (cart as any).orderId
      
      console.log('🔍 [DEBUG CHECKOUT]')
      console.log('   - Cart completo:', cart)
      console.log('   - orderId extraído:', orderId)
      console.log('   - items no cart:', cart.items.length)
      
      if (!orderId) {
        throw new Error('Nenhuma order foi criada. Adicione produtos ao carrinho primeiro.')
      }

      console.log('✅ Usando order existente:', orderId)
      await OrderService.updateOrderStatus(orderId, 'PENDING_PAYMENT')

      // Busca a order para ter os dados atualizados
      const order = await OrderService.getOrder(orderId)
      if (!order) {
        throw new Error('Order não encontrada')
      }

      // Prepara dados do usuário para o checkout
      const checkoutUserData = {
        id: firebaseUser.uid,
        name: userProfileData.name || firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        phone: userProfileData.phone || '',
        cpf: userData.cpf,
        address: userData.address // Passa o endereço completo do formulário
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