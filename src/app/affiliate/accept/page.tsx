'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AffiliateAcceptForm } from '@/components/affiliate/AffiliateAcceptForm'
import { Loader2 } from 'lucide-react'

function AffiliateAcceptContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <AffiliateAcceptForm 
          initialToken={token}
        />
      </main>
      
      <Footer />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Carregando...</span>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default function AffiliateAcceptPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AffiliateAcceptContent />
    </Suspense>
  )
}