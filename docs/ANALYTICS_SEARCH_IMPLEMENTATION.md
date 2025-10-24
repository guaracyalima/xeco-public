# Implementação de Analytics para Busca - Xeco Public

## 📊 Visão Geral

Este documento detalha a implementação completa de analytics para a funcionalidade de busca no sistema Xeco Public, incluindo rastreamento de comportamento do usuário, interesses e padrões de navegação.

## ✅ Eventos Implementados

### 1. **Busca Inicial (SEARCH)**
**Localização:** `/src/app/search/page.tsx` + `/src/components/home/HeroSection.tsx`

**Quando dispara:**
- Usuário digita e pressiona Enter ou clica no botão de busca
- Usuário navega para a página de resultados

**Dados capturados:**
```typescript
{
  query: string,              // Termo buscado
  resultsCount: number,       // Quantidade de resultados
  city: string,               // Cidade do usuário
  state: string,              // Estado do usuário
  searchType: 'all' | 'products' | 'companies',
  source: 'hero_section' | 'search_page'
}
```

**Insights gerados:**
- Termos mais buscados
- Localização dos usuários que buscam
- Tipo de conteúdo preferido (produtos vs empresas)
- Origem da busca

---

### 2. **Visualização de Resultados (SEARCH_RESULTS_VIEW)**
**Localização:** `/src/app/search/page.tsx` (loadProducts, loadCompanies)

**Quando dispara:**
- Após carregar resultados de produtos
- Após carregar resultados de empresas
- Apenas na primeira carga (não em infinite scroll)

**Dados capturados:**
```typescript
{
  query: string,              // Termo buscado
  resultsCount: number,       // Quantidade de resultados encontrados
  hasResults: boolean,        // Se teve ou não resultados
  category: 'search'
}
```

**Insights gerados:**
- Taxa de busca sem resultados (zero results)
- Queries que geram mais/menos resultados
- Efetividade da busca

---

### 3. **Filtro Aplicado (FILTER_APPLIED)**
**Localização:** `/src/app/search/page.tsx` (botões de filtro)

**Quando dispara:**
- Usuário clica em "Todos", "Produtos" ou "Empresas"

**Dados capturados:**
```typescript
{
  filterType: 'search_type',
  filterValue: 'all' | 'products' | 'companies',
  category: 'search',
  label: string
}
```

**Insights gerados:**
- Preferência de visualização dos usuários
- Padrões de navegação entre filtros
- Taxa de uso de cada filtro

---

### 4. **Clique em Produto (PRODUCT_CLICK)**
**Localização:** `/src/components/home/ProductCard.tsx`

**Quando dispara:**
- Usuário clica em um card de produto nos resultados

**Dados capturados:**
```typescript
{
  productId: string,
  productName: string,
  price: number,
  companyId: string,
  location: 'product_card',
  source: 'featured_products' | 'search_results'
}
```

**Insights gerados:**
- Produtos mais clicados em buscas
- CTR (Click-Through Rate) de produtos
- Correlação entre busca e produto clicado
- Faixa de preço mais atrativa

---

### 5. **Visualização de Produto (PRODUCT_VIEW)**
**Localização:** Páginas de produto individual

**Insights gerados:**
- Produtos mais visualizados após busca
- Tempo médio em produto vindo de busca
- Taxa de conversão busca → visualização

---

### 6. **Contato com Empresa (WHATSAPP_CONTACT, PHONE_CLICK)**
**Localização:** `/src/components/home/CompanyCard.tsx`

**Quando dispara:**
- Usuário clica em WhatsApp ou telefone no card da empresa

**Dados capturados:**
```typescript
{
  companyId: string,
  companyName: string,
  contactType: 'whatsapp' | 'phone',
  source: 'search_results'
}
```

**Insights gerados:**
- Empresas que mais recebem contatos via busca
- Preferência de canal de contato
- Taxa de conversão busca → contato

---

## 📈 Análises Possíveis

### 1. **Funil de Busca**
```
Busca Iniciada (SEARCH)
    ↓
Resultados Visualizados (SEARCH_RESULTS_VIEW)
    ↓
Produto/Empresa Clicado (PRODUCT_CLICK / Company navigation)
    ↓
Visualização Detalhada (PRODUCT_VIEW / COMPANY_PROFILE_VIEW)
    ↓
Ação (ADD_TO_CART / WHATSAPP_CONTACT)
```

### 2. **Métricas de Performance de Busca**

| Métrica | Cálculo | Insight |
|---------|---------|---------|
| **Zero Results Rate** | (Buscas sem resultado / Total de buscas) × 100 | Qualidade do catálogo |
| **Search CTR** | (Cliques / Visualizações) × 100 | Relevância dos resultados |
| **Search Conversion Rate** | (Ações / Buscas) × 100 | Efetividade geral |
| **Avg Results per Search** | Total de resultados / Total de buscas | Amplitude do catálogo |

### 3. **Segmentação de Usuários por Busca**

**Pesquisadores (Researchers):**
- Múltiplas buscas sem conversão
- Uso frequente de filtros
- Tempo alto em resultados

**Compradores Diretos (Direct Buyers):**
- Poucas buscas
- Alta taxa de conversão
- Clique rápido em resultados

**Exploradores (Browsers):**
- Buscas variadas
- Alteração frequente de localização
- Diversidade de categorias

---

## 🎯 Dados Capturados por Evento

### Contexto Automático (em todos os eventos)

