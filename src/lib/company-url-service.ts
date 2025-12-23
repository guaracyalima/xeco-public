import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CompanyUrl } from '@/types'

export class CompanyUrlService {
  private static readonly COLLECTION_NAME = 'company_urls'

  /**
   * Busca uma URL de empresa pelo slug e localização
   * @param slug - Slug da empresa (ex: "padaria-do-joao")
   * @param city - Cidade normalizada (ex: "sao-paulo")
   * @param state - Estado (ex: "sp")
   * @returns CompanyUrl encontrada ou null
   */
  static async getCompanyUrlBySlug(
    slug: string, 
    city: string, 
    state: string
  ): Promise<CompanyUrl | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('slug', '==', slug),
        where('city', '==', city),
        where('state', '==', state),
        where('isActive', '==', true)
      )

      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        console.log('🔍 URL personalizada não encontrada:', { slug, city, state })
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()
      
      return {
        id: doc.id,
        companyId: data.companyId,
        slug: data.slug,
        city: data.city,
        state: data.state,
        fullUrl: data.fullUrl,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as CompanyUrl

    } catch (error) {
      console.error('❌ Erro ao buscar URL personalizada:', error)
      return null
    }
  }

  /**
   * Busca uma URL de empresa pelo ID da empresa
   * @param companyId - ID da empresa
   * @returns CompanyUrl encontrada ou null
   */
  static async getCompanyUrlByCompanyId(companyId: string): Promise<CompanyUrl | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('isActive', '==', true)
      )

      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        console.log('🔍 URL personalizada não encontrada para empresa:', companyId)
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()
      
      return {
        id: doc.id,
        companyId: data.companyId,
        slug: data.slug,
        city: data.city,
        state: data.state,
        fullUrl: data.fullUrl,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as CompanyUrl

    } catch (error) {
      console.error('❌ Erro ao buscar URL personalizada por empresa:', error)
      return null
    }
  }

  /**
   * Gera a URL personalizada completa baseada no domínio configurado
   * @param companyUrl - Dados da URL da empresa
   * @returns URL completa formatada
   */
  static generateFullUrl(companyUrl: CompanyUrl): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'xuxum.com.br'
    return `${baseUrl}/${companyUrl.city}-${companyUrl.state}/${companyUrl.slug}`
  }

  /**
   * Valida se os parâmetros da URL estão no formato correto
   * @param cityState - String no formato "cidade-uf"
   * @param slug - Slug da empresa
   * @returns Objeto com cidade, estado e slug validados ou null se inválido
   */
  static validateUrlParams(
    cityState: string, 
    slug: string
  ): { city: string; state: string; slug: string } | null {
    try {
      // Validar formato cidade-uf
      const cityStateParts = cityState.split('-')
      if (cityStateParts.length < 2) {
        return null
      }

      // Separar estado (últimas 2 partes) do resto (cidade)
      const state = cityStateParts.pop()?.toLowerCase() // Último elemento (UF)
      const city = cityStateParts.join('-').toLowerCase() // Resto é a cidade

      // Validar estado (deve ter 2 caracteres)
      if (!state || state.length !== 2) {
        return null
      }

      // Validar slug (não pode estar vazio e deve ter formato válido)
      if (!slug || slug.trim() === '' || !/^[a-z0-9-]+$/.test(slug)) {
        return null
      }

      return {
        city: city.toLowerCase(),
        state: state.toLowerCase(),
        slug: slug.toLowerCase()
      }

    } catch (error) {
      console.error('❌ Erro ao validar parâmetros da URL:', error)
      return null
    }
  }

  /**
   * Busca todas as URLs de empresas (para debug/teste)
   * @param limit - Limite de resultados
   * @returns Array de CompanyUrl
   */
  static async getAllCompanyUrls(limit = 10): Promise<CompanyUrl[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true)
      )

      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.slice(0, limit).map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          companyId: data.companyId,
          slug: data.slug,
          city: data.city,
          state: data.state,
          fullUrl: data.fullUrl,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as CompanyUrl
      })

    } catch (error) {
      console.error('❌ Erro ao buscar todas as URLs:', error)
      return []
    }
  }
}