'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { Product } from '@/types'

export default function TestCheckoutPage() {
  const { addToCart, cart } = useCart()
  const [isLoading, setIsLoading] = useState(false)

  // Produto de teste
  const testProduct: Product = {
    id: 'test-product-123',
    name: 'Produto de Teste para Checkout',
    description: 'Este é um produto criado apenas para testar o fluxo de checkout',
    companyOwner: 'test-company-456',
    companyOwnerName: 'Empresa de Teste',
    imagesUrl: ['https://via.placeholder.com/300x200?text=Produto+Teste'],
    salePrice: 29.99,
    stockQuantity: 100,
    cidade: 'São Paulo',
    uf: 'SP',
    productEmphasis: false,
    active: 'SIM',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const handleAddToCart = async () => {
    setIsLoading(true)
    try {
      await addToCart(testProduct, 1)
      console.log('✅ Produto adicionado ao carrinho')
    } catch (error) {
      console.error('❌ Erro ao adicionar produto:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-6">Teste de Checkout</h1>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold">{testProduct.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{testProduct.description}</p>
            <p className="text-lg font-bold text-green-600 mt-2">
              R$ {testProduct.salePrice.toFixed(2)}
            </p>
            
            <Button 
              onClick={handleAddToCart}
              disabled={isLoading}
              className="w-full mt-3"
            >
              {isLoading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Carrinho Atual:</h3>
            <p className="text-sm">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'}
            </p>
            <p className="text-sm font-semibold">
              Total: R$ {cart.totalPrice.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/carrinho'}
              variant="secondary"
              className="w-full"
            >
              Ir para Carrinho
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/login'}
              variant="outline"
              className="w-full"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}