# 📌 Guia para Expandir a Página de Perfil

Este documento fornece um roteiro claro para implementar as funcionalidades futuras nas abas da página de perfil.

---

## 🏢 Aba 1: Empresas que Sigo

### Dados Necessários
```typescript
interface FollowedCompany {
  id: string
  name: string
  logo?: string
  category: string
  description?: string
  rating?: number
  reviews?: number
  city: string
  state: string
  phone?: string
  whatsapp?: string
}
```

### Passos para Implementar

1. **Criar serviço para buscar dados**
   ```typescript
   // src/lib/followed-companies-service.ts
   export async function getUserFollowedCompanies(userId: string) {
     const q = query(
       collection(db, 'users', userId, 'followedCompanies'),
       orderBy('createdAt', 'desc')
     )
     const snapshot = await getDocs(q)
     return snapshot.docs.map(doc => doc.data())
   }
   ```

2. **Criar componente FollowedCompanyCard**
   ```typescript
   // src/components/profile/FollowedCompanyCard.tsx
   export function FollowedCompanyCard({ company }: Props) {
     return (
       <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
         <img src={company.logo} alt={company.name} className="w-full h-32 object-cover rounded" />
         <h3 className="text-lg font-semibold mt-3">{company.name}</h3>
         <p className="text-sm text-gray-600">{company.category}</p>
         {/* Rating, buttons, etc */}
       </div>
     )
   }
   ```

3. **Atualizar FollowingCompaniesTab**
   ```typescript
   // src/components/profile/FollowingCompaniesTab.tsx
   import { useAuth } from '@/context/AuthContext'
   import { useEffect, useState } from 'react'
   
   export function FollowingCompaniesTab() {
     const { user } = useAuth()
     const [companies, setCompanies] = useState([])
     const [loading, setLoading] = useState(true)
     
     useEffect(() => {
       if (user) {
         getUserFollowedCompanies(user.id).then(setCompanies)
           .finally(() => setLoading(false))
       }
     }, [user])
     
     if (loading) return <LoadingSkeletons />
     if (companies.length === 0) return <EmptyState />
     
     return (
       <div className="grid grid-cols-2 gap-4 p-6">
         {companies.map(company => (
           <FollowedCompanyCard key={company.id} company={company} />
         ))}
       </div>
     )
   }
   ```

4. **Adicionar botão "Deixar de Seguir"**
   - Criar função: `unfollowCompany(userId, companyId)`
   - Chamar ao clicar em empresa
   - Remover da lista e Firestore

### Banco de Dados (Firestore)
```
users/{userId}/followedCompanies/{companyId}
├── name: string
├── logo: string (URL)
├── category: string
├── city: string
├── state: string
├── phone: string
├── whatsapp: string
├── description: string
├── createdAt: timestamp
└── rating: number (opcional)
```

---

## ❤️ Aba 2: Produtos de Interesse

### Dados Necessários
Usar dados do `Product` type que já existe em `src/types/index.ts`

### Passos para Implementar

1. **Conectar com FavoritesContext**
   ```typescript
   // src/components/profile/InterestedProductsTab.tsx
   import { useFavorites } from '@/contexts/FavoritesContext'
   
   export function InterestedProductsTab() {
     const { favorites, loading } = useFavorites()
     
     if (loading) return <LoadingSkeletons />
     if (favorites.length === 0) return <EmptyState />
     
     return (
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6">
         {favorites.map(product => (
           <ProductCard key={product.id} product={product} />
         ))}
       </div>
     )
   }
   ```

2. **Reutilizar ProductCard existente**
   - Componente já existe em `src/components/home/ProductCard.tsx`
   - Apenas importar e usar

3. **Adicionar ações**
   ```typescript
   // Dentro de cada card
   <button onClick={() => removeFavorite(product.id)}>
     ❌ Remover dos Favoritos
   </button>
   
   <button onClick={() => addToCart(product)}>
     🛒 Adicionar ao Carrinho
   </button>
   ```

4. **Estados diferentes**
   - Sem favoritos → Mensagem vazia
   - Carregando → Skeleton loaders
   - Com favoritos → Grid de produtos

---

## 🤝 Aba 3: Minha Afiliação

### Dados Necessários
```typescript
interface AffiliationData {
  status: 'active' | 'inactive' | 'pending'
  joinedDate: Date
  totalSales: number
  totalCommission: number
  salesHistory: Sale[]
  paymentHistory: Payment[]
}

interface Sale {
  id: string
  productName: string
  amount: number
  commission: number
  date: Date
  status: 'pending' | 'completed' | 'rejected'
}

interface Payment {
  id: string
  amount: number
  date: Date
  method: string
  status: 'pending' | 'paid' | 'failed'
}
```

### Passos para Implementar

1. **Criar serviço de afiliação**
   ```typescript
   // src/lib/affiliation-service.ts
   export async function getAffiliationData(userId: string) {
     const docRef = doc(db, 'users', userId, 'affiliation', 'data')
     const docSnap = await getDoc(docRef)
     return docSnap.data() as AffiliationData
   }
   ```

