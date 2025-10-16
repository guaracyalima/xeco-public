'use client'

import { Layout } from '@/components/layout/Layout'
import { AnalyticsTestComponent } from '@/components/test/AnalyticsTest'

export default function TestAnalyticsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <AnalyticsTestComponent />
      </div>
    </Layout>
  )
}