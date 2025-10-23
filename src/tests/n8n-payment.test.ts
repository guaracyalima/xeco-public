/**
 * Testes de Integração - n8n Payment Checkout
 * 
 * Para rodar este arquivo de teste manualmente:
 * 1. Certifique-se de que o n8n está rodando
 * 2. Configure NEXT_PUBLIC_N8N_URL no .env.local
 * 3. Abra o console do navegador
 * 4. Cole as funções abaixo
 */

import { createPaymentCheckout, formatPaymentErrors } from '@/services/checkoutService-new'
import { CartItem } from '@/types'

/**
 * Mock de dados para teste
 */
const mockCartItems: CartItem[] = [
  {
    product: {
      id: 'test-product-1',
      name: 'Produto Teste 1',
      description: 'Descrição do produto teste',
      companyOwner: 'test-company-id',
      companyOwnerName: 'Empresa Teste',
      imagesUrl: ['https://via.placeholder.com/300'],
      salePrice: 100,
      stockQuantity: 10,
      cidade: 'São Paulo',
      uf: 'SP',
      productEmphasis: false,
      active: 'SIM',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    quantity: 2,
    total: 200
  }
]

const mockUserData = {
  cpf: '12345678900',
  address: {
    street: 'Rua Teste',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310000'
  }
}

const mockPaymentData = {
  cartItems: mockCartItems,
  userData: mockUserData,
  orderId: 'test-order-id', // ← ADICIONADO: ID da ordem
  userId: 'test-user-id',
  companyWalletId: 'test-wallet-id',
  userEmail: 'teste@xeco.com.br',
  userName: 'Usuário Teste',
  userPhone: '11999999999'
}

/**
 * Teste 1: Criar pagamento sem afiliado
 */
export async function testCreatePaymentWithoutAffiliate() {
  console.log('🧪 Teste 1: Criar pagamento SEM afiliado')
  
  try {
    const result = await createPaymentCheckout(mockPaymentData)
    
    console.log('✅ Resultado:', result)
    
    if (result.success) {
      console.log('✅ Pagamento criado com sucesso!')
      console.log('🔗 Link de pagamento:', result.paymentLink)
      console.log('🆔 Order ID:', result.orderId)
    } else {
      console.log('❌ Falha ao criar pagamento')
      console.log('Erros:', result.errors)
      console.log('Mensagem formatada:', formatPaymentErrors(result.errors || []))
    }
    
    return result
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    throw error
  }
}

/**
 * Teste 2: Criar pagamento com afiliado
 */
export async function testCreatePaymentWithAffiliate() {
  console.log('🧪 Teste 2: Criar pagamento COM afiliado')
  
  const dataWithAffiliate = {
    ...mockPaymentData,
    affiliateData: {
      walletId: 'affiliate-wallet-id',
      commissionPercentage: 10
    }
  }
  
  try {
    const result = await createPaymentCheckout(dataWithAffiliate)
    
    console.log('✅ Resultado:', result)
    
    if (result.success) {
      console.log('✅ Pagamento criado com sucesso!')
      console.log('🔗 Link de pagamento:', result.paymentLink)
      console.log('🆔 Order ID:', result.orderId)
      console.log('💰 Split com afiliado aplicado')
    } else {
      console.log('❌ Falha ao criar pagamento')
      console.log('Erros:', result.errors)
    }
    
    return result
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    throw error
  }
}

/**
 * Teste 3: Validar conversão de imagens para base64
 */
export async function testImageConversion() {
  console.log('🧪 Teste 3: Validar conversão de imagens')
  
  const { imageUrlToBase64 } = await import('@/lib/base64-converter')
  
  try {
    const testUrl = 'https://via.placeholder.com/150'
    console.log('🖼️ Testando URL:', testUrl)
    
    const base64 = await imageUrlToBase64(testUrl)
    
    console.log('✅ Conversão bem-sucedida!')
    console.log('📊 Tamanho do base64:', base64.length, 'caracteres')
    console.log('🔍 Primeiros 50 caracteres:', base64.substring(0, 50))
    
    // Verifica se é um base64 válido
    if (base64.startsWith('data:image')) {
      console.log('✅ Formato de base64 válido')
    } else {
      console.log('❌ Formato de base64 inválido')
    }
    
    return base64
  } catch (error) {
    console.error('❌ Erro na conversão:', error)
    throw error
  }
}

/**
 * Teste 4: Validar cálculo de splits
 */
export async function testSplitCalculation() {
  console.log('🧪 Teste 4: Validar cálculo de splits')
  
  const { calculatePaymentSplits } = await import('@/lib/payment-config')
  
  const totalAmount = 1000
  const storeWalletId = 'store-wallet-123'
  
  // Sem afiliado
  console.log('\n💰 Cenário 1: Sem afiliado')
  const split1 = calculatePaymentSplits(totalAmount, storeWalletId)
  console.log('Taxa da plataforma (8%):', split1.platformFee)
  console.log('Valor da loja:', split1.storeAmount)
  console.log('Splits:', split1.splits)
  
  // Com afiliado
  console.log('\n💰 Cenário 2: Com afiliado (10%)')
  const split2 = calculatePaymentSplits(totalAmount, storeWalletId, {
    walletId: 'affiliate-wallet-456',
    commissionPercentage: 10
  })
  console.log('Taxa da plataforma (8%):', split2.platformFee)
  console.log('Comissão do afiliado (10%):', split2.affiliateCommission)
  console.log('Valor da loja:', split2.storeAmount)
  console.log('Splits:', split2.splits)
  
  // Validações
  const total1 = split1.platformFee + split1.storeAmount
  const total2 = split2.platformFee + split2.affiliateCommission + split2.storeAmount
  
  console.log('\n✅ Validação Cenário 1:', total1 === totalAmount ? 'PASS' : 'FAIL')
  console.log('✅ Validação Cenário 2:', total2 === totalAmount ? 'PASS' : 'FAIL')
  
  return { split1, split2 }
}

/**
 * Teste 5: Validar estrutura de requisição
 */
export async function testRequestStructure() {
  console.log('🧪 Teste 5: Validar estrutura de requisição')
  
  // Simula a estrutura que deve ser enviada ao n8n
  const expectedStructure = {
    billingTypes: ['CREDIT_CARD', 'PIX'],
    chargeTypes: ['DETACHED', 'INSTALLMENT'],
    minutesToExpire: 15,
    externalReference: 'uuid-string',
    callback: {
      successUrl: 'string',
      cancelUrl: 'string',
      expiredUrl: 'string'
    },
    items: [
      {
        externalReference: 'string',
        description: 'string',
        imageBase64: 'string',
        name: 'string',
        quantity: 'number',
        value: 'number'
      }
    ],
    customerData: {
      name: 'string',
      cpfCnpj: 'string',
      email: 'string',
      phone: 'string',
      address: 'string',
      addressNumber: 'string',
      complement: 'string',
      province: 'string',
      postalCode: 'string',
      city: 'string'
    },
    installment: {
      maxInstallmentCount: 'number'
    },
    splits: [
      {
        walletId: 'string',
        percentageValue: 'number'
      }
    ],
    companyId: 'string',
    companyOrder: 'string',
    userId: 'string',
    productList: [
      {
        productId: 'string',
        quantity: 'number'
      }
    ]
  }
  
  console.log('📋 Estrutura esperada:')
  console.log(JSON.stringify(expectedStructure, null, 2))
  
  return expectedStructure
}

/**
 * Roda todos os testes
 */
export async function runAllTests() {
  console.log('🚀 Iniciando todos os testes...\n')
  
  const results = {
    imageConversion: null as any,
    splitCalculation: null as any,
    requestStructure: null as any,
    paymentWithoutAffiliate: null as any,
    paymentWithAffiliate: null as any
  }
  
  try {
    // Teste 3: Conversão de imagens
    results.imageConversion = await testImageConversion()
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Teste 4: Cálculo de splits
    results.splitCalculation = await testSplitCalculation()
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Teste 5: Estrutura de requisição
    results.requestStructure = await testRequestStructure()
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Teste 1: Pagamento sem afiliado
    results.paymentWithoutAffiliate = await testCreatePaymentWithoutAffiliate()
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Teste 2: Pagamento com afiliado
    results.paymentWithAffiliate = await testCreatePaymentWithAffiliate()
    console.log('\n' + '='.repeat(50) + '\n')
    
    console.log('✅ Todos os testes concluídos!')
    console.log('📊 Resultados:', results)
    
    return results
  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
    throw error
  }
}

// Exporta para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).n8nTests = {
    testCreatePaymentWithoutAffiliate,
    testCreatePaymentWithAffiliate,
    testImageConversion,
    testSplitCalculation,
    testRequestStructure,
    runAllTests
  }
  
  console.log('🧪 Testes n8n disponíveis no window.n8nTests')
  console.log('Para rodar: window.n8nTests.runAllTests()')
}
