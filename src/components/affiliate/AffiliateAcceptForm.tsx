'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmAffiliateInvitation } from '@/lib/affiliate-service'
import { AffiliateConfirmRequest } from '@/types'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, UserPlus, Copy, Gift, PartyPopper, Star } from 'lucide-react'

interface AffiliateAcceptFormProps {
  initialToken?: string
}

export function AffiliateAcceptForm({ initialToken = '' }: AffiliateAcceptFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<AffiliateConfirmRequest>({
    inviteToken: initialToken,
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: any
  } | null>(null)

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
      <div className="max-w-lg mx-auto">
        {/* Celebration Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-lg p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex justify-center items-center gap-2 mb-3">
              <PartyPopper className="w-8 h-8" />
              <Gift className="w-6 h-6" />
              <Star className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">🎉 PARABÉNS! 🎉</h1>
            <p className="text-green-100 text-lg">
              Você agora é um afiliado oficial!
            </p>
          </div>
        </div>

        {/* Success Content */}
        <div className="bg-white rounded-b-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo ao time! 🚀
            </h2>
            <p className="text-gray-600">
              {result.message}
            </p>
          </div>

          {/* Store Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">
                  {result.data?.storeName}
                </h3>
                <p className="text-blue-700 text-sm">Sua nova parceria</p>
              </div>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Seu código de afiliado:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded text-lg">
                    {result.data?.inviteCode}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.data?.inviteCode)}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                    title="Copiar código"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* New User Info */}
          {result.data?.isNewUser && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-800 mb-2">
                    🔐 Conta criada com sucesso!
                  </h3>
                  <div className="space-y-2 text-sm text-yellow-700">
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Senha:</strong> Mudar123#</p>
                    <div className="bg-yellow-100 rounded p-2 mt-3">
                      <p className="text-xs">
                        ⚠️ <strong>Importante:</strong> Você será solicitado a alterar sua senha no primeiro login por segurança.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Seus benefícios como afiliado:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Ganhe comissão em cada venda realizada
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Materiais de divulgação exclusivos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Acompanhe suas vendas em tempo real
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Suporte dedicado para afiliados
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoToLogin}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {result.data?.isNewUser ? 'Fazer Primeiro Login' : 'Acessar Minha Conta'}
            </Button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full text-gray-600 hover:text-gray-800 transition-colors text-sm py-2"
            >
              Explorar a plataforma
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Aceitar Convite de Afiliado
        </h1>
        <p className="text-gray-600">
          Você foi convidado para ser um afiliado! Digite seu email para confirmar sua participação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {initialToken && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token do Convite
            </label>
            <input
              type="text"
              value={formData.inviteToken}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-xs"
            />
          </div>
        )}

        {!initialToken && (
          <div>
            <label htmlFor="inviteToken" className="block text-sm font-medium text-gray-700 mb-1">
              Token do Convite *
            </label>
            <input
              type="text"
              id="inviteToken"
              value={formData.inviteToken}
              onChange={(e) => handleInputChange('inviteToken', e.target.value)}
              placeholder="Cole o token que você recebeu"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Seu Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Digite o email do convite"
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
          {isLoading ? 'Confirmando convite...' : 'Aceitar Convite'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Não recebeu um convite?{' '}
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