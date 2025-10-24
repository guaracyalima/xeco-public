'use client'

import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { shareProduct } from '@/lib/share-service'
import { Product } from '@/types'

interface ShareProductButtonProps {
  product: Product
  companyName?: string
  variant?: 'icon' | 'button' | 'fab'
  className?: string
}

export function ShareProductButton({ 
  product, 
  companyName,
  variant = 'icon',
  className = '' 
}: ShareProductButtonProps) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isSharing) return
    
    setIsSharing(true)
    
    try {
      await shareProduct(product, companyName)
    } finally {
      setIsSharing(false)
    }
  }

  // Variante: Apenas ícone
  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 ${className}`}
        title="Compartilhar produto"
      >
        <Share2 className={`w-5 h-5 text-gray-600 ${isSharing ? 'animate-pulse' : ''}`} />
      </button>
    )
  }

  // Variante: Botão completo
  if (variant === 'button') {
    return (
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 ${className}`}
      >
        <Share2 className={`w-5 h-5 text-gray-600 ${isSharing ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium text-gray-700">
          {isSharing ? 'Compartilhando...' : 'Compartilhar'}
        </span>
      </button>
    )
  }

  // Variante: FAB (Floating Action Button)
  if (variant === 'fab') {
    return (
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`fixed bottom-20 right-4 z-40 w-14 h-14 bg-coral-600 text-white rounded-full shadow-lg hover:bg-coral-700 transition-all disabled:opacity-50 flex items-center justify-center ${className}`}
        title="Compartilhar produto"
      >
        <Share2 className={`w-6 h-6 ${isSharing ? 'animate-pulse' : ''}`} />
      </button>
    )
  }

  return null
}
