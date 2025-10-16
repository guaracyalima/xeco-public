'use client'

import { useState } from 'react'
import { createTestAffiliateInvitation, createMultipleTestInvitations } from '@/scripts/create-test-invitations'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CheckCircle, XCircle, Database, Link as LinkIcon, Mail } from 'lucide-react'

export default function TestAffiliateDataPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleCreateSingleTest = async () => {
    setIsLoading(true)
    setResults(null)
    
    try {
      const result = await createTestAffiliateInvitation()
      setResults(result)
    } catch (error) {
      setResults({ success: false, error: 'Erro inesperado' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMultipleTests = async () => {
    setIsLoading(true)
    setResults(null)
    
    try {
      const result = await createMultipleTestInvitations()
      setResults(result)
    } catch (error) {
      setResults({ success: false, error: 'Erro inesperado' })
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
              <Database className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Criar Dados de Teste - Sistema de Afiliados
              </h1>
              <p className="text-gray-600">
                Use esta página para criar convites de teste no Firestore
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <Button
                onClick={handleCreateSingleTest}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Criando...' : 'Criar Convite de Teste Único'}
              </Button>

              <Button
                onClick={handleCreateMultipleTests}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Criando...' : 'Criar Múltiplos Convites (Válido, Expirado, Aceito)'}
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
                    {results.success ? 'Dados criados com sucesso!' : 'Erro ao criar dados'}
                  </h3>
                </div>

                {results.success && results.testUrl && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">URL de teste:</span>
                    </div>
                    <div className="bg-white rounded p-2 font-mono text-xs break-all">
                      <a 
                        href={results.testUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {results.testUrl}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">Email de teste:</span>
                      <code className="bg-green-100 px-2 py-1 rounded text-green-800">
                        {results.testEmail}
                      </code>
                    </div>
                  </div>
                )}

                {results.success && results.invitations && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-800">Convites criados:</h4>
                    <div className="space-y-2">
                      {results.invitations.map((inv: any, index: number) => (
                        <div key={index} className="bg-white rounded p-3 border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{inv.email}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                              inv.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-gray-600 break-all">
                            <a href={inv.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {inv.url}
                            </a>
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
              <h3 className="font-semibold text-gray-800 mb-3">ℹ️ Instruções:</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Clique em um dos botões acima para criar os dados no Firestore</li>
                <li>2. Copie a URL de teste gerada</li>
                <li>3. Acesse a URL em uma nova aba</li>
                <li>4. Digite o email de teste correspondente</li>
                <li>5. Teste o fluxo completo de confirmação</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}