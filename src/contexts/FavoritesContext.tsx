'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'

export interface FavoriteCompany {
  id: string
  name: string
  addedAt: Date
}

interface FavoritesContextType {
  favorites: FavoriteCompany[]
  loading: boolean
  addToFavorites: (companyId: string, companyName: string) => Promise<void>
  removeFromFavorites: (companyId: string) => Promise<void>
  isFavorite: (companyId: string) => boolean
  requireAuth: (callback: () => void) => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

type FavoritesState = {
  favorites: FavoriteCompany[]
  loading: boolean
}

type FavoritesAction =
  | { type: 'SET_FAVORITES'; payload: FavoriteCompany[] }
  | { type: 'ADD_FAVORITE'; payload: FavoriteCompany }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: FavoritesState = {
  favorites: [],
  loading: false
}

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload }
    case 'ADD_FAVORITE':
      return { 
        ...state, 
        favorites: [...state.favorites, action.payload] 
      }
    case 'REMOVE_FAVORITE':
      return { 
        ...state, 
        favorites: state.favorites.filter(fav => fav.id !== action.payload) 
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

interface FavoritesProviderProps {
  children: ReactNode
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [state, dispatch] = useReducer(favoritesReducer, initialState)
  const { user, loading: authLoading } = useAuth()

  // Carregar favoritos do usuário quando autenticado
  useEffect(() => {
    if (!user || authLoading) {
      dispatch({ type: 'SET_FAVORITES', payload: [] })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    const favoritesRef = collection(db, 'users', user.id, 'favoriteCompanies')
    
    const unsubscribe = onSnapshot(favoritesRef, (snapshot) => {
      const favorites = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        addedAt: doc.data().addedAt?.toDate() || new Date()
      }))
      
      dispatch({ type: 'SET_FAVORITES', payload: favorites })
      dispatch({ type: 'SET_LOADING', payload: false })
    }, (error) => {
      console.error('Erro ao carregar favoritos:', error)
      dispatch({ type: 'SET_LOADING', payload: false })
    })

    return () => unsubscribe()
  }, [user, authLoading])

  const addToFavorites = async (companyId: string, companyName: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const favoriteRef = doc(db, 'users', user.id, 'favoriteCompanies', companyId)
    
    await setDoc(favoriteRef, {
      name: companyName,
      addedAt: new Date()
    })

    console.log(`✅ Empresa "${companyName}" adicionada aos favoritos`)
  }

  const removeFromFavorites = async (companyId: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const favoriteRef = doc(db, 'users', user.id, 'favoriteCompanies', companyId)
    await deleteDoc(favoriteRef)

    console.log(`❌ Empresa removida dos favoritos`)
  }

  const isFavorite = (companyId: string): boolean => {
    return state.favorites.some(fav => fav.id === companyId)
  }

  const requireAuth = (callback: () => void) => {
    if (!user) {
      // Salvar callback para executar após login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingAction', 'addFavorite')
        sessionStorage.setItem('returnUrl', window.location.pathname)
        window.location.href = '/login'
      }
      return
    }
    
    callback()
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites: state.favorites,
        loading: state.loading,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        requireAuth
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}