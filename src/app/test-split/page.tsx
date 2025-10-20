'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { calculatePaymentSplits, PLATFORM_FEE_PERCENTAGE } from '@/lib/payment-config'

export default function TestSplitPage() {
  const [testResults, setTestResults] = useState<any>(null)

  const runSplitTests = () => {
    console.log('🧪 Testando cálculos de split...')
    
    // Teste 1: Sem afiliado
    const test1 = calculatePaymentSplits(
      100, // R$ 100
      'wallet_loja_123'
    )
    
    // Teste 2: Com afiliado 5%
    const test2 = calculatePaymentSplits(
      100, // R$ 100
      'wallet_loja_123',
      {
        walletId: 'wallet_afiliado_456',
        commissionPercentage: 5
      }
    )
    
    // Teste 3: Com afiliado 10%
    const test3 = calculatePaymentSplits(
      500, // R$ 500
      'wallet_loja_789',
      {
        walletId: 'wallet_afiliado_999',
        commissionPercentage: 10
      }
    )

    const results = {
      platformFee: PLATFORM_FEE_PERCENTAGE,
      test1: {
        description: 'R$ 100 sem afiliado',
        ...test1
      },
      test2: {
        description: 'R$ 100 com afiliado 5%',
        ...test2
      },
      test3: {
        description: 'R$ 500 com afiliado 10%',
        ...test3
      }
    }

    console.log('📊 Resultados dos testes:', results)
    setTestResults(results)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Teste de Split de Pagamento</h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Taxa da Plataforma</h3>
            <p className="text-blue-700">
              {PLATFORM_FEE_PERCENTAGE}% sobre o valor total do pedido
            </p>
          </div>

          <Button onClick={runSplitTests} className="w-full">
            Executar Testes de Split
          </Button>

          {testResults && (
            <div className="space-y-4">
              {Object.entries(testResults).map(([key, value]: [string, any]) => {
                if (key === 'platformFee') return null
                
                return (
                  <div key={key} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{value.description}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Taxa da Plataforma:</strong> R$ {value.platformFee.toFixed(2)}</p>
                        <p><strong>Comissão do Afiliado:</strong> R$ {value.affiliateCommission.toFixed(2)}</p>
                        <p><strong>Valor para a Loja:</strong> R$ {value.storeAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p><strong>Splits para Asaas:</strong></p>
                        {value.splits.length > 0 ? (
                          value.splits.map((split: any, index: number) => (
                            <p key={index} className="text-xs bg-gray-100 p-1 rounded mt-1">
                              {split.walletId}: {split.percentageValue}%
                            </p>
                          ))
                        ) : (
                          <p className="text-gray-500 text-xs">Nenhum split adicional</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Como Funciona</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Plataforma sempre recebe {PLATFORM_FEE_PERCENTAGE}% do total</li>
              <li>• Se houver afiliado, ele recebe sua porcentagem do total</li>
              <li>• A loja recebe o restante (total - plataforma - afiliado)</li>
              <li>• O Asaas recebe apenas os splits dos afiliados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}