'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmAffiliateInvitation } from '@/lib/affiliate-service'
import { AffiliateConfirmRequest } from '@/types'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, UserPlus, Copy, Eye, EyeOff } from 'lucide-react'

interface AffiliateConfirmFormProps {
  initialToken?: string
  initialEmail?: string
}

export function AffiliateConfirmForm({ initialToken = '', initialEmail = '' }: AffiliateConfirmFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<AffiliateConfirmRequest>({
    inviteToken: initialToken,
    email: initialEmail
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: any
  } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.inviteToken.trim() || !formData.email.trim()) {
      setResult({
        success: false,
        message: 'Por favor, preencha todos os campos.'
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setResult({
        success: false,
        message: 'Por favor, insira um email válido.'
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await confirmAffiliateInvitation(formData)
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro inesperado. Tente novamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AffiliateConfirmRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear result when user types
    if (result) {
      setResult(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  if (result?.success) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Parabéns! 🎉
          </h2>
          <p className="text-gray-600">
            {result.message}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-3">
            Informações do seu cadastro:
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-green-700">Empresa:</span>
              <span className="font-medium text-green-900">
                {result.data?.companyName}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-green-700">Seu código de afiliado:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-green-900 bg-green-100 px-2 py-1 rounded">
                  {result.data?.inviteCode}
                </span>
                <button
                  onClick={() => copyToClipboard(result.data?.inviteCode)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="Copiar código"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {result.data?.isNewUser && result.data?.temporaryPassword && (
              <div className="border-t border-green-200 pt-3 mt-3">
                <div className="text-green-700 mb-2">
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  Conta criada com sucesso!
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Senha temporária:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-green-900 bg-green-100 px-2 py-1 rounded">
                      {showPassword ? result.data.temporaryPassword : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(result.data?.temporaryPassword)}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title="Copiar senha"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Um email de redefinição de senha foi enviado para {formData.email}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleGoToLogin}
            className="w-full"
          >
            {result.data?.isNewUser ? 'Fazer Login' : 'Acessar Conta'}
          </Button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <UserPlus className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Confirmar Convite de Afiliado
        </h1>
        <p className="text-gray-600">
          Digite o token que você recebeu e seu email para confirmar sua participação como afiliado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inviteToken" className="block text-sm font-medium text-gray-700 mb-1">
            Token do Convite *
          </label>
          <input
            type="text"
            id="inviteToken"
            value={formData.inviteToken}
            onChange={(e) => handleInputChange('inviteToken', e.target.value)}
            placeholder="Ex: ABC123XYZ"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Seu Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="seu.email@exemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            required
          />
        </div>

        {result && !result.success && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">
              {result.message}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Confirmando...' : 'Confirmar Convite'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Não tem um convite?{' '}
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Voltar ao início
          </button>
        </p>
      </div>
    </div>
  )
}