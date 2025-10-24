'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Detectar se é iOS
    const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Detectar se já está instalado (standalone mode)
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true
    setIsStandalone(isInStandalone)

    // Se já está instalado, não mostrar prompt
    if (isInStandalone) {
      console.log('📱 PWA já instalada')
      return
    }

    // Verificar se já foi recusado antes
    const wasPromptDismissed = localStorage.getItem('pwa-prompt-dismissed')
    const dismissedDate = wasPromptDismissed ? new Date(wasPromptDismissed) : null
    const daysSinceDismissed = dismissedDate 
      ? Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Se foi recusado há menos de 7 dias, não mostrar
    if (dismissedDate && daysSinceDismissed < 7) {
      console.log(`📱 PWA prompt recusado há ${daysSinceDismissed} dias, aguardando...`)
      return
    }

    // Para iOS, mostrar instruções após delay
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        console.log('📱 Mostrando instruções iOS')
        setShowPrompt(true)
      }, 5000) // Mostrar após 5 segundos

      return () => clearTimeout(timer)
    }

    // Para Android/Chrome, capturar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      console.log('📱 beforeinstallprompt capturado')
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      // Mostrar prompt após delay (para não incomodar imediatamente)
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Mostrar após 5 segundos
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Detectar quando o app foi instalado
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA instalada com sucesso!')
      setShowPrompt(false)
      setDeferredPrompt(null)
      
      // Registrar analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'app_install_prompt', {
          outcome: 'accepted'
        })
      }
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Se é iOS, mostrar instruções
      if (isIOS) {
        setShowIOSInstructions(true)
      }
      return
    }

    console.log('📱 Mostrando prompt de instalação')
    
    try {
      // Mostrar prompt nativo do browser
      await deferredPrompt.prompt()
      
      // Aguardar escolha do usuário
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`📱 Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`)
      
      // Registrar analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'app_install_prompt', {
          outcome
        })
      }

      if (outcome === 'accepted') {
        setShowPrompt(false)
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error('❌ Erro ao mostrar prompt de instalação:', error)
    }
  }

  const handleDismiss = () => {
    console.log('📱 Usuário dispensou prompt de instalação')
    setShowPrompt(false)
    
    // Salvar data de recusa
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString())
    
    // Registrar analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'app_install_prompt', {
        outcome: 'dismissed'
      })
    }
  }

  // Não mostrar se já está instalado
  if (isStandalone) {
    return null
  }

  // Não mostrar se o prompt não deve ser exibido
  if (!showPrompt) {
    return null
  }

  // Instruções para iOS
  if (isIOS && showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-coral-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Instalar Xeco no iOS
                </h3>
                <p className="text-sm text-gray-500">iPhone/iPad</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-sm text-gray-700">
                  Toque no botão <strong>Compartilhar</strong> <span className="inline-block">⬆️</span> no Safari
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <p className="text-sm text-gray-700">
                  Role para baixo e toque em <strong>"Adicionar à Tela Início"</strong>
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <p className="text-sm text-gray-700">
                  Toque em <strong>"Adicionar"</strong> no canto superior direito
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              O ícone do Xeco aparecerá na sua tela inicial
            </p>
          </div>

          <button
            onClick={() => setShowIOSInstructions(false)}
            className="w-full mt-4 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    )
  }

  // Prompt principal (Android/Chrome)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-coral-500 to-coral-600 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-coral-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Instalar Xeco</h3>
              <p className="text-sm text-coral-50">Acesso rápido na tela inicial</p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-red-200 hover:text-red-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          <ul className="space-y-2 mb-4 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-coral-500 rounded-full"></span>
              Acesso instantâneo sem abrir o navegador
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-coral-500 rounded-full"></span>
              Funciona mesmo sem internet
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-coral-500 rounded-full"></span>
              Notificações de ofertas e novidades
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-coral-500 rounded-full"></span>
              Experiência otimizada para mobile
            </li>
          </ul>

          {/* Botões */}
          <div className="flex gap-2">
            {isIOS ? (
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                Ver instruções
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                disabled={!deferredPrompt}
                className="flex-1 px-4 py-3 bg-coral-600 text-white rounded-lg font-medium hover:bg-coral-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Instalar agora
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Agora não
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-3">
            Você pode instalar quando quiser acessando o menu do navegador
          </p>
        </div>
      </div>
    </div>
  )
}
