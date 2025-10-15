'use client'

import { Product } from '@/types'
import { AlertTriangle, ShoppingCart, X } from 'lucide-react'

interface CompanyConflictModalProps {
  isOpen: boolean
  onClose: () => void
  onClearAndAdd: () => void
  currentCompanyName: string | null
  newProductCompanyName: string | null
  newProduct: Product
}

export function CompanyConflictModal({
  isOpen,
  onClose,
  onClearAndAdd,
  currentCompanyName,
  newProductCompanyName,
  newProduct
}: CompanyConflictModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Diferentes empresas no carrinho
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-3">
              No momento, a plataforma só aceita compras de uma mesma empresa por vez.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Carrinho atual:</span>
                <span className="font-medium text-gray-900">{currentCompanyName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Produto selecionado:</span>
                <span className="font-medium text-gray-900">{newProductCompanyName}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <ShoppingCart className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Produto a ser adicionado:</h4>
                <p className="text-sm text-blue-800">{newProduct.name}</p>
                <p className="text-sm text-blue-600">
                  R$ {newProduct.salePrice.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Você pode limpar o carrinho atual e começar uma nova compra com este produto, 
            ou cancelar e continuar com os produtos atuais.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onClearAndAdd}
            className="flex-1 px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors font-medium"
          >
            Limpar carrinho e adicionar
          </button>
        </div>
      </div>
    </div>
  )
}