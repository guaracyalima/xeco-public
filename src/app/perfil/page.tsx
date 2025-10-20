'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  UserProfileHeader,
  ProfileTabs,
  FollowingCompaniesTab,
  InterestedProductsTab,
  MyAffiliationTab,
} from '@/components/profile'

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Cabeçalho do Perfil */}
        <UserProfileHeader profile={userProfile} />

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
  )
}
