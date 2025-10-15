'use client'

import { Layout } from '@/components/layout/Layout'
import { useCart } from '@/contexts/CartContext'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { CartSummary } from '@/components/cart/CartSummary'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CartPage() {
  const { cart, clearCart } = useCart()
  const router = useRouter()

  if (cart.items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center text-gray-600 hover:text-coral-500 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Voltar
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Carrinho de Compras</h1>
              </div>
            </div>
          </div>

          {/* Empty Cart */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Seu carrinho está vazio</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Que tal explorar nossos produtos e adicionar alguns itens ao seu carrinho?
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors font-semibold"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-gray-600 hover:text-coral-500 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Carrinho de Compras</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Seus Itens</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Comprando de: <span className="font-medium">{cart.companyName}</span>
                  </p>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <CartItemRow key={item.product.id} item={item} />
                  ))}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Continuar comprando
                    </Link>
                    <button
                      onClick={clearCart}
                      className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 bg-white rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                      Limpar carrinho
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="mt-8 lg:mt-0 lg:col-span-4">
              <CartSummary />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}