'use client'

import { UserProfile } from '@/types'
import Image from 'next/image'
import Link from 'next/link'

interface UserProfileHeaderProps {
  profile: UserProfile
}

export function UserProfileHeader({ profile }: UserProfileHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
            {profile.photo_url ? (
              <Image
                src={profile.photo_url}
                alt={profile.display_name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-white font-bold">
                {profile.display_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            )}
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
            {profile.enabled && (
              <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ Ativo
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 mb-4">
            📍 {profile.street}, {profile.number}
            {profile.complement && ` - ${profile.complement}`}
            <br />
            {profile.neighborhood}, {profile.city} - {profile.state} {profile.cep}
          </div>

          {/* Botão Cadastrar Empresa */}
          <Link
            href="https://franquia.xeco.com.br/create-company"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            ➕ Cadastrar Empresa
          </Link>
        </div>
      </div>
    </div>
  )
}
