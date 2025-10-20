'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  getFavoredCompanies, 
  favoriteCompany, 
  unfavoriteCompany,
  isCompanyFavored,
  onFavoredCompaniesChange
} from '@/lib/liked-company-service'
import { Company } from '@/types'

interface LikedCompanyContextType {
  favoredCompanies: Company[]
  loading: boolean
  error: string | null
  favoriteCompany: (companyId: string, location?: [number, number]) => Promise<void>
  unfavoriteCompany: (companyId: string) => Promise<void>
  isFavored: (companyId: string) => boolean
}

const LikedCompanyContext = createContext<LikedCompanyContextType | undefined>(undefined)

type LikedCompanyState = {
  favoredCompanies: Company[]
  loading: boolean
  error: string | null
}

type LikedCompanyAction =
  | { type: 'SET_FAVORED_COMPANIES'; payload: Company[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: LikedCompanyState = {
  favoredCompanies: [],
  loading: false,
  error: null
}

function likedCompanyReducer(state: LikedCompanyState, action: LikedCompanyAction): LikedCompanyState {
  switch (action.type) {
    case 'SET_FAVORED_COMPANIES':
      return { ...state, favoredCompanies: action.payload, error: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

interface LikedCompanyProviderProps {
  children: ReactNode
}

export function LikedCompanyProvider({ children }: LikedCompanyProviderProps) {
  const [state, dispatch] = useReducer(likedCompanyReducer, initialState)
  const { user, loading: authLoading } = useAuth()

  // Real-time listener para empresas favoritadas
  useEffect(() => {
    if (!user || authLoading) {
      dispatch({ type: 'SET_FAVORED_COMPANIES', payload: [] })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    const unsubscribe = onFavoredCompaniesChange(
      user.id,
      (companies) => {
        dispatch({ type: 'SET_FAVORED_COMPANIES', payload: companies })
        dispatch({ type: 'SET_LOADING', payload: false })
      },
      (error) => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    )

    return () => unsubscribe()
  }, [user, authLoading])

  const handleFavoriteCompany = async (companyId: string, location?: [number, number]) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      await favoriteCompany(user.id, companyId, location)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao favoritar'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }

  const handleUnfavoriteCompany = async (companyId: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      await unfavoriteCompany(user.id, companyId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desfavoritar'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }

  const handleIsFavored = (companyId: string): boolean => {
    return state.favoredCompanies.some(company => company.id === companyId)
  }

  return (
    <LikedCompanyContext.Provider
      value={{
        favoredCompanies: state.favoredCompanies,
        loading: state.loading,
        error: state.error,
        favoriteCompany: handleFavoriteCompany,
        unfavoriteCompany: handleUnfavoriteCompany,
        isFavored: handleIsFavored
      }}
    >
      {children}
    </LikedCompanyContext.Provider>
  )
}

export function useLikedCompanyContext() {
  const context = useContext(LikedCompanyContext)
  if (context === undefined) {
    throw new Error('useLikedCompanyContext deve ser usado dentro de LikedCompanyProvider')
  }
  return context
}
