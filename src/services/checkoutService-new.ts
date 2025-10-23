/**
 * Serviço de Checkout - Integração com n8n para criação de pagamentos
 */

import { CartItem } from '@/types'
import { CheckoutUserData } from '@/types/order'
import { calculatePaymentSplits } from '@/lib/payment-config'
import { CHECKOUT_CALLBACKS } from '@/lib/config'
import { generateCheckoutSignature } from '@/lib/checkout-signature'
import {
  N8N_ENDPOINTS,
  N8NPaymentRequest,
  N8NPaymentSuccessResponse,
  N8NPaymentErrorResponse,
  isErrorResponse,
  isSuccessResponse
} from '@/lib/n8n-config'
import { v4 as uuidv4 } from 'uuid'

/**
 * Interface para os dados necessários para criar um pagamento
 */
export interface CreatePaymentData {
  cartItems: CartItem[]
  userData: CheckoutUserData
  orderId: string // ID da ordem criada no Firebase
  userId: string
  companyWalletId: string
  affiliateData?: {
    walletId: string
    commissionPercentage: number
  }
  userEmail: string
  userName: string
  userPhone: string
}

/**
 * Interface para o resultado do pagamento
 */
export interface PaymentResult {
  success: boolean
  paymentLink?: string
  orderId?: string
  errors?: Array<{
    code: string
    description: string
  }>
}

/**
 * Cria um pedido de pagamento via n8n
 */
