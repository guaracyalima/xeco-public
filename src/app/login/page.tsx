'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, db, googleProvider } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      const returnUrl = searchParams.get('returnUrl') || '/'
      router.push(returnUrl)
    }
  }, [user, router, searchParams])

  // Se está logado, mostrar tela de carregamento
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecionando...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        // Criar nova conta
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Criar documento do usuário no Firestore
        const userRef = doc(db, 'users', userCredential.user.uid)
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: email,
          display_name: email.split('@')[0], // Usar parte do email como nome padrão
          phone_number: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          cep: '',
          document_number: '',
          photo_url: '',
          entrepreneur: 'NAO',
          affiliated: 'NAO',
          completed_profile: 'NAO',
          enabled: true,
          haveanaccount: 'SIM',
          role: ['user'],
          created_time: new Date().toISOString(),
        })
      }

      // Redirecionar após login bem-sucedido
      const returnUrl = searchParams.get('returnUrl') || '/'
      
      // Verificar se há ação pendente
      const pendingAction = sessionStorage.getItem('pendingAction')
      if (pendingAction === 'addFavorite') {
        sessionStorage.removeItem('pendingAction')
        sessionStorage.removeItem('returnUrl')
      }
      
      router.push(returnUrl)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('🔵 Iniciando login com Google...')
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      console.log('✅ Login com Google bem-sucedido:', user.email)

      // Verificar se o usuário já existe no Firestore
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        console.log('📝 Criando novo perfil de usuário no Firestore...')
        // Criar documento do usuário no Firestore
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          display_name: user.displayName || user.email?.split('@')[0] || 'Usuário',
          phone_number: user.phoneNumber || '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          cep: '',
          document_number: '',
          photo_url: user.photoURL || '',
          entrepreneur: 'NAO',
          affiliated: 'NAO',
          completed_profile: 'NAO',
          enabled: true,
          haveanaccount: 'SIM',
          role: ['user'],
          created_time: new Date().toISOString(),
        })
        console.log('✅ Perfil criado com sucesso')
      } else {
        console.log('ℹ️ Usuário já existe no Firestore')
      }

      // Redirecionar após login bem-sucedido
      const returnUrl = searchParams.get('returnUrl') || '/'
      
      // Verificar se há ação pendente
      const pendingAction = sessionStorage.getItem('pendingAction')
      if (pendingAction === 'addFavorite') {
        sessionStorage.removeItem('pendingAction')
        sessionStorage.removeItem('returnUrl')
      }
      
      console.log('🔄 Redirecionando para:', returnUrl)
      router.push(returnUrl)
    } catch (error: unknown) {
      console.error('❌ Erro no login com Google:', error)
      if (error instanceof Error) {
        setError(`Erro ao fazer login com Google: ${error.message}`)
      } else {
        setError('Erro desconhecido ao fazer login com Google')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-coral-600 hover:text-coral-500"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>

          {/* Botão de login com Google */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Aguarde...' : 'Continuar com Google'}
            </button>
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Ou continue com e-mail</span>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-coral-500 focus:border-coral-500"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-coral-500 focus:border-coral-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-coral-600 hover:bg-coral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 disabled:opacity-50"
              >
                {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar conta')}
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}