```typescript
{
  // Sessão
  sessionId: string,
  userId?: string,
  timestamp: Timestamp,
  
  // Dispositivo
  deviceType: 'mobile' | 'tablet' | 'desktop',
  browser: string,
  os: string,
  screenResolution: string,
  
  // Localização
  userCity?: string,
  userState?: string,
  userCountry: 'BR',
  
  // Página
  currentPage: string,
  referrer: string,
  
  // Segmentação
  userSegments: UserSegment[]
}
```

---

## 🔍 Queries de Análise Úteis (Firestore)

### 1. Top 10 Termos Buscados
```typescript
collection('user_events')
  .where('eventName', '==', 'search')
  .where('timestamp', '>=', lastMonth)
  .orderBy('timestamp', 'desc')
  .limit(1000)
// Depois agregar por query no client
```

### 2. Buscas Sem Resultado
```typescript
collection('user_events')
  .where('eventName', '==', 'search_results_view')
  .where('eventData.hasResults', '==', false)
  .where('timestamp', '>=', lastWeek)
```

### 3. Produtos Mais Clicados via Busca
```typescript
collection('user_events')
  .where('eventName', '==', 'product_click')
  .where('eventData.source', '==', 'search_results')
  .where('timestamp', '>=', lastMonth)
  .orderBy('timestamp', 'desc')
// Agregar por productId
```

### 4. Cidades que Mais Buscam
```typescript
collection('user_events')
  .where('eventName', '==', 'search')
  .where('timestamp', '>=', lastMonth)
// Agregar por locationInfo.city
```

---

## 📱 Implementação Técnica

### Arquivo Principal
`/src/app/search/page.tsx`

### Hooks Utilizados
- `useSearchAnalytics()` - `/src/hooks/useAnalytics.ts`
- `useProductAnalytics()` - Para cliques em produtos
- `useCompanyAnalytics()` - Para contatos com empresas

### Serviço de Analytics
`/src/services/analyticsService.ts`

### Tipos de Eventos
`/src/types/analytics.ts`

---

## 🚀 Próximas Melhorias Sugeridas

### 1. **Autocomplete Analytics**
- Rastrear sugestões mostradas
- Rastrear sugestões clicadas
- Identificar termos parciais populares

### 2. **Busca Avançada**
- Rastrear uso de filtros específicos (preço, categoria, etc.)
- Rastrear combinações de filtros
- Rastrear ordenação aplicada

### 3. **Search Refinement**
- Rastrear quando usuário refina busca
- Rastrear mudança de localização
- Rastrear termos relacionados buscados em sequência

### 4. **Infinite Scroll Analytics**
- Rastrear profundidade do scroll
- Rastrear quantas "páginas" de resultados visualizadas
- Taxa de engajamento por posição do resultado

### 5. **A/B Testing de Busca**
- Testar diferentes algoritmos de relevância
- Testar diferentes layouts de resultados
- Testar ordem de produtos vs empresas

### 6. **Search Performance**
- Tempo de resposta da busca
- Tempo até primeiro clique
- Taxa de abandono durante carregamento

---

## 📊 Dashboard Sugerido (Análise de Busca)

### Cards Principais
1. **Total de Buscas (período)**
2. **Taxa de Zero Results**
3. **CTR Médio de Busca**
4. **Conversão de Busca**

### Gráficos
1. **Buscas ao longo do tempo** (linha)
2. **Top 20 Termos Buscados** (barra)
3. **Distribuição por Localização** (mapa/barra)
4. **Funil de Busca** (funil)
5. **Produtos Mais Clicados via Busca** (tabela)
6. **Empresas Mais Contactadas via Busca** (tabela)

---

## 🔐 Privacidade e LGPD

### Dados Pessoais Coletados
- Localização (cidade/estado) - **consentimento implícito por funcionalidade**
- Termos de busca - **dados comportamentais anonimizados**
- Cliques e navegação - **dados comportamentais anonimizados**

### Conformidade
✅ Dados anonimizados quando possível  
✅ Session-based tracking (não persistente cross-device sem login)  
✅ Consentimento de analytics no primeiro acesso  
✅ Possibilidade de opt-out via `setAnalyticsConsent(false)`

---

## 📝 Notas de Implementação

### Performance
- Eventos enviados de forma **assíncrona** (não bloqueiam UI)
- **Debounce** de 1 segundo para evitar eventos duplicados
- Cache de sessão para reduzir writes no Firestore

### Debugging
- Logs de console em desenvolvimento com prefixo `[ANALYTICS]`
- Eventos aparecem no console antes de enviar
- Erros de analytics não quebram a aplicação

### Testes
- Verificar `AnalyticsTest.tsx` para testar eventos manualmente
- Verificar Firestore Collection `user_events` para confirmar dados
- Usar Chrome DevTools para verificar network requests (se integrado com GA)

---

## 🎓 Como Usar os Dados

### Para Product Manager
- Identificar gaps no catálogo (buscas sem resultado)
- Priorizar categorias mais buscadas
- Entender jornada do usuário

### Para Marketing
- Otimizar SEO com termos mais buscados
- Criar campanhas baseadas em interesses locais
- Identificar produtos/empresas para destacar

### Para Desenvolvimento
- Melhorar algoritmo de busca baseado em CTR
- Priorizar features mais usadas
- Otimizar performance de queries lentas

---

## 📧 Contato

Para dúvidas sobre a implementação de analytics:
- Documentação: `/docs/README_DOCS.md`
- Testes: `/src/components/test/AnalyticsTest.tsx`
- Tipos: `/src/types/analytics.ts`

---

**Última atualização:** 24 de outubro de 2025  
**Status:** ✅ Implementado e funcional  
**Build:** ✅ Passando (v15.5.5)