export async function createPaymentCheckout(
  data: CreatePaymentData
): Promise<PaymentResult> {
  try {
    console.log('🚀 Iniciando criação de pagamento...', {
      itemCount: data.cartItems.length,
      userId: data.userId
    })

    // Validações
    if (!data.cartItems || data.cartItems.length === 0) {
      throw new Error('Carrinho vazio')
    }

    if (!data.userId) {
      throw new Error('Usuário não identificado')
    }

    // Gera um ID único para a ordem
    const orderExternalReference = uuidv4()

    // Calcula o total do carrinho (SEMPRE recalcular baseado em quantity × price)
    const totalAmount = data.cartItems.reduce((sum, item) => {
      const itemPrice = Number(item.product.salePrice) || 0
      const itemQuantity = item.quantity || 0
      const itemTotal = itemPrice * itemQuantity
      console.log(`📊 Item ${item.product.id}: ${itemQuantity} × ${itemPrice} = ${itemTotal}`)
      return sum + itemTotal
    }, 0)

    console.log(`💰 Total Amount Calculado: ${totalAmount}`)

    // Valida o total
    if (!totalAmount || totalAmount <= 0 || isNaN(totalAmount)) {
      throw new Error(`Total do carrinho inválido: ${totalAmount}. Deve ser um número maior que zero.`)
    }

    // Pega o companyId do primeiro item (todos os itens devem ser da mesma empresa)
    const companyId = data.cartItems[0].product.companyOwner
    const companyName = data.cartItems[0].product.companyOwnerName || 'Loja'

    console.log('💰 Calculando splits de pagamento...')
    // Calcula os splits de pagamento
    const splitCalculation = calculatePaymentSplits(
      totalAmount,
      data.companyWalletId,
      data.affiliateData
    )

    console.log('📦 Processando itens do carrinho...')
    // ⚠️ NÃO converter imagem no frontend! O backend faz isso.
    // Evita problema com Service Worker e CORS no browser
    const items = data.cartItems.map((item) => {
      return {
        externalReference: item.product.id,
        productId: item.product.id,
        description: item.product.description || item.product.name,
        imageUrl: item.product.imagesUrl?.[0] || '', // ← Envia URL, backend converte
        name: item.product.name,
        quantity: item.quantity,
        value: item.product.salePrice,
        unitPrice: item.product.salePrice
      }
    })

    // Monta a lista de produtos para tracking
    const productList = data.cartItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.salePrice,
      totalPrice: item.quantity * item.product.salePrice
    }))

    // Remove caracteres especiais do CPF
    const cpfCnpj = data.userData.cpf.replace(/\D/g, '')

    // Remove caracteres especiais do CEP
    const postalCode = data.userData.address.zipCode.replace(/\D/g, '')

    // Remove caracteres especiais do telefone
    const phone = data.userPhone.replace(/\D/g, '')

    console.log('📋 Montando payload de pagamento...')
    // Monta o payload da requisição
    const paymentRequest: N8NPaymentRequest = {
      billingTypes: ['CREDIT_CARD', 'PIX'],
      chargeTypes: ['DETACHED', 'INSTALLMENT'],
      minutesToExpire: 15,
      totalAmount,
      externalReference: orderExternalReference,
      callback: {
        successUrl: CHECKOUT_CALLBACKS.success,
        cancelUrl: CHECKOUT_CALLBACKS.cancel,
        expiredUrl: CHECKOUT_CALLBACKS.expired
      },
      items,
      customerData: {
        name: data.userName,
        cpfCnpj,
        email: data.userEmail,
        phone,
        address: data.userData.address.street,
        addressNumber: data.userData.address.number,
        complement: data.userData.address.complement || '',
        province: data.userData.address.neighborhood,
        postalCode,
        city: data.userData.address.city
      },
      installment: {
        maxInstallmentCount: 1
      },
      splits: splitCalculation.splits,
      orderId: data.orderId,
      companyId,
      companyOrder: companyName,
      userId: data.userId,
      productList
    }

    // Logs detalhados da request
    console.log('\n' + '='.repeat(80))
    console.log('🔍 DADOS DETALHADOS DA REQUISIÇÃO DE CHECKOUT')
    console.log('='.repeat(80))
    console.log('\n📋 DADOS DO CLIENTE:')
    console.log('  Nome:', paymentRequest.customerData.name)
    console.log('  Email:', paymentRequest.customerData.email)
    console.log('  CPF/CNPJ:', paymentRequest.customerData.cpfCnpj)
    console.log('  Telefone:', paymentRequest.customerData.phone)
    console.log('  Endereço:', paymentRequest.customerData.address)
    console.log('  Número:', paymentRequest.customerData.addressNumber)
    console.log('  Complemento:', paymentRequest.customerData.complement)
    console.log('  Bairro:', paymentRequest.customerData.province)
    console.log('  CEP:', paymentRequest.customerData.postalCode)
    console.log('  Cidade:', paymentRequest.customerData.city)

    console.log('\n💰 DADOS DO PAGAMENTO:')
    console.log('  Referência Externa:', paymentRequest.externalReference)
    console.log('  Tipos de Cobrança:', paymentRequest.billingTypes)
    console.log('  Tipos de Carga:', paymentRequest.chargeTypes)
    console.log('  Minutos para expirar:', paymentRequest.minutesToExpire)
    console.log('  Total do carrinho: R$', totalAmount)

    console.log('\n📦 ITENS DO CARRINHO:')
    paymentRequest.items.forEach((item, index) => {
      console.log(`  [${index + 1}] ${item.name}`)
      console.log(`      Quantidade: ${item.quantity}`)
      console.log(`      Valor Unitário: R$ ${item.value}`)
      console.log(`      Total: R$ ${item.quantity * item.value}`)
      console.log(`      Descrição: ${item.description}`)
    })

    console.log('\n🏢 DADOS DA EMPRESA:')
    console.log('  Company ID:', paymentRequest.companyId)
    console.log('  Company Order:', paymentRequest.companyOrder)

    console.log('\n💳 DADOS DE SPLIT:')
    console.log('  Quantidade de splits:', paymentRequest.splits.length)
    paymentRequest.splits.forEach((split, index) => {
      console.log(`  [Split ${index + 1}]`)
      console.log(`    Wallet ID: ${split.walletId}`)
      console.log(`    Percentual: ${split.percentageValue}%`)
    })

    console.log('\n🔗 CONFIGURAÇÃO DA REQUISIÇÃO:')
    console.log('  Endpoint:', N8N_ENDPOINTS.createPayment)
    console.log('  Método: POST')
    console.log('  Content-Type: application/json')
    console.log('  User ID:', paymentRequest.userId)
    console.log('  Callback - Success:', paymentRequest.callback.successUrl)
    console.log('  Callback - Cancel:', paymentRequest.callback.cancelUrl)
    console.log('  Callback - Expired:', paymentRequest.callback.expiredUrl)

    console.log('\n📊 RESUMO:')
    console.log('  ✓ Total itens:', paymentRequest.items.length)
    console.log('  ✓ Total pagamento: R$', totalAmount)
    console.log('  ✓ Total splits: ', paymentRequest.splits.length)
    console.log('  ✓ Status validação: PRONTO PARA ENVIO')
    console.log('='.repeat(80) + '\n')

    console.log('📤 Enviando requisição para n8n...', {
      endpoint: N8N_ENDPOINTS.createPayment,
      itemsCount: items.length,
      totalAmount
    })

    // 🔒 Gera assinatura HMAC para fraud prevention
    console.log('🔒 Gerando assinatura HMAC para fraud prevention...')
    
    // ⚠️ IMPORTANTE: Usar os dados ORIGINAIS do carrinho para gerar a assinatura
    // Backend vai recalcular usando os mesmos dados
    const dataToSign = {
      companyId: companyId,
      totalAmount: totalAmount,
      items: data.cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: Number(item.product.salePrice)
      }))
    }
    
    console.log('🔐 Dados usados para gerar assinatura:', JSON.stringify(dataToSign, null, 2))
    const signature = generateCheckoutSignature(dataToSign)
    console.log('🔐 Assinatura gerada:', signature)
    paymentRequest.signature = signature

    console.log('\n' + '='.repeat(80))
    console.log('🔴 PAYLOAD QUE SERÁ ENVIADO AO BACKEND:')
    console.log('='.repeat(80))
    console.log(JSON.stringify(paymentRequest, null, 2))
    console.log('='.repeat(80) + '\n')

    // Envia a requisição para o n8n
    const response = await fetch(N8N_ENDPOINTS.createPayment, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentRequest)
    })

    console.log('📥 Resposta recebida:', {
      status: response.status,
      ok: response.ok
    })

    // Parse da resposta
    const responseData = await response.json()

    console.log('\n' + '='.repeat(80))
    console.log('📥 DETALHES DA RESPOSTA DO N8N')
    console.log('='.repeat(80))
    console.log('Status HTTP:', response.status)
    console.log('Resposta OK:', response.ok)
    console.log('Dados da Resposta:', JSON.stringify(responseData, null, 2))
    console.log('='.repeat(80) + '\n')

    // Verifica se é uma resposta de erro
    if (!response.ok || isErrorResponse(responseData)) {
      const errorResponse = responseData as N8NPaymentErrorResponse
      console.error('\n❌ ERRO NA CRIAÇÃO DO PAGAMENTO')
      console.error('Erros:', JSON.stringify(errorResponse.errors, null, 2))
      console.error('Response Status:', response.status)

      return {
        success: false,
        errors: errorResponse.errors
      }
    }

    // Verifica se é uma resposta de sucesso
    if (isSuccessResponse(responseData)) {
      const successResponse = responseData as any // Backend format é diferente

      console.log('\n✅ PAGAMENTO CRIADO COM SUCESSO!')
      console.log('ID do Pagamento:', successResponse.asaasPaymentId || successResponse.id)
      console.log('Link de Checkout:', successResponse.checkoutUrl || successResponse.link)
      console.log('Order ID:', successResponse.orderId)
      console.log('')

      return {
        success: true,
        paymentLink: successResponse.checkoutUrl || successResponse.link,
        orderId: successResponse.orderId || successResponse.id
      }
    }

    // Resposta inesperada
    console.error('❌ Resposta inesperada do servidor:', responseData)
    return {
      success: false,
      errors: [
        {
          code: 'UNEXPECTED_RESPONSE',
          description: 'Resposta inesperada do servidor'
        }
      ]
    }
  } catch (error) {
    console.error('❌ Erro ao criar pagamento:', error)

    return {
      success: false,
      errors: [
        {
          code: 'INTERNAL_ERROR',
          description:
            error instanceof Error ? error.message : 'Erro interno ao processar pagamento'
        }
      ]
    }
  }
}

/**
 * Formata erros para exibição ao usuário
 */
export function formatPaymentErrors(
  errors: Array<{ code: string; description: string }>
): string {
  if (!errors || errors.length === 0) {
    return 'Erro desconhecido ao processar pagamento'
  }

  // Se houver múltiplos erros, concatena as descrições
  if (errors.length > 1) {
    return errors.map((e) => e.description).join('; ')
  }

  return errors[0].description
}
