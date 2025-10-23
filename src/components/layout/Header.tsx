'use client'

import { ReactNode } from 'react'
import { Menu, X, ShoppingCart, Heart, User } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useNavigationAnalytics } from '@/hooks/useAnalytics'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  children?: ReactNode
  className?: string
}

export function Header({ children, className }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { getCartItemsCount } = useCart()
  const { user } = useAuth()
  const cartItemsCount = getCartItemsCount()
  const { trackButtonClick } = useNavigationAnalytics()

  const handleCartClick = () => {
    trackButtonClick('cart_icon', 'header')
  }

  const handleFavoritesClick = () => {
    trackButtonClick('favorites_icon', 'header')
  }

  const handleProfileClick = () => {
    console.log('👤 [Header] Clicou no ícone de profile')
    console.log('👤 [Header] Usuário logado?', !!user)
    console.log('👤 [Header] Email do usuário:', user?.email || 'Não logado')
    trackButtonClick('profile_icon', 'header')
  }

  return (
    <header className={cn('bg-white shadow-sm border-b', className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-coral-500 transition-colors">
                Xeco
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-8">
              <Link
                href="/"
                className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                Início
              </Link>
              <a
                href="/sobre"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                Sobre
              </a>
              <a
                href="/contato"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                Contato
              </a>
            </nav>

            {/* Favorites and Cart Icons */}
            <div className="flex items-center space-x-2">
              {/* Profile Icon - sempre visível */}
              <Link href="/perfil">
                <div 
                  onClick={handleProfileClick}
                  className="p-2 text-gray-600 hover:text-coral-500 transition-colors cursor-pointer"
                >
                  <User className="h-6 w-6" />
                </div>
              </Link>

              {/* Favorites Icon */}
              {user && (
                <Link href="/favoritos">
                  <div 
                    onClick={handleFavoritesClick}
                    className="relative p-2 text-gray-600 hover:text-coral-500 transition-colors cursor-pointer"
                  >
                    <Heart className="h-6 w-6" />
                  </div>
                </Link>
              )}

              {/* Cart Icon */}
              <Link href="/carrinho">
                <div 
                  onClick={handleCartClick}
                  className="relative p-2 text-gray-600 hover:text-coral-500 transition-colors cursor-pointer"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                      {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile menu button and icons */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Profile Icon - sempre visível */}
            <Link href="/perfil">
              <div 
                onClick={handleProfileClick}
                className="p-2 text-gray-600 hover:text-coral-500 transition-colors cursor-pointer"
              >
                <User className="h-6 w-6" />
              </div>
            </Link>

            {/* Mobile Favorites Icon */}
            {user && (
              <Link href="/favoritos">
                <div 
                  onClick={handleFavoritesClick}
                  className="relative p-2 text-gray-600 hover:text-coral-500 transition-colors cursor-pointer"
                >
                  <Heart className="h-6 w-6" />
                </div>
              </Link>
            )}

            {/* Mobile Cart Icon */}
            <Link href="/carrinho">
              <div 
                onClick={handleCartClick}
                className="relative p-2 text-gray-600 hover:text-coral-500 transition-colors cursor-pointer"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/"
                className="text-gray-900 hover:text-gray-700 block px-3 py-2 text-base font-medium"
              >
                Início
              </Link>
              <a
                href="/sobre"
                className="text-gray-500 hover:text-gray-700 block px-3 py-2 text-base font-medium"
              >
                Sobre
              </a>
              <a
                href="/contato"
                className="text-gray-500 hover:text-gray-700 block px-3 py-2 text-base font-medium"
              >
                Contato
              </a>
              
              {/* Mobile Profile Link */}
              {user && (
                <Link href="/perfil">
                  <div className="text-gray-700 hover:text-coral-500 block px-3 py-2 text-base font-medium transition-colors">
                    Meu Perfil
                  </div>
                </Link>
              )}

              <Link href="/carrinho">
                <div className="flex items-center justify-between text-gray-700 hover:text-coral-500 block px-3 py-2 text-base font-medium transition-colors">
                  <span>Carrinho</span>
                  {cartItemsCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold border border-white shadow-lg">
                      {cartItemsCount}
                    </span>
                  )}
                </div>
              </Link>
              
              {/* Mobile Favorites Link */}
              {user && (
                <Link href="/favoritos">
                  <div className="text-gray-700 hover:text-coral-500 block px-3 py-2 text-base font-medium transition-colors">
                    Favoritos
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {children}
    </header>
  )
}