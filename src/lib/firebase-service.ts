import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy,
  doc,
  getDoc,
  QueryConstraint 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company, CompanyCategory, Product, SearchFilters } from '@/types'

/**
 * 🛡️ Filtra produtos com estoque zerado (stockQuantity === 0)
 * Para proteger clientes de comprarem produtos indisponíveis
 */
const filterOutOfStockProducts = (products: Product[]): Product[] => {
  return products.filter(product => {
    // Se stockQuantity for 0, não mostrar o produto
    if (product.stockQuantity === 0) {
      console.log(`⚠️ Produto "${product.name}" (${product.id}) oculto: estoque zerado`)
      return false
    }
    return true
  })
}

// Companies
export const getCompanies = async (filters?: SearchFilters, limitCount = 10): Promise<Company[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('status', '==', true),
      limit(limitCount)
    ]

    // Simplificando a consulta para evitar índices compostos por enquanto
    if (filters?.city) {
      constraints.push(where('city', '==', filters.city))
    } else if (filters?.state) {
      constraints.push(where('state', '==', filters.state))
    } else if (filters?.categoryId) {
      constraints.push(where('categoryId', '==', filters.categoryId))
    }

    const q = query(collection(db, 'companies'), ...constraints)
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Company))
  } catch (error) {
    console.error('Error fetching companies:', error)
    return []
  }
}

export const getFeaturedCompanies = async (limitCount = 5): Promise<Company[]> => {
  return getCompanies({}, limitCount)
}

// Get single company by ID
export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  try {
    const companyDocRef = doc(db, 'companies', companyId)
    const companyDoc = await getDoc(companyDocRef)
    
    if (!companyDoc.exists()) {
      return null
    }

    return {
      id: companyDoc.id,
      ...companyDoc.data()
    } as Company
  } catch (error) {
    console.error('Error fetching company by ID:', error)
    return null
  }
}

// Categories
export const getCategories = async (): Promise<CompanyCategory[]> => {
  try {
    const q = query(
      collection(db, 'company_category'), 
      orderBy('name', 'asc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CompanyCategory))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Products
export const getProducts = async (filters?: SearchFilters, limitCount = 10): Promise<Product[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('active', '==', 'SIM'),
      limit(limitCount)
    ]

    // Simplificando consulta para evitar índices compostos
    if (filters?.city) {
      constraints.push(where('cidade', '==', filters.city))
    } else if (filters?.state) {
      constraints.push(where('uf', '==', filters.state))
    }

    const q = query(collection(db, 'product'), ...constraints)
    const querySnapshot = await getDocs(q)
    
    const allProducts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product))

    // 🛡️ Filtrar produtos com estoque zerado
    return filterOutOfStockProducts(allProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export const getFeaturedProducts = async (limitCount = 5): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'product'),
      where('active', '==', 'SIM'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)
    
    const allProducts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product))

    // 🛡️ Filtrar produtos com estoque zerado
    const productsInStock = filterOutOfStockProducts(allProducts)

    // Buscar nomes das empresas para cada produto
    const productsWithCompanyNames = await Promise.all(
      productsInStock.map(async (product) => {
        try {
          if (product.companyOwner) {
            const companyDocRef = doc(db, 'companies', product.companyOwner)
            const companyDoc = await getDoc(companyDocRef)
            if (companyDoc.exists()) {
              const company = companyDoc.data()
              return {
                ...product,
                companyOwnerName: company.name || 'Empresa não encontrada'
              }
            }
          }
          return {
            ...product,
            companyOwnerName: 'Empresa não informada'
          }
        } catch (error) {
          console.error('Erro ao buscar empresa:', error)
          return {
            ...product,
            companyOwnerName: 'Empresa não encontrada'
          }
        }
      })
    )
    
    return productsWithCompanyNames
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}

// Get single product by ID
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productDocRef = doc(db, 'product', productId)
    const productDoc = await getDoc(productDocRef)
    
    if (!productDoc.exists()) {
      return null
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data()
    } as Product

    // Buscar nome da empresa
    if (product.companyOwner) {
      try {
        const companyDocRef = doc(db, 'companies', product.companyOwner)
        const companyDoc = await getDoc(companyDocRef)
        if (companyDoc.exists()) {
          const company = companyDoc.data()
          product.companyOwnerName = company.name || 'Empresa não encontrada'
        }
      } catch (error) {
        console.error('Erro ao buscar empresa do produto:', error)
        product.companyOwnerName = 'Empresa não encontrada'
      }
    } else {
      product.companyOwnerName = 'Empresa não informada'
    }

    return product
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return null
  }
}

// Get products from the same company
export const getRelatedProducts = async (companyId: string, excludeProductId: string, limitCount = 4): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'product'),
      where('active', '==', 'SIM'),
      where('companyOwner', '==', companyId),
      limit(limitCount + 1) // Pegamos um a mais para excluir o produto atual
    )
    const querySnapshot = await getDocs(q)
    
    const allProducts = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product))

    // 🛡️ Filtrar produtos com estoque zerado
    const productsInStock = filterOutOfStockProducts(allProducts)
      .filter(product => product.id !== excludeProductId) // Excluir o produto atual
      .slice(0, limitCount) // Limitar ao número desejado

    // Buscar nomes das empresas para cada produto
    const productsWithCompanyNames = await Promise.all(
      productsInStock.map(async (product) => {
        try {
          if (product.companyOwner) {
            const companyDocRef = doc(db, 'companies', product.companyOwner)
            const companyDoc = await getDoc(companyDocRef)
            if (companyDoc.exists()) {
              const company = companyDoc.data()
              return {
                ...product,
                companyOwnerName: company.name || 'Empresa não encontrada'
              }
            }
          }
          return {
            ...product,
            companyOwnerName: 'Empresa não informada'
          }
        } catch (error) {
          console.error('Erro ao buscar empresa:', error)
          return {
            ...product,
            companyOwnerName: 'Empresa não encontrada'
          }
        }
      })
    )
    
    return productsWithCompanyNames
  } catch (error) {
    console.error('Error fetching related products:', error)
    return []
  }
}

// Search function
export const searchAll = async (filters: SearchFilters) => {
  const [companies, products] = await Promise.all([
    getCompanies(filters, 20),
    getProducts(filters, 20)
  ])

  return {
    companies,
    products,
    total: companies.length + products.length
  }
}