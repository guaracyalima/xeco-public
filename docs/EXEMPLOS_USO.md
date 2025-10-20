# 💡 Exemplos de Uso - LikedCompany e LikedProduct

## 🏢 Usando LikedCompanyContext

### Exemplo 1: Botão de Favoritar em um Card

```typescript
'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'
import { Heart } from 'lucide-react'

export function CompanyCardWithFavorite({ company }) {
  const { isFavored, favoriteCompany, unfavoriteCompany } = useLikedCompanyContext()
  const isFav = isFavored(company.id)

  const handleToggle = async () => {
    try {
      if (isFav) {
        await unfavoriteCompany(company.id)
      } else {
        await favoriteCompany(company.id)
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  return (
    <div className="card">
      <h3>{company.name}</h3>
      <button
        onClick={handleToggle}
        className={isFav ? 'bg-coral-50' : 'bg-gray-50'}
      >
        <Heart fill={isFav ? 'currentColor' : 'none'} />
        {isFav ? 'Favoritado' : 'Favoritar'}
      </button>
    </div>
  )
}
```

### Exemplo 2: Listar Empresas Favoritadas

```typescript
'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'

export function MyFavoritedCompanies() {
  const { favoredCompanies, loading, error } = useLikedCompanyContext()

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <h2>Minhas Empresas Favoritadas ({favoredCompanies.length})</h2>
      {favoredCompanies.length === 0 ? (
        <p>Nenhuma empresa favoritada ainda</p>
      ) : (
        <ul>
          {favoredCompanies.map(company => (
            <li key={company.id}>
              <h3>{company.name}</h3>
              <p>{company.city}, {company.state}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Exemplo 3: Verificar se Empresa está Favoritada

```typescript
'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'

export function CompanyDetails({ companyId }) {
  const { isFavored, favoriteCompany, unfavoriteCompany } = useLikedCompanyContext()
  const isFav = isFavored(companyId)

  return (
    <div>
      <p>Status: {isFav ? '❤️ Favoritada' : '🤍 Não favoritada'}</p>
      <button onClick={() => 
        isFav 
          ? unfavoriteCompany(companyId) 
          : favoriteCompany(companyId)
      }>
        {isFav ? 'Remover favorito' : 'Adicionar favorito'}
      </button>
    </div>
  )
}
```

---

## 📦 Usando LikedProductContext

### Exemplo 1: Botão de Favoritar em um Produto

```typescript
'use client'

import { useLikedProductContext } from '@/contexts/LikedProductContext'
import { Heart } from 'lucide-react'

