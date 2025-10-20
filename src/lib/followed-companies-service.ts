import { collection, query, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company } from '@/types'

/**
 * Busca todas as empresas que o usuário segue
 * Estrutura do Firestore: users/{userId}/followedCompanies/{companyId}
 */
export async function getFollowedCompanies(userId: string): Promise<Company[]> {
  try {
    const collectionRef = collection(db, 'users', userId, 'followedCompanies')
    const snapshot = await getDocs(collectionRef)
    
    const companies: Company[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Company))
    
    console.log(`✅ Encontradas ${companies.length} empresas seguidas`)
    return companies
  } catch (error) {
    console.error('❌ Erro ao buscar empresas seguidas:', error)
    return []
  }
}

/**
 * Segue uma empresa
 * Salva na subcollection: users/{userId}/followedCompanies/{companyId}
 */
export async function followCompany(userId: string, company: Company) {
  try {
    const docRef = doc(db, 'users', userId, 'followedCompanies', company.id)
    
    // Salva o documento com os dados da empresa
    await setDoc(docRef, {
      ...company,
      followedAt: new Date().toISOString(),
    })
    
    console.log(`✅ Você agora segue: ${company.name}`)
    return true
  } catch (error) {
    console.error('❌ Erro ao seguir empresa:', error)
    return false
  }
}

/**
 * Para de seguir uma empresa
 */
export async function unfollowCompany(userId: string, companyId: string) {
  try {
    const docRef = doc(db, 'users', userId, 'followedCompanies', companyId)
    await deleteDoc(docRef)
    console.log(`❌ Você deixou de seguir a empresa`)
    return true
  } catch (error) {
    console.error('❌ Erro ao deixar de seguir empresa:', error)
    return false
  }
}

/**
 * Verifica se está seguindo uma empresa específica
 */
export async function isFollowingCompany(userId: string, companyId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', userId, 'followedCompanies', companyId)
    const snapshot = await getDocs(collection(db, 'users', userId, 'followedCompanies'))
    
    return snapshot.docs.some(doc => doc.id === companyId)
  } catch (error) {
    console.error('❌ Erro ao verificar se está seguindo:', error)
    return false
  }
}
