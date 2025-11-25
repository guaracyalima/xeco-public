'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'
import { useAuth } from '@/context/AuthContext'
import { useFavoritesAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

interface FavoriteCompanyButtonProps {
  companyId: string
  companyName: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function FavoriteCompanyButton({ 
  companyId, 
  companyName, 
  className,
  size = 'md',
  showText = true
}: FavoriteCompanyButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { favoriteCompany, unfavoriteCompany, isFavored } = useLikedCompanyContext()
  const { user } = useAuth()
  const { trackAddToFavorites, trackRemoveFromFavorites } = useFavoritesAnalytics()
  
  const isAlreadyFavored = isFavored(companyId)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      // Redirecionar para login
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }

    setIsLoading(true)

    try {
      if (isAlreadyFavored) {
        await unfavoriteCompany(companyId)
        trackRemoveFromFavorites(companyId, companyName, 'company')
      } else {
        await favoriteCompany(companyId)
        trackAddToFavorites(companyId, companyName, 'company')
      }
    } catch (error) {
      console.error('Erro ao gerenciar favoritos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-2 border rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        isAlreadyFavored
          ? 'border-coral-500 text-coral-600 bg-coral-50 hover:bg-coral-100'
          : 'border-gray-300 text-gray-700 hover:border-coral-500 hover:text-coral-600 hover:bg-coral-50',
        className
      )}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          'transition-colors',
          isAlreadyFavored ? 'fill-coral-500 text-coral-500' : 'text-gray-400'
        )} 
      />
      {showText && (
        <span>
          {isLoading 
            ? 'Aguarde...' 
            : isAlreadyFavored 
              ? 'Favoritado' 
              : 'Favoritar franquia'
          }
        </span>
      )}
    </button>
  )
}