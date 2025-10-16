'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CompanyUrlService } from '@/lib/company-url-service'
import { CompanyUrl } from '@/types'

export default function TestCompanyUrlPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [allUrls, setAllUrls] = useState<CompanyUrl[]>([])

  // Teste de validação de parâmetros
  const testUrlValidation = () => {
    const testCases = [
      { cityState: 'sao-paulo-sp', slug: 'padaria-do-joao' },
      { cityState: 'rio-de-janeiro-rj', slug: 'restaurante-sabor-arte' },
      { cityState: 'belo-horizonte-mg', slug: 'mercado-central' },
      { cityState: 'invalid', slug: 'test' },
      { cityState: 'cidade-sp', slug: 'invalid-slug!' }
    ]

    let results = '🧪 Teste de Validação de URLs:\n\n'
    
    testCases.forEach(({ cityState, slug }) => {
      const validation = CompanyUrlService.validateUrlParams(cityState, slug)
      results += `URL: ${cityState}/${slug}\n`
      if (validation) {
        results += `✅ Válida - Cidade: ${validation.city}, Estado: ${validation.state}, Slug: ${validation.slug}\n\n`
      } else {
        results += `❌ Inválida\n\n`
      }
    })

    setResult(results)
  }

  // Teste de busca por slug
  const testSearchBySlug = async () => {
    setLoading(true)
    try {
      // Teste com dados fictícios - você pode ajustar conforme seus dados reais
      const testSlug = 'padaria-do-joao'
      const testCity = 'sao-paulo'
      const testState = 'sp'

      const companyUrl = await CompanyUrlService.getCompanyUrlBySlug(testSlug, testCity, testState)
      
      if (companyUrl) {
        setResult(`✅ URL encontrada:
ID: ${companyUrl.id}
Company ID: ${companyUrl.companyId}
Slug: ${companyUrl.slug}
Localização: ${companyUrl.city}-${companyUrl.state}
URL Completa: ${companyUrl.fullUrl}
Ativa: ${companyUrl.isActive}
Criada em: ${companyUrl.createdAt.toLocaleString()}`)
      } else {
        setResult(`❌ URL não encontrada para: ${testCity}-${testState}/${testSlug}`)
      }
    } catch (error) {
      setResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Teste de busca por company ID
  const testSearchByCompanyId = async () => {
    setLoading(true)
    try {
      // Use um ID de empresa real do seu banco
      const testCompanyId = 'test-company-id' // Substitua por um ID real
      
      const companyUrl = await CompanyUrlService.getCompanyUrlByCompanyId(testCompanyId)
      
      if (companyUrl) {
        setResult(`✅ URL encontrada para empresa ${testCompanyId}:
Slug: ${companyUrl.slug}
Localização: ${companyUrl.city}-${companyUrl.state}
URL Completa: ${CompanyUrlService.generateFullUrl(companyUrl)}`)
      } else {
        setResult(`❌ URL não encontrada para empresa: ${testCompanyId}`)
      }
    } catch (error) {
      setResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Buscar todas as URLs cadastradas
  const getAllUrls = async () => {
    setLoading(true)
    try {
      const urls = await CompanyUrlService.getAllCompanyUrls(20)
      setAllUrls(urls)
      setResult(`✅ Encontradas ${urls.length} URLs personalizadas cadastradas`)
    } catch (error) {
      setResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Teste de geração de URL completa
  const testFullUrlGeneration = () => {
    const mockCompanyUrl: CompanyUrl = {
      id: 'test-id',
      companyId: 'company-123',
      slug: 'padaria-do-joao',
      city: 'sao-paulo',
      state: 'sp',
      fullUrl: '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const fullUrl = CompanyUrlService.generateFullUrl(mockCompanyUrl)
    setResult(`🔗 URL Gerada: ${fullUrl}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        🌐 Teste do Sistema de URLs Personalizadas
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Funcionalidades de Teste
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button
            onClick={testUrlValidation}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
          >
            🔍 Validar URLs
          </Button>

          <Button
            onClick={testSearchBySlug}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg"
          >
            {loading ? 'Buscando...' : '🎯 Buscar por Slug'}
          </Button>

          <Button
            onClick={testSearchByCompanyId}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg"
          >
            {loading ? 'Buscando...' : '🏢 Buscar por Empresa'}
          </Button>

          <Button
            onClick={getAllUrls}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg"
          >
            {loading ? 'Carregando...' : '📋 Listar Todas'}
          </Button>

          <Button
            onClick={testFullUrlGeneration}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg"
          >
            🔗 Gerar URL
          </Button>
        </div>
      </div>

      {/* Results Area */}
      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            📋 Resultado do Teste
          </h3>
          <pre className="bg-white p-4 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}

      {/* URLs List */}
      {allUrls.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            🗂️ URLs Cadastradas ({allUrls.length})
          </h3>
          <div className="space-y-4">
            {allUrls.map((url) => (
              <div key={url.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {url.city}-{url.state}/{url.slug}
                    </h4>
                    <p className="text-sm text-gray-600">
                      <strong>Company ID:</strong> {url.companyId}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>URL Completa:</strong> {url.fullUrl}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      url.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {url.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Criada: {url.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a
                    href={`/${url.city}-${url.state}/${url.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    🔗 Testar URL
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">
          📚 Como Funciona o Sistema
        </h3>
        <div className="text-blue-700 space-y-2">
          <p><strong>1. Estrutura da URL:</strong> /{'{cidade-uf}'}/{'{slug-empresa}'}</p>
          <p><strong>2. Validação:</strong> Verifica formato da cidade-estado e slug</p>
          <p><strong>3. Busca:</strong> Localiza a empresa na collection company_urls</p>
          <p><strong>4. Renderização:</strong> Mostra a página da empresa com URL personalizada</p>
        </div>
      </div>

      {/* Integration Status */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-green-800">
          ✅ Status da Implementação
        </h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Interface CompanyUrl implementada</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>CompanyUrlService com todas as funções</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Rota dinâmica [cityState]/[slug] criada</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Validação de URLs implementada</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Variável de ambiente configurável</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            <span>Página de teste funcional</span>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-yellow-800">
          💡 Exemplos de URLs Personalizadas
        </h3>
        <div className="text-yellow-700 space-y-1 text-sm">
          <p>• <code>xeco.com.br/sao-paulo-sp/padaria-do-joao</code></p>
          <p>• <code>xeco.com.br/rio-de-janeiro-rj/restaurante-sabor-arte</code></p>
          <p>• <code>xeco.com.br/belo-horizonte-mg/mercado-central</code></p>
          <p>• <code>xeco.com.br/curitiba-pr/cafe-cia</code></p>
        </div>
      </div>
    </div>
  )
}