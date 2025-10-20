'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, User, MapPin, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CheckoutUserData } from '@/types/order'
import { useCheckoutAnalytics } from '@/hooks/useAnalytics'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (userData: CheckoutUserData) => Promise<void>
  totalAmount: number
  itemCount: number
  isLoading?: boolean
  existingData?: CheckoutUserData | null
  hasExistingCpf?: boolean
  error?: string | null
  onErrorClear?: () => void
}

export function CheckoutModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalAmount, 
  itemCount,
  isLoading = false,
  existingData = null,
  hasExistingCpf = false,
  error = null,
  onErrorClear
}: CheckoutModalProps) {
  const [formData, setFormData] = useState<CheckoutUserData>({
    cpf: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const { trackCheckoutStart, trackCheckoutProgress, trackPurchase } = useCheckoutAnalytics()

  // Pré-preenche dados quando existirem
  useEffect(() => {
    if (existingData) {
      setFormData(existingData)
    }
  }, [existingData])

  useEffect(() => {
    if (isOpen) {
      trackCheckoutStart(totalAmount, itemCount)
    }
  }, [isOpen, trackCheckoutStart, totalAmount, itemCount])

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validação CPF (formato básico) - apenas se não existir CPF salvo
    if (!hasExistingCpf) {
      if (!formData.cpf) {
        newErrors.cpf = 'CPF é obrigatório'
      } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(formData.cpf)) {
        newErrors.cpf = 'CPF deve ter o formato 000.000.000-00'
      }
    }

    // Validação endereço
    if (!formData.address.street) newErrors.street = 'Rua é obrigatória'
    if (!formData.address.number) newErrors.number = 'Número é obrigatório'
    if (!formData.address.neighborhood) newErrors.neighborhood = 'Bairro é obrigatório'
    if (!formData.address.city) newErrors.city = 'Cidade é obrigatória'
    if (!formData.address.state) newErrors.state = 'Estado é obrigatório'
    if (!formData.address.zipCode) {
      newErrors.zipCode = 'CEP é obrigatório'
    } else if (!/^\d{5}-?\d{3}$/.test(formData.address.zipCode)) {
      newErrors.zipCode = 'CEP deve ter o formato 00000-000'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      trackCheckoutProgress(2, 'form_submission', {
        totalAmount,
        itemCount,
        hasAddress: !!formData.address.street,
        hasCpf: !!formData.cpf
      })

      await onConfirm(formData)

      // Track successful purchase (will be called after order creation)
      trackPurchase({
        orderId: 'pending', // Will be updated by parent component
        total: totalAmount,
        itemCount,
        paymentMethod: 'asaas'
      })

    } catch (error) {
      console.error('Erro ao finalizar compra:', error)
      // Erro será exibido através da prop error passada pelo pai
    }
  }

  const handleInputChange = (field: string, value: string) => {
    // Limpa erro quando usuário começa a digitar
    if (error && onErrorClear) {
      onErrorClear()
    }

    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '')
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Remove erro quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Finalizar Compra
              </h2>
              <p className="text-sm text-gray-500">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'} • R$ {totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Exibir erro se houver */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-red-800 font-medium mb-1">
                    Erro ao processar pagamento
                  </p>
                  <p className="text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* Dados Pessoais */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Dados Pessoais</h3>
            </div>
            
            <div>
              <Input
                label={hasExistingCpf ? "CPF (não editável)" : "CPF *"}
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => !hasExistingCpf && handleInputChange('cpf', formatCPF(e.target.value))}
                error={errors.cpf}
                maxLength={14}
                disabled={isLoading || hasExistingCpf}
                readOnly={hasExistingCpf}
              />
              {hasExistingCpf && (
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <p className="text-xs text-green-600">CPF já cadastrado em sua conta</p>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Endereço</h3>
            </div>
            
            <div className="space-y-3">
              <Input
                label="CEP *"
                placeholder="00000-000"
                value={formData.address.zipCode}
                onChange={(e) => handleInputChange('address.zipCode', formatCEP(e.target.value))}
                error={errors.zipCode}
                maxLength={9}
                disabled={isLoading}
              />
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input
                    label="Rua *"
                    placeholder="Nome da rua"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    error={errors.street}
                    disabled={isLoading}
                  />
                </div>
                <Input
                  label="Número *"
                  placeholder="123"
                  value={formData.address.number}
                  onChange={(e) => handleInputChange('address.number', e.target.value)}
                  error={errors.number}
                  disabled={isLoading}
                />
              </div>
              
              <Input
                label="Complemento"
                placeholder="Apto, bloco, etc."
                value={formData.address.complement}
                onChange={(e) => handleInputChange('address.complement', e.target.value)}
                disabled={isLoading}
              />
              
              <Input
                label="Bairro *"
                placeholder="Nome do bairro"
                value={formData.address.neighborhood}
                onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
                error={errors.neighborhood}
                disabled={isLoading}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cidade *"
                  placeholder="Nome da cidade"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  error={errors.city}
                  disabled={isLoading}
                />
                <Input
                  label="Estado *"
                  placeholder="SP"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value.toUpperCase())}
                  error={errors.state}
                  maxLength={2}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-1">
                  Processo Seguro
                </p>
                <p className="text-blue-700">
                  Seus dados são protegidos e utilizados apenas para processar sua compra. 
                  Você será redirecionado para uma página segura de pagamento.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar R$ {totalAmount.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}