2. **Criar componentes visuais**
   ```typescript
   // AffiliationStats
   <div className="grid grid-cols-2 gap-4">
     <StatCard label="Total de Vendas" value="R$ 5.234,00" />
     <StatCard label="Comissões" value="R$ 523,40" />
     <StatCard label="Vendas Pendentes" value="3" />
     <StatCard label="Pagamentos Processados" value="12" />
   </div>
   
   // SalesHistory
   <table className="w-full">
     <tr>
       <th>Produto</th>
       <th>Valor</th>
       <th>Comissão</th>
       <th>Status</th>
     </tr>
     {sales.map(sale => (
       <tr key={sale.id}>
         <td>{sale.productName}</td>
         <td>R$ {sale.amount}</td>
         <td>R$ {sale.commission}</td>
         <td><Badge status={sale.status} /></td>
       </tr>
     ))}
   </table>
   ```

3. **Implementar filtros**
   - Período de datas
   - Status (Pendente, Completo, Rejeitado)
   - Ordenação (Recente, Maior valor)

4. **Adicionar link para painel**
   ```typescript
   <Link href="https://painel-afiliado.xeco.com.br" target="_blank">
     📊 Ver Painel Completo
   </Link>
   ```

---

## 📝 Como Estruturar os Serviços

### Padrão de Serviço

```typescript
// src/lib/profile-services-template.ts

import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Interface
interface YourData {
  id: string
  // ... campos
}

// Buscar dados
export async function getYourData(userId: string): Promise<YourData[]> {
  try {
    const q = query(
      collection(db, 'your-collection'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YourData))
  } catch (error) {
    console.error('Erro ao buscar dados:', error)
    return []
  }
}

// Criar dados
export async function createYourData(userId: string, data: Partial<YourData>) {
  // ...
}

// Atualizar dados
export async function updateYourData(id: string, data: Partial<YourData>) {
  // ...
}

// Deletar dados
export async function deleteYourData(id: string) {
  // ...
}
```

---

## 🎨 Componentes Reutilizáveis para Usar

### Já Existem:
- `ProductCard` - Para exibir produtos
- `CompanyCard` - Para exibir empresas
- `Button` - Componente de botão
- `LoadingSpinner` - Para estados de carregamento

### Precisam Ser Criados:
- `StatCard` - Para métricas (ex: total de vendas)
- `Badge` - Para status (ativo, inativo, pendente)
- `EmptyState` - Para estados vazios personalizados
- `SkeletonLoader` - Para loading state

---

## 📱 Responsividade

Sempre usar:
```typescript
<div className="
  grid 
  grid-cols-1      // Mobile: 1 coluna
  sm:grid-cols-2   // Tablet: 2 colunas
  lg:grid-cols-3   // Desktop: 3 colunas
  gap-4
">
```

---

## 🧪 Como Testar

```typescript
// No seu componente
import { useAuth } from '@/context/AuthContext'

export function MyTab() {
  const { user } = useAuth()
  
  useEffect(() => {
    if (user) {
      console.log('Buscando dados para userId:', user.id)
      // Chamar serviço
    }
  }, [user])
}
```

1. Abra o navegador em DevTools
2. Vá até a página de perfil
3. Abra a aba Console
4. Veja os logs de depuração
5. Verifique o Firestore se os dados estão lá

---

## 🚀 Ordem Recomendada de Implementação

1. ✅ **Aba 1: Empresas que Sigo** (mais simples)
   - Cria padrão para as outras
   - Similar ao CompanyCard

2. ✅ **Aba 2: Produtos de Interesse** (média)
   - Reutiliza ProductCard existente
   - Integra com FavoritesContext

3. ✅ **Aba 3: Minha Afiliação** (mais complexa)
   - Mais dados
   - Tabelas e gráficos
   - Integração com sistema de afiliados

---

## 💡 Dicas Importantes

1. **Sempre validar autenticação**
   ```typescript
   const { user } = useAuth()
   if (!user) return null
   ```

2. **Sempre tratar erros**
   ```typescript
   try {
     // fetch data
   } catch (error) {
     console.error('Erro:', error)
     setError('Falha ao carregar dados')
   }
   ```

3. **Sempre usar loading state**
   ```typescript
   if (loading) return <Skeleton />
   if (error) return <ErrorState />
   if (data.length === 0) return <EmptyState />
   ```

4. **Sempre otimizar queries**
   - Use índices no Firestore
   - Limite resultados (ex: últimos 50)
   - Pagine se necessário

5. **Sempre testar responsividade**
   - Desktop (1024px+)
   - Tablet (768px)
   - Mobile (375px)

---

## 📚 Referências

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS Grid](https://tailwindcss.com/docs/grid-template-columns)
- [Projeto: Existing ProductCard](./src/components/home/ProductCard.tsx)
- [Projeto: Existing CompanyCard](./src/components/home/CompanyCard.tsx)

---

**Status**: 📌 Guia completo para expandir a página de perfil!