# 🎯 Guia Rápido - Analytics Xeco Public

## Como Usar os Analytics

### Para Product Managers

#### 1. Entender o que os usuários buscam
```typescript
// Firestore Console → user_events
// Filtrar: eventName == 'search'
// Agrupar por: eventData.query
```

**Use para:**
- Identificar produtos/categorias em falta
- Priorizar roadmap de produtos
- Criar campanhas de marketing direcionadas

---

#### 2. Identificar buscas sem resultado
```typescript
// Firestore Console → user_events
// Filtrar: eventName == 'search_results_view' AND eventData.hasResults == false
```

**Use para:**
- Encontrar gaps no catálogo
- Melhorar algoritmo de busca
- Adicionar sinônimos/variações

---

#### 3. Medir engajamento por região
```typescript
// Firestore Console → user_events
// Filtrar: eventName == 'search'
// Agrupar por: locationInfo.userCity
```

**Use para:**
- Focar esforços de aquisição
- Identificar mercados promissores
- Planejar expansão regional

---

### Para Marketing

#### 1. Termos para SEO
```typescript
// Top 20 queries do mês
// Usar para otimizar:
// - Meta descriptions
// - Títulos de páginas
// - Conteúdo do blog
```

---

#### 2. Campanhas por Região
```typescript
// Buscas por cidade/estado
// Criar campanhas:
// - Google Ads locais
// - Facebook Ads segmentado
// - Parcerias regionais
```

---

#### 3. Produtos em Destaque
```typescript
// Produtos mais clicados via busca
// Destacar em:
// - Home page
// - Email marketing
// - Redes sociais
```

---

### Para Desenvolvimento

#### 1. Adicionar Novo Evento

```typescript
// 1. Importar hook
import { useAnalytics } from '@/hooks/useAnalytics'
import { EventName } from '@/types/analytics'

// 2. No componente
const { trackEvent } = useAnalytics()

// 3. Disparar evento
trackEvent(EventName.BUTTON_CLICK, {
  eventData: {
    buttonName: 'ver_mais',
    category: 'navigation',
    label: 'ver_mais_produtos'
  }
})
```

---

#### 2. Usar Hook Especializado

```typescript
// Busca
const { trackSearch, trackSearchResults } = useSearchAnalytics()
trackSearch('notebook', 15, { city: 'São Paulo', state: 'SP' })

// Produtos
const { trackProductView, trackProductClick } = useProductAnalytics()
trackProductClick(productId, productName, { price: 1500 })

// Empresas
const { trackCompanyContact } = useCompanyAnalytics()
trackCompanyContact(company, 'whatsapp')
```

---

#### 3. Criar Novo Hook Customizado

```typescript
// /src/hooks/useAnalytics.ts
export function useMeuNovoHook() {
  const { trackEvent } = useAnalytics()
  
  const trackMeuEvento = useCallback((data: any) => {
    trackEvent(EventName.MEU_EVENTO, {
      eventData: {
        ...data,
        category: 'minha_categoria'
      }
    })
  }, [trackEvent])
  
  return { trackMeuEvento }
}
```

---

## Queries Úteis

### Firebase Console (Firestore)

#### Buscas do Último Mês
```
Collection: user_events
Filter: eventName == search
Filter: timestamp >= [data_1_mes_atras]
Order by: timestamp desc
```

#### Taxa de Conversão
```
// 1. Contar buscas
Collection: user_events
Filter: eventName == search
Count: X

// 2. Contar conversões (add_to_cart)
Collection: user_events
Filter: eventName == add_to_cart
Count: Y

// Taxa = (Y / X) × 100
```

#### Produtos Mais Populares
```
Collection: user_events
Filter: eventName == product_click
Filter: eventData.source == search_results
Order by: timestamp desc
Limit: 100
// Agrupar por productId manualmente
```

---

## Performance

### Otimizações Implementadas

✅ **Debounce de 1 segundo** - Evita eventos duplicados  
✅ **Envio assíncrono** - Não bloqueia UI  
✅ **Cache de sessão** - Reduz writes no Firestore  
✅ **Batch quando possível** - Menos custos  

### Custos Estimados (Firestore)

- **Writes por usuário/dia:** ~20-30
- **Reads para dashboard:** ~1000/dia
- **Custo mensal (10k usuários):** ~$30-50 USD

---

## Debugging

### Ver Eventos no Console

```typescript
// Ativar logs em desenvolvimento
localStorage.setItem('debug_analytics', 'true')

// Desativar
localStorage.removeItem('debug_analytics')
```

### Testar Manualmente

```typescript
// Abrir /src/components/test/AnalyticsTest.tsx
// Clicar nos botões de teste
// Verificar Firestore Collection
```

### Verificar Google Analytics (se configurado)

```javascript
// Console do browser
window.gtag('event', 'test', { test: true })

// Verificar no GA Real-Time
```

---

## Segmentação Automática

### Como Funciona

O sistema automaticamente segmenta usuários baseado em comportamento:

```typescript
// Comprador frequente
if (purchases > 3 in last_month) → BUYER

// Pesquisador
if (searches > 10 && purchases == 0) → RESEARCHER

// Empresário
if (has_company) → BUSINESS_OWNER

// Visitante
if (no_account) → VISITOR
```

### Usar Segmentos

```typescript
// Filtrar por segmento
Collection: user_events
Filter: userSegments array-contains BUYER
```

---

## FAQ

### P: Os eventos são enviados em tempo real?
**R:** Sim, mas de forma assíncrona para não bloquear a UI.

### P: Quanto custa?
**R:** ~$30-50/mês para 10k usuários ativos (Firestore).

### P: Posso exportar os dados?
**R:** Sim, via Firestore export ou criar função de exportação customizada.

### P: É LGPD compliant?
**R:** Sim, dados anonimizados, consentimento implementado, opt-out disponível.

### P: Posso integrar com Google Analytics?
**R:** Sim, já tem suporte via `window.gtag()` no serviço.

### P: Como adicionar evento customizado?
**R:** Ver seção "Adicionar Novo Evento" acima.

---

## Cheat Sheet

```typescript
// Import básico
import { useAnalytics } from '@/hooks/useAnalytics'
import { EventName } from '@/types/analytics'

// Evento simples
const { trackEvent } = useAnalytics()
trackEvent(EventName.BUTTON_CLICK, {
  eventData: { buttonName: 'test' }
})

// Busca
const { trackSearch } = useSearchAnalytics()
trackSearch(query, resultsCount, filters)

// Produto
const { trackProductClick } = useProductAnalytics()
trackProductClick(id, name, { price })

// Empresa
const { trackCompanyContact } = useCompanyAnalytics()
trackCompanyContact(company, 'whatsapp')

// Checkout
const { trackPurchase } = useCheckoutAnalytics()
trackPurchase(orderId, value, items)
```

---

## Links Úteis

- [Documentação Completa](/docs/ANALYTICS_IMPLEMENTATION_COMPLETE.md)
- [Analytics de Busca](/docs/ANALYTICS_SEARCH_IMPLEMENTATION.md)
- [Tipos TypeScript](/src/types/analytics.ts)
- [Serviço Principal](/src/services/analyticsService.ts)
- [Hooks](/src/hooks/useAnalytics.ts)

---

**Última atualização:** 24/10/2025  
**Status:** ✅ Production Ready
