'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  getFavoredProducts, 
  favoriteProduct, 
  unfavoriteProduct,
  isProductFavored,
  onFavoredProductsChange
} from '@/lib/liked-product-service'
import { Product } from '@/types'

interface LikedProductContextType {
  favoredProducts: Product[]
  loading: boolean
  error: string | null
  favoriteProduct: (productId: string, companyId: string, location?: [number, number]) => Promise<void>
  unfavoriteProduct: (productId: string) => Promise<void>
  isFavored: (productId: string) => boolean
}

const LikedProductContext = createContext<LikedProductContextType | undefined>(undefined)

type LikedProductState = {
  favoredProducts: Product[]
  loading: boolean
  error: string | null
}

type LikedProductAction =
  | { type: 'SET_FAVORED_PRODUCTS'; payload: Product[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: LikedProductState = {
  favoredProducts: [],
  loading: false,
  error: null
}

function likedProductReducer(state: LikedProductState, action: LikedProductAction): LikedProductState {
  switch (action.type) {
    case 'SET_FAVORED_PRODUCTS':
      return { ...state, favoredProducts: action.payload, error: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

interface LikedProductProviderProps {
  children: ReactNode
}

export function LikedProductProvider({ children }: LikedProductProviderProps) {
  const [state, dispatch] = useReducer(likedProductReducer, initialState)
  const { user, loading: authLoading } = useAuth()

  // Real-time listener para produtos favoritados
  useEffect(() => {
    if (!user || authLoading) {
      dispatch({ type: 'SET_FAVORED_PRODUCTS', payload: [] })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    const unsubscribe = onFavoredProductsChange(
      user.id,
      (products) => {
        dispatch({ type: 'SET_FAVORED_PRODUCTS', payload: products })
        dispatch({ type: 'SET_LOADING', payload: false })
      },
      (error) => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    )

    return () => unsubscribe()
  }, [user, authLoading])

  const handleFavoriteProduct = async (productId: string, companyId: string, location?: [number, number]) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      await favoriteProduct(user.id, productId, companyId, location)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao favoritar'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }

  const handleUnfavoriteProduct = async (productId: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      await unfavoriteProduct(user.id, productId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desfavoritar'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }

  const handleIsFavored = (productId: string): boolean => {
    return state.favoredProducts.some(product => product.id === productId)
  }

  return (
    <LikedProductContext.Provider
      value={{
        favoredProducts: state.favoredProducts,
        loading: state.loading,
        error: state.error,
        favoriteProduct: handleFavoriteProduct,
        unfavoriteProduct: handleUnfavoriteProduct,
        isFavored: handleIsFavored
      }}
    >
      {children}
    </LikedProductContext.Provider>
  )
}

export function useLikedProductContext() {
  const context = useContext(LikedProductContext)
  if (context === undefined) {
    throw new Error('useLikedProductContext deve ser usado dentro de LikedProductProvider')
  }
  return context
}
