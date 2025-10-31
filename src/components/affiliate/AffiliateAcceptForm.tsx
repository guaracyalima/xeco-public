'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Gift, Loader2 } from 'lucide-react'

interface AffiliateAcceptFormProps {
  initialToken?: string
}

interface InviteData {
  storeId: string
  storeName: string
  storeOwnerName: string
  commissionRate: number
  message?: string
}

export function AffiliateAcceptForm({ initialToken = '' }: AffiliateAcceptFormProps) {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [isLoadingInvite, setIsLoadingInvite] = useState(true)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    walletSource?: 'company' | 'personal'
    companyName?: string
  } | null>(null)

  useEffect(() => {
    if (!initialToken) {
      setError('Token de convite não fornecido')
      setIsLoadingInvite(false)
      return
    }

    const loadInvite = async () => {
      try {
        const response = await fetch(`/api/affiliate/validate-invite?token=${initialToken}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao validar convite')
        }

        setInviteData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar convite')
      } finally {
        setIsLoadingInvite(false)
      }
    }

    loadInvite()
  }, [initialToken])

  const handleAcceptInvite = async () => {
    if (!userProfile?.uid) {
      setError('Você precisa estar logado para aceitar o convite')
      router.push(`/login?redirect=/affiliate/accept?token=${initialToken}`)
      return
    }

    setIsAccepting(true)
    setError(null)

    try {
      const response = await fetch('/api/affiliate/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: initialToken,
          userId: userProfile.uid
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aceitar convite')
      }

      setResult({
        success: true,
        message: data.message,
        walletSource: data.walletSource,
        companyName: data.companyName
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite')
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoadingInvite) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Validando convite...</p>
        </div>
      </div>
    )
  }

  if (result?.success) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Parabéns! 🎉</h2>
          <p className="text-gray-600">{result.message}</p>
        </div>

        {result.walletSource === 'company' && result.companyName && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700 text-sm">
              ⚠️ Suas comissões serão depositadas na conta da sua franquia <strong>"{result.companyName}"</strong>.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/perfil?tab=afiliacao')}
            className="w-full"
          >
            Ir para Painel de Afiliado
          </Button>
        </div>
      </div>
    )
  }

  if (error || !inviteData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao Carregar Convite</h2>
          <p className="text-red-600 mb-6">{error || 'Convite não encontrado'}</p>
          <Button onClick={() => router.push('/')} variant="outline">Voltar</Button>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <Gift className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite de Afiliado</h1>
          <p className="text-gray-600">Você precisa estar logado</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push(`/login?redirect=/affiliate/accept?token=${initialToken}`)}
            className="w-full"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <Gift className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite de Afiliado</h1>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-blue-900 mb-2">Detalhes do Convite</h3>
        <p><strong>Empresa:</strong> {inviteData.storeName}</p>
        <p><strong>Comissão:</strong> {inviteData.commissionRate}%</p>
      </div>

      {error && (
        <div className="bg-red-50 p-3 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <Button
        onClick={handleAcceptInvite}
        disabled={isAccepting}
        className="w-full"
      >
        {isAccepting ? 'Aceitando...' : 'Aceitar Convite'}
      </Button>
    </div>
  )
}
