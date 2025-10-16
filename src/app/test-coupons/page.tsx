'use client'

import { useState } from 'react'
import { createTestCoupons, createTestAffiliate } from '@/scripts/create-test-coupons'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CheckCircle, XCircle, Tag, UserCheck, Percent, DollarSign } from 'lucide-react'

export default function TestCouponsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleCreateCoupons = async () => {
    setIsLoading(true)
    setResults(null)
    
    try {
      const result = await createTestCoupons()
      setResults(result)
    } catch (error) {
      setResults({ success: false, error: 'Erro inesperado' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAffiliate = async () => {
    setIsLoading(true)
    
    try {
      const result = await createTestAffiliate()
      if (result.success) {
        alert(`✅ Afiliado criado! ID: ${result.affiliateId}`)
      } else {
        alert('❌ Erro ao criar afiliado')
      }
    } catch (error) {
      alert('❌ Erro inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <Tag className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Criar Cupons de Teste
              </h1>
              <p className="text-gray-600">
                Use esta página para criar cupons e afiliados de teste no Firestore
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <Button
                onClick={handleCreateAffiliate}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Criando...' : 'Criar Afiliado de Teste'}
              </Button>

              <Button
                onClick={handleCreateCoupons}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Criando...' : 'Criar Cupons de Teste'}
              </Button>
            </div>

            {results && (
              <div className={`border rounded-lg p-4 ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {results.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className={`font-semibold ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                    {results.success ? 'Cupons criados com sucesso!' : 'Erro ao criar cupons'}
                  </h3>
                </div>

                {results.success && results.coupons && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-800">Cupons criados:</h4>
                    <div className="space-y-2">
                      {results.coupons.map((coupon: any, index: number) => (
                        <div key={index} className="bg-white rounded p-3 border flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {coupon.type === 'AFFILIATE' ? (
                                <UserCheck className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Tag className="w-4 h-4 text-green-500" />
                              )}
                              <span className="font-mono font-bold">
                                {coupon.code}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              coupon.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {coupon.active ? 'ATIVO' : 'INATIVO'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              coupon.type === 'AFFILIATE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {coupon.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!results.success && (
                  <p className="text-red-700 text-sm">
                    {typeof results.error === 'string' ? results.error : 'Erro desconhecido'}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">🧪 Cupons de Teste Criados:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-500" />
                  <code className="bg-gray-200 px-2 py-1 rounded">SAVE10</code>
                  <span className="text-gray-600">- 10% de desconto (empresa)</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <code className="bg-gray-200 px-2 py-1 rounded">FIXED20</code>
                  <span className="text-gray-600">- R$ 20 de desconto (empresa)</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <code className="bg-gray-200 px-2 py-1 rounded">AFILIADO15</code>
                  <span className="text-gray-600">- 15% de desconto (afiliado)</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <code className="bg-gray-200 px-2 py-1 rounded">EXPIRED</code>
                  <span className="text-gray-600">- Cupom expirado (teste)</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <code className="bg-gray-200 px-2 py-1 rounded">INACTIVE</code>
                  <span className="text-gray-600">- Cupom inativo (teste)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Importante:</h3>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. Primeiro crie o afiliado de teste</li>
                <li>2. Anote o ID do afiliado retornado</li>
                <li>3. Edite o script para usar o ID real do afiliado</li>
                <li>4. Use o ID real da empresa dos produtos no carrinho</li>
                <li>5. Depois crie os cupons de teste</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}