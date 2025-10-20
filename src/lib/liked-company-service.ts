import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  setDoc,
  onSnapshot,
  getDoc,
  DocumentReference
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company } from '@/types'

export interface LikedCompanyRecord {
  company_id: DocumentReference | string
  user_id: DocumentReference | string
  liked: 'SIM' | 'NAO'
  created_at: string
  created_location?: [number, number]
  id?: string
}

/**
 * Busca todas as empresas favoritadas do usuário (liked = 'SIM')
 * Estrutura: LikedCompany collection com query where liked == 'SIM' e user_id == userId
 */
export async function getFavoredCompanies(userId: string): Promise<Company[]> {
  try {
    const q = query(
      collection(db, 'LikedCompany'),
      where('user_id', '==', userId),
      where('liked', '==', 'SIM')
    )

    const snapshot = await getDocs(q)
    
    // Para cada registro em LikedCompany, buscar detalhes completos da empresa
    const companies: Company[] = []
    
    for (const likedDoc of snapshot.docs) {
      const likedRecord = likedDoc.data() as LikedCompanyRecord
      
      try {
        // Extrair ID da empresa da referência
        let companyId: string
        if (typeof likedRecord.company_id === 'string') {
          companyId = likedRecord.company_id.replace('/companies/', '')
        } else {
          companyId = likedRecord.company_id.id
        }
        
        // Buscar dados completos da empresa
        const companyRef = doc(db, 'companies', companyId)
        const companySnap = await getDoc(companyRef)
        
        if (companySnap.exists()) {
          companies.push({
            id: companySnap.id,
            ...companySnap.data()
          } as Company)
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes da empresa:', error)
      }
    }

    console.log(`✅ Encontradas ${companies.length} empresas favoritadas`)
    return companies
  } catch (error) {
    console.error('❌ Erro ao buscar empresas favoritadas:', error)
    return []
  }
}

/**
 * Real-time listener para empresas favoritadas
 * Retorna array de Companies com dados completos (não apenas referências)
 */
export function onFavoredCompaniesChange(
  userId: string,
  callback: (companies: Company[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, 'LikedCompany'),
    where('user_id', '==', userId),
    where('liked', '==', 'SIM')
  )

  return onSnapshot(q, async (snapshot) => {
    try {
      const companies: Company[] = []
      
      for (const likedDoc of snapshot.docs) {
        const likedRecord = likedDoc.data() as LikedCompanyRecord
        
        try {
          // Extrair ID da empresa
          let companyId: string
          if (typeof likedRecord.company_id === 'string') {
            companyId = likedRecord.company_id.replace('/companies/', '')
          } else {
            companyId = likedRecord.company_id.id
          }
          
          // Buscar dados completos
          const companyRef = doc(db, 'companies', companyId)
          const companySnap = await getDoc(companyRef)
          
          if (companySnap.exists()) {
            companies.push({
              id: companySnap.id,
              ...companySnap.data()
            } as Company)
          }
        } catch (error) {
          console.error('Erro ao buscar detalhes da empresa no listener:', error)
        }
      }
      
      callback(companies)
    } catch (error) {
      console.error('Erro no real-time listener:', error)
      onError?.(error as Error)
    }
  }, (error) => {
    console.error('Erro ao configurar listener:', error)
    onError?.(error as Error)
  })
}

/**
 * Favorita uma empresa (UPSERT)
 * Se já existe registro, atualiza liked para 'SIM'
 * Se não existe, cria novo registro
 */
export async function favoriteCompany(
  userId: string,
  companyId: string,
  location?: [number, number]
): Promise<boolean> {
  try {
    // Procurar se já existe registro
    const q = query(
      collection(db, 'LikedCompany'),
      where('user_id', '==', userId),
      where('company_id', '==', companyId)
    )
    
    const existing = await getDocs(q)
    
    if (existing.docs.length > 0) {
      // UPSERT: Atualizar liked para SIM
      const docRef = doc(db, 'LikedCompany', existing.docs[0].id)
      await updateDoc(docRef, {
        liked: 'SIM',
        updated_at: new Date().toISOString()
      })
      console.log(`✅ Empresa favoritada (registro atualizado)`)
    } else {
      // Criar novo registro
      const newLike = doc(collection(db, 'LikedCompany'))
      await setDoc(newLike, {
        user_id: userId,
        company_id: companyId,
        liked: 'SIM',
        created_at: new Date().toISOString(),
        created_location: location || null
      })
      console.log(`✅ Empresa favoritada (novo registro criado)`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao favoritar empresa:', error)
    return false
  }
}

/**
 * Desfavorita uma empresa
 * Atualiza liked para 'NAO' (mantém histórico)
 */
export async function unfavoriteCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'LikedCompany'),
      where('user_id', '==', userId),
      where('company_id', '==', companyId)
    )
    
    const existing = await getDocs(q)
    
    if (existing.docs.length > 0) {
      const docRef = doc(db, 'LikedCompany', existing.docs[0].id)
      await updateDoc(docRef, {
        liked: 'NAO'
      })
      console.log(`❌ Empresa desfavoritada (histórico mantido)`)
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ Erro ao desfavoritar empresa:', error)
    return false
  }
}

/**
 * Verifica se uma empresa está favoritada
 */
export async function isCompanyFavored(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'LikedCompany'),
      where('user_id', '==', userId),
      where('company_id', '==', companyId),
      where('liked', '==', 'SIM')
    )
    
    const result = await getDocs(q)
    return result.docs.length > 0
  } catch (error) {
    console.error('❌ Erro ao verificar se empresa está favoritada:', error)
    return false
  }
}
