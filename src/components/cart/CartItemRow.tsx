'use client'

import { CartItem } from '@/types'
import { useCart } from '@/contexts/CartContext'
import { Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CartItemRowProps {
  item: CartItem
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeFromCart } = useCart()
  const { product, quantity, total } = item

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(product.id)
    } else if (newQuantity <= product.stockQuantity) {
      await updateQuantity(product.id, newQuantity)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <Link href={`/produto/${product.id}`}>
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group">
              <Image
                src={product.imagesUrl[0] || '/default-fail-image.jpg'}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/default-fail-image.jpg'
                }}
              />
            </div>
          </Link>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Product Details */}
            <div className="flex-1">
              <Link href={`/produto/${product.id}`}>
                <h3 className="font-semibold text-gray-900 hover:text-coral-500 transition-colors cursor-pointer">
                  {product.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {product.description || 'Produto de qualidade'}
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>Por: {product.companyOwnerName}</span>
                <span className="mx-2">•</span>
                <span>{product.cidade}, {product.uf}</span>
              </div>
              <div className="flex items-center mt-1 text-sm">
                <span className="text-gray-600">Preço unitário: </span>
                <span className="font-medium text-gray-900 ml-1">
                  {formatPrice(product.salePrice)}
                </span>
              </div>
            </div>

            {/* Quantity and Price */}
            <div className="flex flex-col sm:items-end gap-3">
              {/* Quantity Controls */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 hidden sm:block">Qtd:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-2 text-center min-w-[50px] border-x border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                    disabled={quantity >= product.stockQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(total)}
                </div>
                {quantity > 1 && (
                  <div className="text-sm text-gray-500">
                    {quantity} × {formatPrice(product.salePrice)}
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFromCart(product.id)}
                className="inline-flex items-center text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </button>
            </div>
          </div>

          {/* Stock Warning */}
          {quantity >= product.stockQuantity && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Quantidade máxima disponível em estoque
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}