# 🔄 Refatoração de Favoritos - LikedCompany e LikedProduct

## Resumo das Mudanças

Esta refatoração muda completamente a arquitetura de favoritos do sistema, usando as collections reais do Firestore: `LikedCompany` e `LikedProduct`.

## ❌ O que foi removido/descontinuado

- ❌ `users/{userId}/favoriteCompanies/` (subcollection do usuário)
- ❌ `users/{userId}/followedCompanies/` (subcollection do usuário)
- ❌ `FavoritesContext` (antigo contexto genérico)
- ❌ `/src/lib/followed-companies-service.ts` (serviço antigo)

## ✅ O que foi adicionado

### Services (Lib)
- ✅ `/src/lib/liked-company-service.ts` - Gerencia favoritos de empresas
- ✅ `/src/lib/liked-product-service.ts` - Gerencia favoritos de produtos

### Contexts
- ✅ `/src/contexts/LikedCompanyContext.tsx` - State management para empresas
- ✅ `/src/contexts/LikedProductContext.tsx` - State management para produtos

### Componentes Atualizados
- ✅ `FavoriteCompanyButton.tsx` - Usa novo contexto de empresas
- ✅ `FavoriteProductButton.tsx` - Novo componente para produtos

### Componentes de Perfil Atualizados
- ✅ `FollowingCompaniesTab.tsx` - Usa `LikedCompanyContext`
- ✅ `InterestedProductsTab.tsx` - Usa `LikedProductContext`

### Layout
- ✅ `/src/app/layout.tsx` - Providers adicionados para os novos contextos

---

## 🏗️ Estrutura do Firestore

### Collection: LikedCompany
```json
{
  "company_id": "/companies/lLYhN85Dr6tNLMdzeCb2",
  "user_id": "/users/z9pTLSk3h0W1YE22kylqbm7WcZr2",
  "liked": "SIM" | "NAO",
  "created_at": "2025-08-11T17:48:59-03:00",
  "created_location": [-15.7975154, -47.89188739999999]
}
```

### Collection: LikedProduct
```json
{
  "product_id": "/product/hQ7XPmoEiBefIgfrpxgI",
  "company_id": "/companies/KqpN54cmE0jG8pQp056M",
  "user_id": "/users/c8rUV8y06XhfYW3h58BO5oxBl0u1",
  "liked": "SIM" | "NAO",
  "created_at": "2025-08-14T12:15:25-03:00",
  "created_location": [-15.7975154, -47.89188739999999]
}
```

---

## 🔑 Conceitos-Chave

### 1. UPSERT Logic
Quando o usuário favorita algo:
- Se já existe registro → Atualiza `liked` para "SIM"
- Se não existe → Cria novo registro com `liked: "SIM"`

### 2. Histórico Preservado
Quando o usuário desfavorita:
- ❌ NÃO deleta o registro
- ✅ Apenas atualiza `liked` para "NAO"
- Permite análise de histórico de interesses do usuário

### 3. Busca de Dados
Sempre que busca favoritos:
- Filtra por `user_id` + `liked == "SIM"`
- Para cada resultado, faz fetch completo dos dados (empresa/produto)
- Retorna objetos completos com todas as informações

---

## 🔧 Funções Principais

### liked-company-service.ts

```typescript
getFavoredCompanies(userId: string): Promise<Company[]>
// Busca todas as empresas favoritadas (liked = SIM)

onFavoredCompaniesChange(userId: string, callback, onError?)
// Real-time listener para sincronização em tempo real

favoriteCompany(userId: string, companyId: string, location?)
// UPSERT: Favorita uma empresa (cria ou atualiza)

unfavoriteCompany(userId: string, companyId: string)
// Desfavorita uma empresa (atualiza liked para NAO)

isCompanyFavored(userId: string, companyId: string)
// Verifica se uma empresa está favoritada
```

### liked-product-service.ts

