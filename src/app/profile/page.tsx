'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import {
  UserProfileHeader,
  ProfileTabs,
  FollowingCompaniesTab,
  InterestedProductsTab,
  MyAffiliationTab,
  MyOrdersTab,
} from '@/components/profile'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAnalytics } from '@/hooks/useAnalytics'
import { EventName } from '@/types/analytics'

const PROFILE_TABS = [
  { id: 'pedidos', label: 'Minhas compras', icon: '📦' },
  { id: 'following', label: 'Franquias que sigo', icon: '🏢' },
  { id: 'interested', label: 'Produtos de interesse', icon: '❤️' },
  { id: 'affiliation', label: 'Afiliação', icon: '🤝' },
]

function ProfileContent() {
  const { userProfile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('pedidos')
  const { trackEvent } = useAnalytics()

  // Track profile view
  useEffect(() => {
    if (!loading && userProfile) {
      trackEvent(EventName.PROFILE_VIEW, {
        eventData: {
          userId: userProfile.uid,
          category: 'profile',
          label: 'profile_page_view'
        }
      })
    }
  }, [loading, userProfile, trackEvent])

  // Ler tab da URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && PROFILE_TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Track tab switch
  useEffect(() => {
    if (userProfile && activeTab) {
      trackEvent(EventName.TAB_SWITCH, {
        eventData: {
          category: 'profile',
          tab: activeTab,
          label: `profile_tab_${activeTab}`
        }
      })
    }
  }, [activeTab, userProfile, trackEvent])

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!loading && !userProfile) {
      console.log('🚫 [ProfilePage] Usuário não autenticado, redirecionando para login...')
      
      // Preservar a aba atual na URL de retorno
      const currentTab = searchParams.get('tab') || 'pedidos'
      const returnUrl = encodeURIComponent(`/profile?tab=${currentTab}`)
      
      console.log('🔗 [ProfilePage] returnUrl:', returnUrl)
      router.push(`/login?returnUrl=${returnUrl}`)
    } else if (userProfile) {
      console.log('✅ [ProfilePage] Usuário autenticado:', userProfile.email)
    }
  }, [userProfile, loading, router, searchParams])

  const handleLogout = async () => {
    try {
      // Track logout
      trackEvent(EventName.LOGOUT, {
        eventData: {
          userId: userProfile?.uid,
          category: 'authentication',
          label: 'user_logout'
        }
      })
      
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!userProfile) {
    return null
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {/* Cabeçalho do Perfil */}
          <UserProfileHeader profile={userProfile} onLogout={handleLogout} />

          {/* Abas */}
          <div className="bg-white rounded-lg shadow-sm">
            <ProfileTabs
              tabs={PROFILE_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Conteúdo das Abas */}
            <div>
              {activeTab === 'pedidos' && <MyOrdersTab />}
              {activeTab === 'following' && <FollowingCompaniesTab />}
              {activeTab === 'interested' && <InterestedProductsTab />}
              {activeTab === 'affiliation' && <MyAffiliationTab />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </Layout>
    }>
      <ProfileContent />
    </Suspense>
  )
}
