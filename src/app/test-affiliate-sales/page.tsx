'use client'

import { useState } from 'react'
import { createAffiliateSale, updateAffiliateSaleStatus, calculateCommission } from '@/lib/affiliate-sales-service'
import { Button } from '@/components/ui/Button'

export default function TestAffiliateSalesPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testCreateAffiliateSale = async () => {
    setLoading(true)
    try {
      // Mock affiliate data
      const mockAffiliate = {
        id: 'test-affiliate-id',
        company_relationed: 'test-company-id',
        commissionRate: 0.1 // 10%
      }

      const result = await createAffiliateSale(
        mockAffiliate as any,
        'test-order-123',
        'test@example.com',
        100.00,
        'AFFILIATE10'
      )

      setResult(`✅ Affiliate Sale Created: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testCommissionCalculation = () => {
    const orderValue = 250.00
    const commissionRate = 0.15 // 15%
    const commission = calculateCommission(orderValue, commissionRate)
    
    setResult(`💰 Commission Calculation:
Order Value: R$ ${orderValue.toFixed(2)}
Commission Rate: ${(commissionRate * 100)}%
Commission Value: R$ ${commission.toFixed(2)}`)
  }

  const testUpdateSaleStatus = async () => {
    setLoading(true)
    try {
      // This would normally use a real order ID
      const result = await updateAffiliateSaleStatus(
        'asaas-order-456',
        'CONFIRMED',
        'PAID'
      )

      setResult(`🔄 Status Update: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        🔍 Teste do Sistema de Vendas de Afiliados
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Funcionalidades de Teste
        </h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Button
            onClick={testCreateAffiliateSale}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
          >
            {loading ? 'Criando...' : '📊 Criar Venda de Afiliado'}
          </Button>

          <Button
            onClick={testCommissionCalculation}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg"
          >
            💰 Calcular Comissão
          </Button>

          <Button
            onClick={testUpdateSaleStatus}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg"
          >
            {loading ? 'Atualizando...' : '🔄 Atualizar Status'}
          </Button>
        </div>
      </div>

      {/* Results Area */}
      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            📋 Resultado do Teste
          </h3>
          <pre className="bg-white p-4 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}

      {/* Documentation */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">
          📚 Como Funciona o Sistema
        </h3>
        <div className="text-blue-700 space-y-2">
          <p><strong>1. Criação de Venda:</strong> Quando um cliente usa um cupom de afiliado, uma venda é automaticamente registrada.</p>
          <p><strong>2. Cálculo de Comissão:</strong> A comissão é calculada baseada na taxa do afiliado e valor do pedido.</p>
          <p><strong>3. Atualização de Status:</strong> O status da venda e pagamento são atualizados conforme o processamento.</p>
          <p><strong>4. Rastreamento:</strong> Todas as vendas ficam registradas para relatórios e pagamentos futuros.</p>
        </div>
      </div>

      {/* Integration Status */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-green-800">
          ✅ Status da Integração
        </h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Sistema de rastreamento de vendas implementado</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Integração com checkout configurada</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Cálculo automático de comissões funcionando</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Sistema de cupons de afiliado integrado</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
            <span>Webhooks de pagamento (próximo passo)</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
            <span>Dashboard de afiliados (futuro)</span>
          </div>
        </div>
      </div>
    </div>
  )
}