```typescript
getFavoredProducts(userId: string): Promise<Product[]>
// Busca todos os produtos favoritados (liked = SIM)

onFavoredProductsChange(userId: string, callback, onError?)
// Real-time listener para sincronização em tempo real

favoriteProduct(userId: string, productId: string, companyId: string, location?)
// UPSERT: Favorita um produto (cria ou atualiza)

unfavoriteProduct(userId: string, productId: string)
// Desfavorita um produto (atualiza liked para NAO)

isProductFavored(userId: string, productId: string)
// Verifica se um produto está favoritado
```

---

## 📊 Contextos

### LikedCompanyContext
```typescript
interface LikedCompanyContextType {
  favoredCompanies: Company[]       // Empresas favoritadas
  loading: boolean                   // Estado de carregamento
  error: string | null               // Mensagens de erro
  favoriteCompany(companyId: string, location?)    // Favorita
  unfavoriteCompany(companyId: string)             // Desfavorita
  isFavored(companyId: string): boolean            // Verifica
}
```

### LikedProductContext
```typescript
interface LikedProductContextType {
  favoredProducts: Product[]        // Produtos favoritados
  loading: boolean                   // Estado de carregamento
  error: string | null               // Mensagens de erro
  favoriteProduct(productId, companyId, location?)  // Favorita
  unfavoriteProduct(productId: string)              // Desfavorita
  isFavored(productId: string): boolean             // Verifica
}
```

---

## 🚀 Como Usar

### Em um Componente

```typescript
'use client'

import { useLikedCompanyContext } from '@/contexts/LikedCompanyContext'
import { useLikedProductContext } from '@/contexts/LikedProductContext'

export function MyComponent() {
  // Para empresas
  const { favoredCompanies, favoriteCompany, unfavoriteCompany, isFavored } = useLikedCompanyContext()
  
  // Para produtos
  const { favoredProducts, favoriteProduct, unfavoriteProduct, isFavored: isProductFavored } = useLikedProductContext()
  
  // Exemplo de uso
  const handleFavorite = async (companyId: string) => {
    try {
      await favoriteCompany(companyId)
      console.log('✅ Empresa favoritada!')
    } catch (error) {
      console.error('❌ Erro:', error)
    }
  }
  
  return (
    <div>
      {favoredCompanies.map(company => (
        <div key={company.id}>
          <h3>{company.name}</h3>
          <button onClick={() => handleFavorite(company.id)}>
            {isFavored(company.id) ? 'Favoritado ❤️' : 'Favoritar'}
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## 📋 Checklist de Migração

- ✅ Services criadas com UPSERT logic
- ✅ Real-time listeners implementados
- ✅ Contextos criados
- ✅ Layout.tsx atualizado com providers
- ✅ Abas do perfil migrads
- ✅ Botão de favoritar para empresas migrado
- ✅ Botão de favoritar para produtos criado
- ⏳ Implementar botões Like nos cards de empresa/produto (páginas específicas)
- ⏳ Testar end-to-end com dados reais

---

## ⚠️ Importante

### Não há mais "Favoritos genéricos"
- Antes: Tudo era armazenado em `favoriteCompanies`
- Agora: Empresas e Produtos têm collections separadas e bem definidas

### Histórico Preservado
- Os usuários podem ter registros com `liked: "NAO"` 
- Esses registros são MANTIDOS propositalmente
- Servirão para análise de ofertas personalizadas no futuro

### Real-time Sync
- Ao favoritar em uma aba, outros componentes veem a mudança automaticamente
- Sem necessidade de refresh ou recarga de página

---

## 🔍 Debug/Testes

### Console Logs
```typescript
// Ao favoritar
✅ Empresa favoritada (novo registro criado)
✅ Empresa favoritada (registro atualizado)

// Ao desfavoritar
❌ Empresa desfavoritada (histórico mantido)

// Ao buscar
✅ Encontradas 3 empresas favoritadas
✅ Encontrados 5 produtos favoritados
```

### Queries de Teste no Firestore
```
// Buscar todos os likes de um usuário
collection: LikedCompany
where: user_id == "/users/USER_ID"

// Buscar apenas favorites
where: user_id == "/users/USER_ID"
where: liked == "SIM"

// Buscar histórico completo
where: user_id == "/users/USER_ID"
where: liked == "NAO"
```
