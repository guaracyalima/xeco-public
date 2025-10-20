import { Order, CheckoutRequest, CheckoutResponse } from '@/types/order'
import { OrderService } from './orderService'
import { calculatePaymentSplits, convertImageToBase64, PLATFORM_FEE_PERCENTAGE } from '@/lib/payment-config'

export class CheckoutService {
  private static N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''

  /**
   * Chama o webhook do n8n para criar o checkout
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
        customerName: order.customerName,
        items: order.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity
        }))
      })
      console.log('🏢 Dados da empresa:', {
        id: companyData.id,
        name: companyData.name
      })
      console.log('👤 Dados do usuário:', {
        cpf: userData.cpf,
        name: userData.name
      })
      
      // Valida se a empresa tem walletId para receber pagamentos
      if (!companyData.walletId) {
        throw new Error('Empresa não possui carteira configurada para receber pagamentos')
      }

      // Calcula os splits do pagamento
      const splitCalculation = calculatePaymentSplits(
        order.totalAmount,
        companyData.walletId,
        affiliateData
      )

      console.log('💰 Cálculo de splits:', {
        total: order.totalAmount,
        platformFee: splitCalculation.platformFee,
        affiliateCommission: splitCalculation.affiliateCommission,
        storeAmount: splitCalculation.storeAmount,
        splits: splitCalculation.splits
      })

      // Converte imagens para base64
      const itemsWithBase64Images = await Promise.all(
        order.items.map(async (item, index) => {
          console.log(`🔍 Item ${index + 1} sendo processado:`, {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            imageUrl: item.productImage
          })

          const base64Image = item.productImage 
            ? await convertImageToBase64(item.productImage)
            : ''

          return {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            productImageBase64: base64Image
          }
        })
      )

      // Valida configuração antes da chamada
      if (!this.validateConfiguration()) {
        throw new Error('Configuração do webhook n8n não encontrada')
      }

      // Prepara os dados no formato correto para o n8n
      const requestData = {
        // Dados da empresa/loja
        companyId: companyData.id,
        companyName: companyData.name || 'Empresa não identificada',
        companyWalletId: companyData.walletId,
        
        // Dados do pedido
        orderId: order.id,
        orderTotal: order.totalAmount,
        orderDescription: order.description,
        
        // Dados do cliente
        customerId: order.customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerCpf: userData.cpf || '',
        
        // Dados dos produtos com imagens em base64
        items: itemsWithBase64Images,
        
        // Sistema de split de pagamento
        paymentSplits: {
          platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
          splits: splitCalculation.splits,
          breakdown: {
            platformFee: splitCalculation.platformFee,
            affiliateCommission: splitCalculation.affiliateCommission,
            storeAmount: splitCalculation.storeAmount
          }
        },
        
        // Dados do afiliado (se houver)
        affiliateData: affiliateData ? {
          walletId: affiliateData.walletId,
          commissionPercentage: affiliateData.commissionPercentage
        } : null,
        
        // Metadados
        channel: order.channel,
        createdAt: order.createdAt.toISOString()
      }

      console.log('📤 Enviando dados para n8n:', {
        url: this.N8N_WEBHOOK_URL,
        companyId: requestData.companyId,
        companyWalletId: requestData.companyWalletId,
        orderTotal: requestData.orderTotal,
        customerId: requestData.customerId,
        itemsCount: requestData.items.length,
        hasSplits: requestData.paymentSplits.splits.length > 0,
        hasAffiliate: !!requestData.affiliateData
      })

      console.log('📦 Payload completo sendo enviado para n8n:', JSON.stringify(requestData, null, 2))

      // Faz a chamada para o n8n
      const response = await fetch(this.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na resposta do n8n:', response.status, errorText)
        throw new Error(`Erro do servidor de pagamento (${response.status}): ${errorText || 'Erro desconhecido'}`)
      }

      const result: CheckoutResponse = await response.json()
      
      // Validação rigorosa da resposta
      if (result.error) {
        console.error('❌ Erro retornado pelo n8n:', result.error)
        throw new Error(`Erro do servidor: ${result.error}`)
      }

      if (!result.checkoutUrl) {
        console.error('❌ URL de checkout não retornada pelo n8n:', result)
        throw new Error('Servidor não retornou URL de pagamento. Tente novamente.')
      }

      if (!result.checkoutId) {
        console.error('❌ ID de checkout não retornado pelo n8n:', result)
        throw new Error('Servidor não retornou ID do pagamento. Tente novamente.')
      }

      // Valida se a URL é válida
      try {
        new URL(result.checkoutUrl)
      } catch (urlError) {
        console.error('❌ URL de checkout inválida:', result.checkoutUrl)
        throw new Error('Servidor retornou URL de pagamento inválida. Tente novamente.')
      }

      // Atualiza a order com os dados do checkout
      await OrderService.updateOrderPayment(
        order.id,
        result.checkoutId,
        result.checkoutUrl
      )

      console.log('✅ Checkout criado com sucesso:', result.checkoutId)
      return result

    } catch (error) {
      console.error('❌ Erro ao criar checkout:', error)
      
      // Atualiza status da order para erro se possível
      try {
        await OrderService.updateOrderStatus(order.id, 'CANCELLED')
      } catch (updateError) {
        console.error('❌ Erro ao atualizar status da order:', updateError)
      }
      
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

  /**
   * Gera um nome descritivo para o pacote baseado nos itens do pedido
   */
  private static generatePackageName(order: Order): string {
    if (order.items.length === 1) {
      return order.items[0].productName
    } else if (order.items.length === 2) {
      return `${order.items[0].productName} e ${order.items[1].productName}`
    } else {
      return `${order.items[0].productName} e mais ${order.items.length - 1} itens`
    }
  }

  /**
   * Valida se a configuração do n8n está correta
   */
  static validateConfiguration(): boolean {
    if (!this.N8N_WEBHOOK_URL) {
      console.error('❌ URL do webhook n8n não configurada')
      return false
    }

    if (!this.N8N_WEBHOOK_URL.startsWith('http')) {
      console.error('❌ URL do webhook n8n inválida')
      return false
    }

    return true
  }

  /**
   * Testa a conexão com o n8n (opcional, para debug)
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!this.validateConfiguration()) {
        return false
      }

      console.log('🔍 Testando conexão com n8n:', this.N8N_WEBHOOK_URL)

      // Faz uma chamada de teste simples com timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(this.N8N_WEBHOOK_URL, {
        method: 'OPTIONS', // Verifica se o endpoint responde
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      const isOk = response.ok || response.status === 405 // 405 = Method Not Allowed é ok
      console.log('🔍 Resultado do teste de conexão:', isOk ? '✅ Conectado' : '❌ Erro')
      
      return isOk
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ Timeout na conexão com n8n')
      } else {
        console.error('❌ Erro ao testar conexão com n8n:', error)
      }
      return false
    }
  }
}