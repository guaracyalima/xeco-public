'use client'

import { useState, useEffect } from 'react'
import { X, BarChart3, Shield, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAnalyticsContext } from '@/contexts/AnalyticsContext'

export function AnalyticsConsentBanner() {
  const { hasConsent, setConsent } = useAnalyticsContext()
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Marca que está no cliente
    setIsClient(true)
    
    // Only run on client side
    if (typeof window === 'undefined') return

    // Verifica se já tem decisão sobre consentimento
    const savedConsent = localStorage.getItem('xeco_analytics_consent')
    if (savedConsent === null) {
      // Mostra banner após um pequeno delay para melhor UX
      setTimeout(() => setShowBanner(true), 2000)
    }
  }, [])

  const handleAccept = () => {
    setConsent(true)
    setShowBanner(false)
  }

  const handleReject = () => {
    setConsent(false)
    setShowBanner(false)
  }

  const handleSettings = () => {
    setShowDetails(!showDetails)
  }

  if (!isClient || !showBanner || hasConsent !== false) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Ajude-nos a melhorar sua experiência
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Usamos analytics para entender como você navega e melhorar nossos serviços. 
              Seus dados são tratados com total privacidade.
            </p>

            {showDetails && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-600 space-y-2">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Dados coletados:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Páginas visitadas e tempo de navegação</li>
                      <li>Produtos visualizados e pesquisas realizadas</li>
                      <li>Tipo de dispositivo e navegador (anônimo)</li>
                      <li>Localização aproximada (cidade/estado)</li>
                      <li>Interações com botões e formulários</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Como usamos:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Melhorar navegação e funcionalidades</li>
                      <li>Personalizar sua experiência</li>
                      <li>Entender preferências de produtos</li>
                      <li>Otimizar desempenho da plataforma</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Seus direitos:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Dados nunca vendidos para terceiros</li>
                      <li>Pode revogar consentimento a qualquer momento</li>
                      <li>Opção de navegação anônima disponível</li>
                      <li>Conformidade total com LGPD</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={handleAccept}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                Aceitar Analytics
              </Button>
              
              <Button 
                onClick={handleReject}
                variant="secondary"
                size="sm"
              >
                Apenas Essenciais
              </Button>
              
              <button
                onClick={handleSettings}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Settings className="h-3 w-3" />
                <span>{showDetails ? 'Ocultar' : 'Detalhes'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}