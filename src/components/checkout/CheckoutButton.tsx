'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, CreditCard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import CheckoutIframeModal from '@/components/checkout/CheckoutIframeModal'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/context/AuthContext'
import { CheckoutUserData } from '@/types/order'
import { useNavigationAnalytics } from '@/hooks/useAnalytics'
import { UserService } from '@/services/userService'
import { CartDiscount } from '@/types'

interface CheckoutButtonProps {
  discount?: CartDiscount | null;
}

export function CheckoutButton({ discount }: CheckoutButtonProps = {}) {
  const { cart, getCartItemsCount, getCartTotal, startCheckout } = useCart()
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [existingUserData, setExistingUserData] = useState<CheckoutUserData | null>(null)
  const { trackButtonClick } = useNavigationAnalytics()

  const itemCount = getCartItemsCount()
  const subtotalAmount = getCartTotal()
  const discountAmount = discount?.discountAmount || 0
  const totalAmount = discount?.finalTotal || subtotalAmount

  const handleCheckoutClick = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    trackButtonClick('checkout_button', 'cart_page')

    try {
      // Se não estiver logado, redirecionar para login com URL de retorno
      if (!firebaseUser) {
        setIsLoading(false)
        // Redirecionar para login com returnUrl apontando para o carrinho
        const returnUrl = encodeURIComponent('/cart')
        router.push(`/login?returnUrl=${returnUrl}`)
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

      // SEMPRE buscar dados existentes para pré-preencher o modal
      const userProfile = await UserService.getUserProfile(firebaseUser.uid)
      if (userProfile) {
        setExistingUserData(UserService.profileToCheckoutData(userProfile))
      }

      // SEMPRE abrir modal - mesmo que usuário tenha dados completos
      setIsModalOpen(true)

    } catch (error) {
      console.error('Erro ao verificar dados do usuário:', error)
      setError('Erro ao verificar seus dados. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmCheckout = async (userData: CheckoutUserData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Salva dados do usuário no Firestore para próximas compras
      if (firebaseUser) {
        await UserService.saveCheckoutData(
          firebaseUser.uid,
          userData,
          firebaseUser.email || '',
          firebaseUser.displayName || '',
          '' // phone será adicionado quando tivermos campo para isso
        )
      }

      // ✅ Removido: createAffiliateSale() agora é feito pelo webhook N8N
      // O registro será criado na collection 'sales' quando o pagamento for confirmado

      const checkoutUrl = await startCheckout(userData, discount)
      
      console.log('✅ [CHECKOUT] URL de pagamento recebida:', checkoutUrl)
      
      if (!checkoutUrl || checkoutUrl.trim() === '') {
        throw new Error('URL de pagamento não foi gerada. Tente novamente.')
      }
      
      setIsModalOpen(false)
      
      // Redirecionar para o link de pagamento na página atual
      console.log('[CHECKOUT] Redirecionando para link de pagamento:', checkoutUrl)
      window.location.href = checkoutUrl

    } catch (error) {
      console.error('Erro no checkout:', error)
      
      // Mantém o modal aberto e mostra erro específico
      let errorMessage = 'Erro desconhecido ao processar pagamento'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Adiciona contexto específico para alguns erros
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
      } else if (errorMessage.includes('não retornou')) {
        errorMessage = 'Problema no servidor de pagamentos. Tente novamente em alguns minutos.'
      }
      
      setError(errorMessage)
      // NÃO fechar o modal - deixar usuário tentar novamente
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
              R$ {subtotalAmount.toFixed(2)}
            </span>
          </div>

          {/* Mostrar desconto se houver */}
          {discount && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-green-600">
                Desconto ({discount.coupon.code})
                {discount.affiliate && (
                  <span className="text-xs text-gray-500 block">Cupom de afiliado</span>
                )}
              </span>
              <span className="text-green-600 font-medium">
                -R$ {discount.discountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Total final */}
          {discount && (
            <div className="flex items-center justify-between mb-2 pt-2 border-t border-gray-300">
              <span className="text-base font-semibold text-gray-900">
                Total
              </span>
              <span className="text-lg font-bold text-gray-900">
                R$ {totalAmount.toFixed(2)}
              </span>
            </div>
          )}
          
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

      {/* Modal de checkout (dados do usuário) */}
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        onConfirm={handleConfirmCheckout}
        totalAmount={totalAmount}
        itemCount={itemCount}
        isLoading={isLoading}
        existingData={existingUserData}
        hasExistingCpf={!!existingUserData?.cpf}
        hasExistingName={!!existingUserData?.name}
        error={error}
        onErrorClear={() => setError(null)}
      />

      {/* Modal de pagamento embarcado (iframe) */}
      <CheckoutIframeModal
        checkoutUrl={paymentUrl}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setPaymentUrl('')
        }}
        onSuccess={() => {
          console.log('✅ Pagamento concluído!')
          setIsPaymentModalOpen(false)
          // Redirecionar para página de sucesso ou pedidos
          router.push('/profile?tab=pedidos')
        }}
      />
    </>
  )
}
