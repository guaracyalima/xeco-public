'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import {
  UserProfileHeader,
  ProfileTabs,
  FollowingCompaniesTab,
  InterestedProductsTab,
  MyAffiliationTab,
} from '@/components/profile'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const PROFILE_TABS = [
  { id: 'following', label: 'Empresas que Sigo', icon: '🏢' },
  { id: 'interested', label: 'Produtos de Interesse', icon: '❤️' },
  { id: 'affiliation', label: 'Minha Afiliação', icon: '🤝' },
]

export default function ProfilePage() {
  const { userProfile, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('following')

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!loading && !userProfile) {
      router.push('/login?returnUrl=%2Fperfil')
    }
  }, [userProfile, loading, router])

  const handleLogout = async () => {
    try {
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
