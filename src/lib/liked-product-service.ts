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
import { Product } from '@/types'

export interface LikedProductRecord {
  product_id: DocumentReference | string
  company_id: DocumentReference | string
  user_id: DocumentReference | string
  liked: 'SIM' | 'NAO'
  created_at: string
  created_location?: [number, number]
  id?: string
}

/**
 * Busca todos os produtos favoritados do usuário (liked = 'SIM')
 * Estrutura: LikedProduct collection com query where liked == 'SIM' e user_id == userId
 */
export async function getFavoredProducts(userId: string): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'LikedProduct'),
      where('user_id', '==', userId),
      where('liked', '==', 'SIM')
    )

    const snapshot = await getDocs(q)
    
    // Para cada registro em LikedProduct, buscar detalhes completos do produto
    const products: Product[] = []
    
    for (const likedDoc of snapshot.docs) {
      const likedRecord = likedDoc.data() as LikedProductRecord
      
      try {
        // Extrair ID do produto da referência
        let productId: string
        if (typeof likedRecord.product_id === 'string') {
          productId = likedRecord.product_id.replace('/product/', '')
        } else {
          productId = likedRecord.product_id.id
        }
        
        // Buscar dados completos do produto
        const productRef = doc(db, 'product', productId)
        const productSnap = await getDoc(productRef)
        
        if (productSnap.exists()) {
          const productData = {
            id: productSnap.id,
            ...productSnap.data()
          } as Product

          // 🛡️ Filtrar produtos com estoque zerado
          if (productData.stockQuantity === 0) {
            console.log(`⚠️ Produto favoritado "${productData.name}" oculto: estoque zerado`)
            continue
          }

          products.push(productData)
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error)
      }
    }

    console.log(`✅ Encontrados ${products.length} produtos favoritados (com estoque)`)
    return products
  } catch (error) {
    console.error('❌ Erro ao buscar produtos favoritados:', error)
    return []
  }
}

/**
 * Real-time listener para produtos favoritados
 * Retorna array de Products com dados completos (não apenas referências)
 */
export function onFavoredProductsChange(
  userId: string,
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, 'LikedProduct'),
    where('user_id', '==', userId),
    where('liked', '==', 'SIM')
  )

  return onSnapshot(q, async (snapshot) => {
    try {
      const products: Product[] = []
      
      for (const likedDoc of snapshot.docs) {
        const likedRecord = likedDoc.data() as LikedProductRecord
        
        try {
          // Extrair ID do produto
          let productId: string
          if (typeof likedRecord.product_id === 'string') {
            productId = likedRecord.product_id.replace('/product/', '')
          } else {
            productId = likedRecord.product_id.id
          }
          
          // Buscar dados completos
          const productRef = doc(db, 'product', productId)
          const productSnap = await getDoc(productRef)
          
          if (productSnap.exists()) {
            const productData = {
              id: productSnap.id,
              ...productSnap.data()
            } as Product

            // 🛡️ Filtrar produtos com estoque zerado
            if (productData.stockQuantity === 0) {
              console.log(`⚠️ Produto favoritado "${productData.name}" oculto: estoque zerado`)
              continue
            }

            products.push(productData)
          }
        } catch (error) {
          console.error('Erro ao buscar detalhes do produto no listener:', error)
        }
      }
      
      callback(products)
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
 * Favorita um produto (UPSERT)
 * Se já existe registro, atualiza liked para 'SIM'
 * Se não existe, cria novo registro
 */
export async function favoriteProduct(
  userId: string,
  productId: string,
  companyId: string,
  location?: [number, number]
): Promise<boolean> {
  try {
    // Procurar se já existe registro
    const q = query(
      collection(db, 'LikedProduct'),
      where('user_id', '==', userId),
      where('product_id', '==', productId)
    )
    
    const existing = await getDocs(q)
    
    if (existing.docs.length > 0) {
      // UPSERT: Atualizar liked para SIM
      const docRef = doc(db, 'LikedProduct', existing.docs[0].id)
      await updateDoc(docRef, {
        liked: 'SIM',
        updated_at: new Date().toISOString()
      })
      console.log(`✅ Produto favoritado (registro atualizado)`)
    } else {
      // Criar novo registro
      const newLike = doc(collection(db, 'LikedProduct'))
      await setDoc(newLike, {
        user_id: userId,
        product_id: productId,
        company_id: companyId,
        liked: 'SIM',
        created_at: new Date().toISOString(),
        created_location: location || null
      })
      console.log(`✅ Produto favoritado (novo registro criado)`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao favoritar produto:', error)
    return false
  }
}

/**
 * Desfavorita um produto
 * Atualiza liked para 'NAO' (mantém histórico)
 */
export async function unfavoriteProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'LikedProduct'),
      where('user_id', '==', userId),
      where('product_id', '==', productId)
    )
    
    const existing = await getDocs(q)
    
    if (existing.docs.length > 0) {
      const docRef = doc(db, 'LikedProduct', existing.docs[0].id)
      await updateDoc(docRef, {
        liked: 'NAO',
        updated_at: new Date().toISOString()
      })
      console.log(`❌ Produto desfavoritado (histórico mantido)`)
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ Erro ao desfavoritar produto:', error)
    return false
  }
}

/**
 * Verifica se um produto está favoritado
 */
export async function isProductFavored(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'LikedProduct'),
      where('user_id', '==', userId),
      where('product_id', '==', productId),
      where('liked', '==', 'SIM')
    )
    
    const result = await getDocs(q)
    return result.docs.length > 0
  } catch (error) {
    console.error('❌ Erro ao verificar se produto está favoritado:', error)
    return false
  }
}

