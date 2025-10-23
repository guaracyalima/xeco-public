import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  setDoc,
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Order, OrderItem } from '@/types/order'
import { CartItem } from '@/types'

export class OrderService {
  private static COLLECTION = 'orders'

  /**
   * Gera um novo ID único para o pedido
   */
  static generateOrderId(): string {
    return doc(collection(db, this.COLLECTION)).id
  }

  /**
   * Cria uma nova order baseada nos itens do carrinho
   */
  static async createOrder(
    cartItems: CartItem[],
    userId: string,
    userEmail: string,
    userName: string,
    userPhone: string,
    companyId: string,
    companyOwnerId: string
  ): Promise<Order> {
    try {
            // Calcula o total geral
      const totalAmount = cartItems.reduce((total, item) => total + (item.quantity * Number(item.product.salePrice)), 0)
      
      // Converte items do carrinho para OrderItems
      const orderItems: OrderItem[] = cartItems.map(item => ({
        id: item.product.id,
        productId: item.product.id,
        productName: item.product.name,
        productReference: `/product/${item.product.id}`,
        quantity: item.quantity,
        unitPrice: Number(item.product.salePrice),
        totalPrice: item.quantity * Number(item.product.salePrice),
        productImage: item.product.imagesUrl[0]
      }))

      // Cria a order
      const orderId = this.generateOrderId()
      const now = new Date()
      
      const order: Order = {
        id: orderId,
        customerId: userId,
        customerEmail: userEmail,
        customerName: userName,
        customerPhone: userPhone,
        companyId: companyId,
        companyReference: `/companies/${companyId}`,
        companyOwnerId: companyOwnerId,
        items: orderItems,
        totalAmount: totalAmount,
        description: `Sua compra no app Xeco em ${new Date().toLocaleDateString('pt-BR')}`,
        status: 'CREATED',
        channel: 'WEB',
        type: 'PRODUCT',
        createdAt: now,
        updatedAt: now
      }

      // Salva no Firestore
      const docRef = doc(db, this.COLLECTION, orderId)
      const orderToSave = {
        ...order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await setDoc(docRef, orderToSave)
      
      console.log('📝 Order criada com sucesso:', orderId)
      return order

    } catch (error) {
      console.error('❌ Erro ao criar order:', error)
      throw new Error('Falha ao criar pedido')
    }
  }

  /**
   * Busca uma order pelo ID
   */
  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, this.COLLECTION, orderId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        
        console.log('🔍 Dados da order no Firebase:', {
          hasItems: !!data.items,
          itemsLength: data.items?.length,
          hasProducts: !!data.products,
          productsLength: data.products?.length,
          keys: Object.keys(data)
        })
        
        // ⚠️ COMPATIBILIDADE: Se Firebase salvou como 'products', mapear para 'items'
        const items = data.items || data.products || []
        
        // Converte createdAt e updatedAt (pode ser Timestamp ou string)
        let createdAt = new Date()
        let updatedAt = new Date()
        
        if (data.createdAt) {
          if (typeof data.createdAt === 'string') {
            createdAt = new Date(data.createdAt)
          } else if (data.createdAt.toDate) {
            createdAt = data.createdAt.toDate()
          }
        }
        
        if (data.updatedAt) {
          if (typeof data.updatedAt === 'string') {
            updatedAt = new Date(data.updatedAt)
          } else if (data.updatedAt.toDate) {
            updatedAt = data.updatedAt.toDate()
          }
        }
        
        return {
          ...data,
          id: docSnap.id,
          items, // ← Usa items mapeado (products ou items)
          createdAt,
          updatedAt
        } as Order
      }
      
      return null
    } catch (error) {
      console.error('❌ Erro ao buscar order:', error)
      throw new Error('Falha ao buscar pedido')
    }
  }

  /**
   * Atualiza items de uma order existente
   */
  static async updateOrderItems(orderId: string, cartItems: CartItem[]): Promise<void> {
    try {
      // Converte items do carrinho para OrderItems
      const orderItems: OrderItem[] = cartItems.map(item => ({
        id: item.product.id,
        productId: item.product.id,
        productName: item.product.name,
        productReference: `/product/${item.product.id}`,
        quantity: item.quantity,
        unitPrice: Number(item.product.salePrice),
        totalPrice: item.quantity * Number(item.product.salePrice),
        productImage: item.product.imagesUrl[0]
      }))

      // Calcula o total geral
      const totalAmount = orderItems.reduce((total, item) => total + item.totalPrice, 0)

      const docRef = doc(db, this.COLLECTION, orderId)
      await updateDoc(docRef, {
        items: orderItems,
        totalAmount,
        updatedAt: serverTimestamp()
      })

      console.log('🔄 Items da order atualizados:', orderId)
    } catch (error) {
      console.error('❌ Erro ao atualizar items da order:', error)
      throw new Error('Falha ao atualizar items do pedido')
    }
  }

  /**
   * Atualiza dados de pagamento da order
   */
  static async updateOrderPayment(
    orderId: string, 
    checkoutId: string, 
    checkoutUrl: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, orderId)
      
      await updateDoc(docRef, {
        checkoutId,
        checkoutUrl,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        updatedAt: serverTimestamp()
      })
      
      console.log('💳 Dados de pagamento atualizados para order:', orderId)
    } catch (error) {
      console.error('❌ Erro ao atualizar pagamento:', error)
      throw new Error('Falha ao atualizar dados de pagamento')
    }
  }

  /**
   * Atualiza status da order
   */
  static async updateOrderStatus(
    orderId: string, 
    status: Order['status'],
    paymentStatus?: Order['paymentStatus']
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, orderId)
      
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      }
      
      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus
      }
      
      await updateDoc(docRef, updateData)
      
      console.log('📊 Status atualizado para order:', orderId, status)
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      throw new Error('Falha ao atualizar status do pedido')
    }
  }

  /**
   * Busca orders de um usuário
   */
  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('customerId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const orders: Order[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        orders.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Order)
      })
      
      return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('❌ Erro ao buscar orders do usuário:', error)
      throw new Error('Falha ao buscar pedidos do usuário')
    }
  }

  /**
   * Busca orders de uma empresa
   */
  static async getCompanyOrders(companyId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('companyId', '==', companyId)
      )
      
      const querySnapshot = await getDocs(q)
      const orders: Order[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        orders.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Order)
      })
      
      return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('❌ Erro ao buscar orders da empresa:', error)
      throw new Error('Falha ao buscar pedidos da empresa')
    }
  }
}