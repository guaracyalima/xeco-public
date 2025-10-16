/**
 * Script para testar o sistema de analytics
 * Execute: npm run dev e acesse /test-analytics para testar
 */

import { analytics } from '@/services/analyticsService'
import { EventName } from '@/types/analytics'

export const testAnalytics = async () => {
  console.log('🧪 Testando sistema de analytics...')
  
  try {
    // Test 1: Basic event tracking
    console.log('1. Testando evento básico...')
    await analytics.trackEvent(EventName.PAGE_VIEW, {
      context: {
        page: '/test',
        pageTitle: 'Test Page'
      }
    })
    console.log('✅ Evento básico enviado')

    // Test 2: Product event
    console.log('2. Testando evento de produto...')
    await analytics.trackEvent(EventName.PRODUCT_VIEW, {
      productId: 'test-product-123',
      productName: 'Produto Teste',
      productPrice: 99.99,
      eventData: {
        category: 'test',
        value: 99.99,
        currency: 'BRL'
      }
    })
    console.log('✅ Evento de produto enviado')

    // Test 3: Search event
    console.log('3. Testando evento de busca...')
    await analytics.trackEvent(EventName.SEARCH, {
      eventData: {
        query: 'produto teste',
        resultsCount: 5,
        category: 'search'
      }
    })
    console.log('✅ Evento de busca enviado')

    // Test 4: Cart event
    console.log('4. Testando evento de carrinho...')
    await analytics.trackEvent(EventName.ADD_TO_CART, {
      productId: 'test-product-123',
      productName: 'Produto Teste',
      productPrice: 99.99,
      eventData: {
        quantity: 2,
        value: 199.98,
        currency: 'BRL',
        category: 'ecommerce'
      }
    })
    console.log('✅ Evento de carrinho enviado')

    // Test 5: Checkout event
    console.log('5. Testando evento de checkout...')
    await analytics.trackEvent(EventName.CHECKOUT_START, {
      cartTotal: 199.98,
      cartItemCount: 2,
      eventData: {
        value: 199.98,
        currency: 'BRL',
        category: 'ecommerce'
      }
    })
    console.log('✅ Evento de checkout enviado')

    console.log('🎉 Todos os testes de analytics concluídos com sucesso!')
    console.log('📊 Verifique o console do Google Analytics e o Firestore para confirmar os dados')

  } catch (error) {
    console.error('❌ Erro durante o teste de analytics:', error)
    throw error
  }
}

// Test component for development
export const AnalyticsTestComponent = () => {
  const runTests = async () => {
    try {
      await testAnalytics()
      alert('Testes de analytics concluídos! Verifique o console para detalhes.')
    } catch (error) {
      console.error('Erro nos testes:', error)
      alert('Erro nos testes de analytics. Verifique o console.')
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teste de Analytics</h1>
      <p className="mb-4 text-gray-600">
        Este componente testa o sistema de analytics. 
        Clique no botão para executar todos os eventos de teste.
      </p>
      <button
        onClick={runTests}
        className="w-full bg-coral-500 text-white px-4 py-2 rounded hover:bg-coral-600 transition-colors"
      >
        🧪 Executar Testes de Analytics
      </button>
      <div className="mt-4 text-sm text-gray-500">
        <p>Os eventos serão enviados para:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Google Analytics (console do navegador)</li>
          <li>Firebase Firestore (coleção user_events)</li>
        </ul>
      </div>
    </div>
  )
}