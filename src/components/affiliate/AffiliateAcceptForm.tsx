'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmAffiliateInvitation } from '@/lib/affiliate-service'
import { AffiliateConfirmRequest } from '@/types'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, UserPlus, Copy, Gift } from 'lucide-react'
import AsaasAccountForm, { AsaasAccountData } from './AsaasAccountForm'
import { N8N_ENDPOINTS, type N8NAsaasAccountResponse } from '@/lib/n8n-config'

interface AffiliateAcceptFormProps {
  initialToken?: string
}

type FormStep = 'invite' | 'asaas-account' | 'success' | 'error'

export function AffiliateAcceptForm({ initialToken = '' }: AffiliateAcceptFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<FormStep>('invite')
  const [formData, setFormData] = useState<AffiliateConfirmRequest>({
    inviteToken: initialToken,
    email: ''
  })
  const [asaasData, setAsaasData] = useState<{
    cpfCnpj: string
    email: string
  } | null>(null)
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
      
      // Se o erro for REQUIRES_ASAAS_ACCOUNT_CREATION, mostra formulário
      if (!response.success && response.message?.includes('REQUIRES_ASAAS_ACCOUNT_CREATION')) {
        // CPF/CNPJ pode vir vazio (usuário preenche) ou preenchido
        const cpfCnpj = response.data?.cpfCnpj || '' // Aceita string vazia
        setAsaasData({
          cpfCnpj,
          email: '' // Email vazio - usuário preenche no formulário
        })
        setStep('asaas-account')
        setIsLoading(false)
        return
      }
      
      // Se deu sucesso ou outro erro, mostra resultado
      setResult(response)
      setStep(response.success ? 'success' : 'error')
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro inesperado. Tente novamente.'
      })
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAsaasAccountSubmit = async (accountData: AsaasAccountData) => {
    try {
      console.log('📤 Fluxo: Criar afiliado PRIMEIRO (com cpfCnpj), depois criar conta Asaas')
      
      // PASSO 1: Criar afiliado COM cpfCnpj (sem walletId ainda)
      console.log('📝 PASSO 1: Criando afiliado com CPF/CNPJ...')
      const affiliateResponse = await confirmAffiliateInvitation({
        ...formData,
        walletId: '', // Ainda não tem
        cpfCnpj: accountData.cpfCnpj // Passa o CPF/CNPJ do formulário - EVITA LOOP!
      })
      
      if (!affiliateResponse.success) {
        throw new Error(affiliateResponse.message || 'Erro ao criar afiliado')
      }
      
      const affiliateId = affiliateResponse.data?.affiliateId
      if (!affiliateId) {
        throw new Error('AffiliateId não foi retornado')
      }
      
      console.log('✅ PASSO 1 concluído: Afiliado criado com ID:', affiliateId)
      
      // PASSO 2: Criar conta Asaas COM affiliateId
      console.log('📤 PASSO 2: Criando conta Asaas com affiliateId...')
      const asaasResponse = await fetch(N8N_ENDPOINTS.createAsaasAccount, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...accountData,
          affiliateId: affiliateId // ← PASSA O AFFILIATE ID PARA N8N!
        })
      })
      
      const asaasData: N8NAsaasAccountResponse = await asaasResponse.json()
      
      if (!asaasData.success) {
        console.error('⚠️ Afiliado criado mas conta Asaas falhou!')
        throw new Error(asaasData.error || 'Erro ao criar conta Asaas')
      }
      
      console.log('✅ PASSO 2 concluído: Conta Asaas criada e afiliado atualizado!')
      console.log('💰 WalletId:', asaasData.walletId)
      
      // Sucesso total!
      setResult({
        success: true,
        message: 'Afiliação confirmada com sucesso! Sua conta de pagamento está ativa.',
        data: {
          ...affiliateResponse.data,
          walletId: asaasData.walletId
        }
      })
      setStep('success')
      
    } catch (error: any) {
      console.error('❌ Erro no fluxo de criação:', error)
      setResult({
        success: false,
        message: error.message || 'Erro ao criar conta de pagamento'
      })
      setStep('error')
    }
  }

  const handleAsaasAccountCancel = () => {
    setStep('invite')
    setAsaasData(null)
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

  // Step: Formulário de criação de conta Asaas
  if (step === 'asaas-account' && asaasData) {
    return (
      <AsaasAccountForm
        cpfCnpj={asaasData.cpfCnpj}
        email={asaasData.email}
        onSubmit={handleAsaasAccountSubmit}
        onCancel={handleAsaasAccountCancel}
      />
    )
  }

  // Step: Sucesso
  if (step === 'success' && result?.success) {
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
          <div className="text-left space-y-2">
            <p className="text-sm text-gray-700">
              <strong>Loja:</strong> {result.data?.storeName}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Código de convite:</strong>{' '}
              <span className="font-mono bg-green-100 px-2 py-1 rounded">
                {result.data?.inviteCode}
              </span>
              <button
                onClick={() => copyToClipboard(result.data?.inviteCode)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <Copy className="w-4 h-4 inline" />
              </button>
            </p>
            {result.data?.isNewUser && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Nova conta criada!</strong>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Email: {formData.email}
                </p>
                <p className="text-sm text-yellow-700">
                  Senha padrão: <strong>Mudar123#</strong>
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  ⚠️ Você será solicitado a alterar sua senha no primeiro login.
                </p>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleGoToLogin}
          className="w-full"
        >
          {result.data?.isNewUser ? 'Fazer Primeiro Login' : 'Acessar Minha Conta'}
        </Button>
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

        {result && !result.success && step !== 'asaas-account' && (
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
