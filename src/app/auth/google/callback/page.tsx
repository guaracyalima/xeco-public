'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string>('Processando login...')

  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          setStatus(`Erro: ${error}`)
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (!code) {
          setStatus('Código de autorização não encontrado')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        setStatus('Trocando código por token...')

        // Trocar o código por um token de acesso
        const tokenResponse = await fetch('/api/auth/google/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        })

        const tokenData = await tokenResponse.json()

        if (!tokenData.success) {
          throw new Error(tokenData.error || 'Erro ao obter token')
        }

        setStatus('Fazendo login...')

        // Criar credential e fazer login no Firebase
        const credential = GoogleAuthProvider.credential(tokenData.idToken)
        const result = await signInWithCredential(auth, credential)

        console.log('✅ Google Auth Success:', result.user.email)
        setStatus('Login realizado com sucesso!')

        // Redirecionar para a página inicial
        setTimeout(() => {
          router.push('/')
        }, 1000)

      } catch (error: any) {
        console.error('❌ Google callback error:', error)
        setStatus(`Erro: ${error.message}`)
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    processGoogleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Autenticando com Google
          </h2>
          <p className="text-gray-600">
            {status}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500"></div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
}