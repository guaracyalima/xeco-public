import { collection, addDoc, writeBatch, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Dados de exemplo para popular o Firebase
const sampleCompanies = [
  {
    name: "Padaria do João",
    about: "A melhor padaria da região com pães frescos todos os dias",
    city: "São Paulo",
    state: "SP",
    phone: "(11) 99999-1111",
    whatsapp: "11999991111",
    logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    isActive: true,
    categoryId: "padaria",
    createdAt: new Date()
  },
  {
    name: "Restaurante Sabor & Arte",
    about: "Culinária italiana com ingredientes frescos e ambiente aconchegante",
    city: "Rio de Janeiro", 
    state: "RJ",
    phone: "(21) 99999-2222",
    whatsapp: "21999992222",
    logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    isActive: true,
    categoryId: "restaurante",
    createdAt: new Date()
  },
  {
    name: "Mercado Central",
    about: "Supermercado com variedade e preços justos para toda família",
    city: "Belo Horizonte",
    state: "MG", 
    phone: "(31) 99999-3333",
    whatsapp: "31999993333",
    logo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    isActive: true,
    categoryId: "supermercado",
    createdAt: new Date()
  },
  {
    name: "Café & Cia",
    about: "Cafeteria especializada em cafés especiais e doces artesanais",
    city: "Curitiba",
    state: "PR",
    phone: "(41) 99999-4444", 
    whatsapp: "41999994444",
    logo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
    isActive: true,
    categoryId: "cafeteria",
    createdAt: new Date()
  },
  {
    name: "Farmácia Popular",
    about: "Medicamentos e produtos de saúde com atendimento especializado",
    city: "Salvador",
    state: "BA",
    phone: "(71) 99999-5555",
    whatsapp: "71999995555", 
    logo: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400",
    isActive: true,
    categoryId: "farmacia",
    createdAt: new Date()
  }
]

const sampleProducts = [
  {
    name: "Pão Francês Tradicional",
    description: "Pão francês fresquinho, crocante por fora e macio por dentro",
    salePrice: 0.50,
    stockQuantity: 100,
    city: "São Paulo",
    uf: "SP",
    companyOwner: "Padaria do João",
    productEmphasis: true,
    isActive: true,
    images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"],
    createdAt: new Date()
  },
  {
    name: "Pizza Margherita",
    description: "Pizza artesanal com molho de tomate, mussarela e manjericão fresco",
    salePrice: 32.90,
    stockQuantity: 50,
    city: "Rio de Janeiro",
    uf: "RJ", 
    companyOwner: "Restaurante Sabor & Arte",
    productEmphasis: true,
    isActive: true,
    images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"],
    createdAt: new Date()
  },
  {
    name: "Cesta Básica Completa",
    description: "Cesta com arroz, feijão, óleo, açúcar e outros itens essenciais",
    salePrice: 89.90,
    stockQuantity: 25,
    city: "Belo Horizonte",
    uf: "MG",
    companyOwner: "Mercado Central", 
    productEmphasis: true,
    isActive: true,
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"],
    createdAt: new Date()
  },
  {
    name: "Café Especial Premium",
    description: "Café especial torrado na hora, com notas de chocolate e caramelo",
    salePrice: 24.90,
    stockQuantity: 30,
    city: "Curitiba",
    uf: "PR",
    companyOwner: "Café & Cia",
    productEmphasis: true,
    isActive: true,
    images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400"],
    createdAt: new Date()
  },
  {
    name: "Kit Vitaminas",
    description: "Conjunto de vitaminas essenciais para manter a saúde em dia",
    salePrice: 45.50,
    stockQuantity: 20,
    city: "Salvador", 
    uf: "BA",
    companyOwner: "Farmácia Popular",
    productEmphasis: false,
    isActive: true,
    images: ["https://images.unsplash.com/photo-1576671081837-49000212a370?w=400"],
    createdAt: new Date()
  }
]

const sampleCategories = [
  {
    name: "Padaria",
    description: "Pães, doces e produtos de confeitaria",
    icon: "🥖",
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Restaurante", 
    description: "Alimentação e gastronomia",
    icon: "🍽️",
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Supermercado",
    description: "Variedade de produtos alimentícios e domésticos", 
    icon: "🛒",
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Cafeteria",
    description: "Cafés especiais e lanches rápidos",
    icon: "☕",
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Farmácia",
    description: "Medicamentos e produtos de saúde",
    icon: "💊", 
    isActive: true,
    createdAt: new Date()
  }
]

export async function populateFirebase() {
  try {
    console.log('🚀 Iniciando população do Firebase...')
    
    // Criar batch para operações em lote
    const batch = writeBatch(db)

    // Adicionar categorias
    console.log('📋 Adicionando categorias...')
    for (const category of sampleCategories) {
      const docRef = doc(collection(db, 'company_category'))
      batch.set(docRef, category)
    }

    // Adicionar empresas
    console.log('🏢 Adicionando empresas...')
    for (const company of sampleCompanies) {
      const docRef = doc(collection(db, 'companies'))
      batch.set(docRef, company)
    }

    // Adicionar produtos
    console.log('📦 Adicionando produtos...')
    for (const product of sampleProducts) {
      const docRef = doc(collection(db, 'product'))
      batch.set(docRef, product)
    }

    // Executar batch
    await batch.commit()
    
    console.log('✅ Firebase populado com sucesso!')
    console.log(`📊 Adicionados: ${sampleCategories.length} categorias, ${sampleCompanies.length} empresas, ${sampleProducts.length} produtos`)
    
  } catch (error) {
    console.error('❌ Erro ao popular Firebase:', error)
  }
}