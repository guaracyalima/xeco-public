'use client'

import React from 'react'
import { X } from 'lucide-react'

interface CheckoutIframeModalProps {
  checkoutUrl: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Modal de fallback quando popup é bloqueado
 * Asaas não permite iframe (CSP), então este modal só mostra um link direto
 */
export default function CheckoutIframeModal({
  checkoutUrl,
  isOpen,
  onClose,
}: CheckoutIframeModalProps) {
  
  if (!isOpen || !checkoutUrl) {
    return null
  }

  const handleOpenPayment = () => {
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Conteúdo */}
        <div className="text-center space-y-6">
          
          {/* Ícone */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>

          {/* Título */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bloqueador de Popup Detectado
            </h2>
            <p className="text-gray-600">
              Seu navegador bloqueou a abertura automática. Clique no botão abaixo para acessar o pagamento.
            </p>
          </div>

          {/* Botão Principal */}
          <button
            onClick={handleOpenPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Abrir Página de Pagamento
          </button>

          {/* Link Alternativo */}
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-600 hover:underline"
          >
            Ou clique aqui se o botão não funcionar
          </a>

          {/* Informações de Segurança */}
          <p className="text-xs text-gray-500 mt-4">
            🔒 Pagamento processado de forma segura pela Asaas
          </p>
        </div>

      </div>
    </div>
  )
}
