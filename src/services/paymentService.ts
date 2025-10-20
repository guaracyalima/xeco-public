import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface PaymentConfirmation {
  orderId: string
  checkoutId: string
  status: 'PAID' | 'CANCELLED' | 'EXPIRED'
  paymentDate?: Date
  amount?: number
}

export class PaymentService {
  /**
   * Confirma pagamento e limpa carrinho quando apropriado
   */
  static async confirmPayment(confirmation: PaymentConfirmation): Promise<void> {
    try {
      // Atualiza status do pedido no Firestore
      const orderRef = doc(db, 'orders', confirmation.orderId)
      await updateDoc(orderRef, {
        paymentStatus: confirmation.status,
        paymentDate: confirmation.paymentDate || new Date(),
        updatedAt: new Date()
      })

      console.log('✅ Status de pagamento atualizado:', confirmation.status)

      // Aqui você pode implementar lógica adicional como:
      // - Notificar o usuário
      // - Enviar email de confirmação
      // - Limpar carrinho do localStorage
      if (confirmation.status === 'PAID') {
        // Apenas limpar carrinho quando pagamento for confirmado
        localStorage.removeItem('xeco-cart')
        console.log('✅ Carrinho limpo após confirmação de pagamento')
      }

    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error)
      throw new Error('Erro ao confirmar pagamento')
    }
  }

  /**
   * Verifica status de um pagamento específico
   */
  static async getPaymentStatus(orderId: string): Promise<string | null> {
    try {
      const orderRef = doc(db, 'orders', orderId)
      const orderDoc = await getDoc(orderRef)
      
      if (orderDoc.exists()) {
        return orderDoc.data()?.paymentStatus || null
      }
      
      return null
    } catch (error) {
      console.error('❌ Erro ao verificar status do pagamento:', error)
      return null
    }
  }
}