export function ProductCardWithFavorite({ product, companyId }) {
  const { isFavored, favoriteProduct, unfavoriteProduct } = useLikedProductContext()
  const isFav = isFavored(product.id)

  const handleToggle = async () => {
    try {
      if (isFav) {
        await unfavoriteProduct(product.id)
      } else {
        await favoriteProduct(product.id, companyId)
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  return (
    <div className="product-card">
      <img src={product.imagesUrl[0]} alt={product.name} />
      <h3>{product.name}</h3>
      <p className="price">R$ {product.salePrice}</p>
      <button
        onClick={handleToggle}
        className={isFav ? 'liked' : 'not-liked'}
      >
        <Heart fill={isFav ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
```

### Exemplo 2: Dashboard de Produtos Favoritados

```typescript
'use client'

import { useLikedProductContext } from '@/contexts/LikedProductContext'

export function FavoritedProductsDashboard() {
  const { favoredProducts, loading, error } = useLikedProductContext()

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const totalPrice = favoredProducts.reduce((sum, p) => sum + p.salePrice, 0)

  return (
    <div className="dashboard">
      <div className="stats">
        <div>Total de Produtos: {favoredProducts.length}</div>
        <div>Valor Total: R$ {totalPrice.toFixed(2)}</div>
      </div>

      <div className="products-grid">
        {favoredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
```

### Exemplo 3: Sincronização em Tempo Real

```typescript
'use client'

import { useLikedProductContext } from '@/contexts/LikedProductContext'
import { useEffect, useState } from 'react'

export function RealtimeFavoritesDemo() {
  const { favoredProducts, loading } = useLikedProductContext()
  const [count, setCount] = useState(0)

  // Este useEffect será disparado toda vez que favoredProducts mudar
  // Isso acontece automaticamente quando outro componente favorita algo
  useEffect(() => {
    setCount(favoredProducts.length)
    console.log('✅ Produtos atualizados:', favoredProducts.length)
  }, [favoredProducts])

  return (
    <div>
      <h2>Você tem {count} produtos favoritados</h2>
      <p>Abra outra aba e favorite um produto para ver essa contagem atualizar em tempo real!</p>
    </div>
  )
}
```

---

## 🔄 Exemplos Avançados

### Exemplo 1: Favoritar com Localização

```typescript
'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'

export function FavoriteWithLocation() {
  const { favoriteCompany } = useLikedCompanyContext()

  const handleFavoriteWithLocation = async (companyId) => {
    // Obter localização do usuário
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = [position.coords.latitude, position.coords.longitude]
        favoriteCompany(companyId, location)
        console.log('✅ Empresa favoritada com localização:', location)
      },
      (error) => {
        // Favoritar sem localização se usuário recusar
        favoriteCompany(companyId)
        console.log('⚠️ Sem permissão de localização')
      }
    )
  }

  return (
    <button onClick={() => handleFavoriteWithLocation('company123')}>
      Favoritar com Localização
    </button>
  )
}
```

### Exemplo 2: Condicional - Mostrar Botão Apenas se Não Favoritado

```typescript
'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'

export function PromoteBtnIfNotFavored({ companyId, companyName }) {
  const { isFavored, favoriteCompany } = useLikedCompanyContext()

  // Não mostrar botão se já está favoritado
  if (isFavored(companyId)) {
    return <p>✅ Você já está acompanhando esta empresa</p>
  }

  return (
    <button
      onClick={() => favoriteCompany(companyId)}
      className="bg-coral-500 hover:bg-coral-600 text-white px-6 py-2 rounded"
    >
      ⭐ Acompanhar {companyName}
    </button>
  )
}
```

### Exemplo 3: Integração com Múltiplas Abas

```typescript
'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'
import { useLikedProductContext } from '@/contexts/LikedProductContext'

export function FavoritesOverview() {
  const { favoredCompanies } = useLikedCompanyContext()
  const { favoredProducts } = useLikedProductContext()

  return (
    <div className="overview">
      <div>
        <h3>📊 Teus Favoritos</h3>
        <p>Empresas: {favoredCompanies.length}</p>
        <p>Produtos: {favoredProducts.length}</p>
        <p>Total: {favoredCompanies.length + favoredProducts.length}</p>
      </div>
    </div>
  )
}
```

---

## ❌ Como Usar (Services Diretas)

### Usando Services Diretamente

```typescript
// Não recomendado em componentes (use Context em vez disso)
// Mas útil para server-side operations

import { getFavoredCompanies, favoriteCompany } from '@/lib/liked-company-service'

// Buscar empresas favoritadas
const companies = await getFavoredCompanies(userId)

// Favoritar uma empresa
await favoriteCompany(userId, companyId)

// Verificar se está favoritada
const isFav = await isCompanyFavored(userId, companyId)
```

---

## 🎯 Padrões Recomendados

### ✅ Bom: Usar Context em Componentes Client

```typescript
'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'

export function GoodExample() {
  const { favoredCompanies } = useLikedCompanyContext()
  // ✅ Reutiliza contexto
  // ✅ Real-time sync automático
  // ✅ Sem necessidade de fetch manual
}
```

### ❌ Ruim: Chamar Serviços Diretamente em Componentes

```typescript
'use client'

import { getFavoredCompanies } from '@/lib/liked-company-service'

export function BadExample({ userId }) {
  useEffect(() => {
    // ❌ Fetch manual
    // ❌ Sem real-time sync
    // ❌ Duplicação de código
    // ❌ Sem tratamento de erro global
    getFavoredCompanies(userId).then(/* ... */)
  }, [userId])
}
```

---

## 🧪 Testando

### Mock para Testes

```typescript
// Mock do contexto para testes
const mockContext = {
  favoredCompanies: [
    { id: '1', name: 'Company A' },
    { id: '2', name: 'Company B' }
  ],
  loading: false,
  error: null,
  favoriteCompany: jest.fn(),
  unfavoriteCompany: jest.fn(),
  isFavored: (id) => ['1', '2'].includes(id)
}

// Renderizar componente com mock
render(
  <LikedCompanyContext.Provider value={mockContext}>
    <YourComponent />
  </LikedCompanyContext.Provider>
)
```

---

## 🚀 Performance Tips

1. **Use `isFavored()` para validação rápida**
   ```typescript
   // Rápido - busca no array em memória
   const isFav = isFavored(companyId)
   ```

2. **Evite re-renders desnecessários com useMemo**
   ```typescript
   const favoritedIds = useMemo(
     () => favoredCompanies.map(c => c.id),
     [favoredCompanies]
   )
   ```

3. **Lazy load de imagens em listas grandes**
   ```typescript
   <img loading="lazy" src={company.logo} />
   ```

---

## 📚 Referências

- `FavoriteCompanyButton.tsx` - Componente completo de botão
- `FavoriteProductButton.tsx` - Componente para produtos
- `LikedCompanyContext.tsx` - Implementação do contexto
- `FollowingCompaniesTab.tsx` - Exemplo de lista
- `InterestedProductsTab.tsx` - Exemplo de lista de produtos
