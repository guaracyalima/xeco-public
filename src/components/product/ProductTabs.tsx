'use client'

import { useState } from 'react'
import { Product } from '@/types'

interface ProductTabsProps {
  product: Product
}

export function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState('description')

  const tabs = [
    { id: 'description', label: 'Descrição' },
    { id: 'company', label: 'Sobre a Franquia' },
    { id: 'shipping', label: 'Entrega' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div className="prose prose-gray max-w-none">
            {product.description ? (
              <div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Informações do Produto</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Produto verificado pela plataforma Xuxum</li>
                    <li>• Vendido diretamente pela franquia {product.companyOwnerName}</li>
                    <li>• Localizado em {product.cidade}, {product.uf}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma descrição detalhada disponível para este produto.</p>
                <p className="mt-2 text-sm">Entre em contato com a franquia para mais informações.</p>
              </div>
            )}
          </div>
        )

      case 'company':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {product.companyOwnerName}
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Localização:</span>
                    <p className="text-gray-600">{product.cidade}, {product.uf}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Categoria:</span>
                    <p className="text-gray-600">Franquia verificada</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Por que escolher esta franquia?</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Franquia verificada na plataforma Xuxum
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Produtos com qualidade garantida
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Atendimento direto com o fornecedor
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Negociação facilitada via WhatsApp
                </li>
              </ul>
            </div>
          </div>
        )

      case 'shipping':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Informações de Entrega
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>Importante:</strong> As condições de entrega devem ser negociadas diretamente com a franquia.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Modalidades Possíveis</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-coral-500 rounded-full mr-3"></span>
                    Retirada no local
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-coral-500 rounded-full mr-3"></span>
                    Entrega local (consulte taxa)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-coral-500 rounded-full mr-3"></span>
                    Envio via transportadora
                  </li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Como Proceder</h4>
                <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                  <li>Clique em &quot;Entrar em contato&quot; acima</li>
                  <li>Negocie preço, quantidade e forma de entrega</li>
                  <li>Combine prazo e condições de pagamento</li>
                  <li>Finalize a compra diretamente com a franquia</li>
                </ol>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Dica do Xuxum</h4>
              <p className="text-green-800 text-sm">
                Sempre confirme disponibilidade, preço final e condições antes de fechar negócio. 
                Prefira pagamento na entrega quando possível.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-coral-500 text-coral-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  )
}