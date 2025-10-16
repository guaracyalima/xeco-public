'use client'

import { useState } from 'react'
import { ShoppingBag, CreditCard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/context/AuthContext'
import { CheckoutUserData } from '@/types/order'
import { useNavigationAnalytics } from '@/hooks/useAnalytics'

export function CheckoutButton() {
  const { cart, getCartItemsCount, getCartTotal, startCheckout } = useCart()
  const { firebaseUser } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { trackButtonClick } = useNavigationAnalytics()

  const itemCount = getCartItemsCount()
  const totalAmount = getCartTotal()

  const handleCheckoutClick = () => {
    setError(null)
    setSuccess(null)

    trackButtonClick('checkout_button', 'cart_page')

    // Validações básicas
    if (!firebaseUser) {
      setError('Você precisa estar logado para finalizar a compra')
      return
    }

    if (itemCount === 0) {
      setError('Seu carrinho está vazio')
      return
    }

    // Verifica se todos os produtos são da mesma empresa
    const companies = [...new Set(cart.items.map(item => item.product.companyOwner))]
    if (companies.length > 1) {
      setError('Não é possível comprar produtos de empresas diferentes ao mesmo tempo')
      return
    }

    setIsModalOpen(true)
  }

  const handleConfirmCheckout = async (userData: CheckoutUserData) => {
    setIsLoading(true)
    setError(null)

    try {
      const checkoutUrl = await startCheckout(userData)
      
      setSuccess('Redirecionando para pagamento...')
      setIsModalOpen(false)
      
      // Pequeno delay para mostrar a mensagem de sucesso
      setTimeout(() => {
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
      }, 1000)

    } catch (error) {
      console.error('Erro no checkout:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento')
    } finally {
      setIsLoading(false)
    }
  }

  // Se não há itens, não mostra o botão
  if (itemCount === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-3">
        {/* Mensagens de erro/sucesso */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Resumo do carrinho */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
            </span>
            <span className="text-lg font-semibold text-gray-900">
              R$ {totalAmount.toFixed(2)}
            </span>
          </div>
          
          {/* Lista de itens resumida */}
          <div className="space-y-1">
            {cart.items.slice(0, 2).map((item) => (
              <div key={item.product.id} className="flex justify-between text-xs text-gray-500">
                <span className="truncate">{item.product.name}</span>
                <span>{item.quantity}x R$ {Number(item.product.salePrice).toFixed(2)}</span>
              </div>
            ))}
            {cart.items.length > 2 && (
              <div className="text-xs text-gray-400">
                +{cart.items.length - 2} itens adicionais
              </div>
            )}
          </div>
        </div>

        {/* Botão de checkout */}
        <Button
          onClick={handleCheckoutClick}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 h-auto"
          disabled={isLoading || itemCount === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Finalizar Compra
            </>
          )}
        </Button>

        {/* Informação de segurança */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Pagamento 100% seguro via Asaas
          </p>
        </div>
      </div>

      {/* Modal de checkout */}
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        onConfirm={handleConfirmCheckout}
        totalAmount={totalAmount}
        itemCount={itemCount}
        isLoading={isLoading}
      />
    </>
  )
}
