import { Order, CheckoutRequest, CheckoutResponse } from '@/types/order'
import { OrderService } from './orderService'

export class CheckoutService {
  private static N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''

  /**
   * Chama o webhook do n8n para criar o checkout
   */
  static async createCheckout(
    order: Order,
    companyData: any,
    userData: any
  ): Promise<CheckoutResponse> {
    try {
      console.log('🚀 Iniciando criação de checkout para order:', order.id)
      
      // Valida configuração antes da chamada
      if (!this.validateConfiguration()) {
        throw new Error('Configuração do webhook n8n não encontrada')
      }

      // Prepara os dados no formato esperado pelo n8n
      const requestData = {
        houseId: companyData.id, // ID da empresa (equivale ao houseId do n8n)
        amount: order.totalAmount,
        packageName: this.generatePackageName(order),
        userId: order.customerId,
        bookingId: order.id, // ID do pedido (equivale ao bookingId)
        serviceId: order.items[0]?.productId || 'MULTIPLE_PRODUCTS',
        items: order.items.map(item => ({
          name: item.productName,
          price: item.unitPrice,
          quantity: item.quantity,
          imageBase64: item.productImage
        }))
      }

      console.log('📤 Enviando dados para n8n:', {
        url: this.N8N_WEBHOOK_URL,
        houseId: requestData.houseId,
        amount: requestData.amount,
        packageName: requestData.packageName
      })

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
        throw new Error(`Erro do servidor de pagamento: ${response.status}`)
      }

      const result: CheckoutResponse = await response.json()
      
      if (result.error) {
        console.error('❌ Erro retornado pelo n8n:', result.error)
        throw new Error(result.error)
      }

      if (!result.checkoutUrl || !result.checkoutId) {
        console.error('❌ Resposta inválida do n8n:', result)
        throw new Error('Resposta inválida do servidor de pagamento')
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
      
      // Verifica se é um erro de rede
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('❌ Erro de conectividade com o webhook n8n')
        
        // Em desenvolvimento, simula resposta para continuar testando
        if (process.env.NODE_ENV === 'development') {
          console.log('🧪 Modo desenvolvimento: simulando resposta do checkout')
          
          const mockResponse: CheckoutResponse = {
            checkoutUrl: 'https://checkout.asaas.com/demo/123456',
            checkoutId: 'mock_checkout_' + Date.now(),
            message: 'Checkout simulado criado com sucesso (desenvolvimento)'
          }
          
          // Simula a atualização dos dados no pedido
          await OrderService.updateOrderPayment(
            order.id,
            mockResponse.checkoutId,
            mockResponse.checkoutUrl
          )
          
          return mockResponse
        }
        
        throw new Error('Erro de conectividade com o servidor de pagamentos. Tente novamente.')
      }
      
      // Atualiza status da order para erro se possível
      try {
        await OrderService.updateOrderStatus(order.id, 'CANCELLED')
      } catch (updateError) {
        console.error('❌ Erro ao atualizar status da order:', updateError)
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