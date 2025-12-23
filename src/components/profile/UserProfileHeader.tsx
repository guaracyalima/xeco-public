'use client'

import { UserProfile } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, LogOut } from 'lucide-react'

interface UserProfileHeaderProps {
  profile: UserProfile
  onLogout?: () => void
}

export function UserProfileHeader({ profile, onLogout }: UserProfileHeaderProps) {
  const photoUrl = profile.photo_url || '/default-user.jpg'

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 overflow-visible">
      <div className="flex flex-col gap-6">
        {/* Top Section: Avatar + Basic Info + Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-start justify-between overflow-visible">
          {/* Left: Avatar + Info */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center flex-1">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                <Image
                  src={photoUrl}
                  alt={profile.display_name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Informações */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {profile.display_name}
              </h1>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  📧 {profile.email}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  📱 {profile.phone_number}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {profile.entrepreneur === 'SIM' && (
                  <span className="inline-block bg-coral-100 text-coral-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Empreendedor
                  </span>
                )}
                {profile.affiliated === 'SIM' && (
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Afiliado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons - Stacked vertically, aligned right */}
          <div className="flex flex-col gap-2 items-end justify-end min-h-full">
            <button
              onClick={onLogout}
              title="Sair do sistema"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
            
            <Link
              href="https://franquia.xuxum.com.br/create-company"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Franquia
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
