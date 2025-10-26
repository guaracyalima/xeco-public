/**
 * Serviço de Checkout - Integração com n8n para criação de pagamentos
 * Atualizado para usar a nova estrutura de requisição
 */

import { Order, CheckoutRequest, CheckoutResponse } from '@/types/order'
import { OrderService } from './orderService'
import { 
  createPaymentCheckout, 
  formatPaymentErrors,
  CreatePaymentData 
} from './checkoutService-new'
import { CartItem } from '@/types'

export class CheckoutService {
  /**
   * Chama o webhook do n8n para criar o checkout
   * Atualizado para usar a nova estrutura de integração
   */
  static async createCheckout(
    order: Order,
    companyData: any,
    userData: any,
    affiliateData?: {
      walletId: string
      commissionPercentage: number
    }
  ): Promise<CheckoutResponse> {
    try {
      console.log('🚀 Iniciando criação de checkout para order:', order.id)
      console.log('📋 Dados da order recebida:', {
        id: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        hasItems: !!order.items,
        itemsLength: order.items?.length,
        items: order.items
      })
      
      // Valida se order tem items
      if (!order.items || order.items.length === 0) {
        throw new Error('Order não contém produtos. Verifique se os produtos foram salvos corretamente no Firebase.')
      }
      
      // Valida se a empresa tem walletId para receber pagamentos
      if (!companyData.walletId) {
        throw new Error('Empresa não possui carteira configurada para receber pagamentos')
      }

      // Converte os items da order para CartItem format
      const cartItems: CartItem[] = order.items.map(item => ({
        product: {
          id: item.productId,
          name: item.productName,
          description: item.productName,
          companyOwner: companyData.id,
          companyOwnerName: companyData.name,
          imagesUrl: [item.productImage || ''],
          salePrice: item.unitPrice,
          stockQuantity: 100, // Valor placeholder
          cidade: '',
          uf: '',
          productEmphasis: false,
          active: 'SIM',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        quantity: item.quantity,
        total: item.totalPrice
      }))

      // Prepara dados para o novo serviço
      const paymentData: CreatePaymentData = {
        cartItems,
        userData: {
          cpf: userData.cpf || '',
          address: userData.address || {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
          }
        },
        orderId: order.id,
        userId: userData.id || order.customerId, // ← Usa userData.id (do checkout) ou order.customerId (fallback)
        companyWalletId: companyData.walletId,
        affiliateData,
        userEmail: userData.email || order.customerEmail, // ← Usa userData.email ou order.customerEmail
        userName: userData.name || order.customerName, // ← Usa userData.name ou order.customerName
        userPhone: userData.phone || order.customerPhone || '' // ← Usa userData.phone ou order.customerPhone
      }

      console.log('📤 Enviando dados para o novo serviço de pagamento...')
      console.log('🔍 Dados do pagamento:', {
        userId: paymentData.userId,
        userEmail: paymentData.userEmail,
        userName: paymentData.userName,
        orderId: paymentData.orderId,
        itemsCount: paymentData.cartItems.length
      })

      // Chama o novo serviço de pagamento
      const paymentResult = await createPaymentCheckout(paymentData)

      // Verifica se houve erro
      if (!paymentResult.success) {
        const errorMessage = paymentResult.errors 
          ? formatPaymentErrors(paymentResult.errors)
          : 'Erro desconhecido ao processar pagamento'
        
        console.error('❌ Erro no pagamento:', errorMessage)
        throw new Error(errorMessage)
      }

      // Valida resposta de sucesso
      if (!paymentResult.paymentLink) {
        throw new Error('Servidor não retornou URL de pagamento')
      }

      if (!paymentResult.orderId) {
        throw new Error('Servidor não retornou ID do pagamento')
      }

      // Atualiza a order com os dados do checkout
      await OrderService.updateOrderPayment(
        order.id,
        paymentResult.orderId,
        paymentResult.paymentLink
      )

      console.log('✅ Checkout criado com sucesso:', paymentResult.orderId)
      console.log('🔗 URL de pagamento:', paymentResult.paymentLink)

      const response = {
        checkoutId: paymentResult.orderId,
        checkoutUrl: paymentResult.paymentLink,
        message: 'Checkout criado com sucesso'
      }
      
      console.log('📦 Retornando resposta:', response)
      
      return response

    } catch (error) {
      console.error('❌ Erro ao criar checkout:', error)
      
      // ⚠️ NÃO cancelar a order automaticamente aqui!
      // A order só deve ser cancelada quando o usuário remove todos os itens do carrinho
      // Mantém como PENDING_PAYMENT para permitir retry
      
      // Verifica se é um erro de rede e fornece mensagem apropriada
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Erro de conectividade com o servidor de pagamentos. Verifique sua conexão e tente novamente.')
      }
      
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Erro desconhecido ao processar pagamento')
      }
    }
  }
}