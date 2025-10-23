# 🛡️ Filtro de Produtos com Estoque Zerado

## Objetivo

Prevenir que clientes vejam e tentem comprar produtos que estão com estoque esgotado (`stockQuantity === 0`), evitando frustração e ordens que não podem ser entregues.

## Implementação

### Função Helper Criada

```typescript
// src/lib/firebase-service.ts

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
```

### Locais Onde o Filtro foi Aplicado

#### 1. ✅ Página Principal (Home)
**Arquivo:** `src/lib/firebase-service.ts`
- **Função:** `getProducts()`
- **Função:** `getFeaturedProducts()`
- Produtos em destaque e listagens gerais não mostram itens sem estoque

#### 2. ✅ Produtos Relacionados
**Arquivo:** `src/lib/firebase-service.ts`
- **Função:** `getRelatedProducts()`
- Na página de produto individual, os "Produtos da Mesma Empresa" só mostram itens disponíveis

#### 3. ✅ Página da Empresa (URL Personalizada)
**Arquivo:** `src/app/[cityState]/[slug]/page.tsx`
- Filtra produtos da empresa antes de exibir
- Clientes só veem produtos que podem realmente comprar

#### 4. ✅ Página da Empresa (ID Direto)
**Arquivo:** `src/app/company/[id]/page.tsx`
- Mesma lógica da URL personalizada
- Filtro aplicado na listagem de produtos

#### 5. ✅ Produtos Favoritados
**Arquivo:** `src/lib/liked-product-service.ts`
- **Função:** `getFavoredProducts()`
- **Função:** `onFavoredProductsChange()`
- Produtos favoritados com estoque zerado não aparecem na lista de favoritos
- Real-time listener também aplica o filtro

## Como Funciona

### Fluxo de Filtragem

```
1. Query Firebase para buscar produtos
   ↓
2. Recebe todos os produtos ativos (active === 'SIM')
   ↓
3. Aplica filterOutOfStockProducts()
   ↓
4. Remove produtos onde stockQuantity === 0
   ↓
5. Retorna apenas produtos disponíveis
   ↓
6. Produtos são exibidos na interface
```

### Logs de Debug

Quando um produto é filtrado, o console mostra:
```
⚠️ Produto "Camiseta Básica Preta" (abc123) oculto: estoque zerado
```

Isso ajuda a monitorar quais produtos estão sendo ocultados e por quê.

## Benefícios

### Para o Cliente
- ✅ Não vê produtos que não pode comprar
- ✅ Evita frustração ao tentar finalizar compra de produto indisponível
- ✅ Experiência de compra mais fluida

### Para a Empresa
- ✅ Evita ordens que não podem ser cumpridas
- ✅ Protege reputação (não vende o que não tem)
- ✅ Reduz trabalho de cancelamento/reembolso
- ✅ Mantém NPS alto

### Para o Sistema
- ✅ Previne inconsistências no checkout
- ✅ Reduz carga de processamento de ordens inválidas
- ✅ Melhora experiência geral da plataforma

## Integração com Webhook de Pagamento

O webhook `/workflows/webhook-confirm-payment-FINAL.json` já atualiza o estoque automaticamente quando um pagamento é confirmado:

```javascript
// Node 11: Update Product Stock
{
  "stockQuantity": "={{ $json.newStock }}",
  "updatedAt": "={{ new Date().toISOString() }}"
}
```

Quando o estoque chega a zero:
1. ✅ Webhook atualiza `stockQuantity` para 0
2. ✅ Frontend automaticamente para de exibir o produto
3. ✅ Novos clientes não conseguem mais ver/comprar
4. ✅ Empresa é notificada para repor estoque

## Casos Especiais

### Produtos Favoritados Esgotados

Se um cliente favoritou um produto e depois ele esgotou:
- ❌ Produto **não aparece** mais na lista de favoritos
- ✅ Cliente não pode clicar e tentar comprar
- ℹ️ Isso evita confusão e frustração

**Alternativa futura:** Mostrar com badge "Esgotado" mas desabilitar compra.

### Produtos no Carrinho Esgotados

⚠️ **Atenção:** Esta funcionalidade **NÃO** verifica produtos que já estão no carrinho.

Se um produto está no carrinho e depois esgota:
- Cliente ainda vê o produto no carrinho
- Na finalização do checkout, o N8N webhook vai detectar estoque insuficiente
- Order será marcada como `PARTIAL_STOCK` ou rejeitada

**Melhoria futura:** Adicionar verificação em tempo real no carrinho.

## Monitoramento

### Logs a Observar

```bash
# Produto oculto por estoque zerado
⚠️ Produto "Nome do Produto" (id123) oculto: estoque zerado

# Lista de produtos favoritados (com filtro)
✅ Encontrados 5 produtos favoritados (com estoque)
```

### Métricas Importantes

- **Quantidade de produtos ocultos por dia**
- **Taxa de conversão antes/depois do filtro**
- **Produtos que esgotam frequentemente**

## Manutenção

### Para Adicionar Filtro em Nova Listagem

Se você criar uma nova query de produtos, siga este padrão:

```typescript
// 1. Buscar todos os produtos
const allProducts = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
})) as Product[]

// 2. Aplicar filtro de estoque
const productsInStock = allProducts.filter(product => {
  if (product.stockQuantity === 0) {
    console.log(`⚠️ Produto "${product.name}" oculto: estoque zerado`)
    return false
  }
  return true
})

// 3. Retornar produtos filtrados
return productsInStock
```

### Desabilitar Filtro (Se Necessário)

Para fins de teste ou administração, você pode temporariamente comentar o filtro:

```typescript
// Temporariamente desabilitado para admin
// const productsInStock = filterOutOfStockProducts(allProducts)
const productsInStock = allProducts // Mostra todos, incluindo sem estoque
```

## Testes

### Como Testar Manualmente

1. **Criar produto com estoque baixo**
   ```
   stockQuantity: 1
   ```

2. **Fazer uma compra do produto**
   - Carrinho → Checkout → Pagamento
   - Webhook atualiza estoque para 0

3. **Verificar que produto sumiu**
   - Voltar para página da empresa
   - Produto não deve mais aparecer na listagem
   - Console deve mostrar log de produto oculto

4. **Verificar favoritos**
   - Se produto estava favoritado
   - Deve sumir da lista de favoritos

### Testes Automatizados (TODO)

```typescript
// tests/stock-filter.spec.ts

describe('Filtro de Estoque Zerado', () => {
  it('deve ocultar produtos com stockQuantity === 0', async () => {
    const products = await getProducts()
    const outOfStock = products.filter(p => p.stockQuantity === 0)
    expect(outOfStock.length).toBe(0)
  })

  it('deve mostrar apenas produtos com estoque > 0', async () => {
    const products = await getFeaturedProducts()
    products.forEach(product => {
      expect(product.stockQuantity).toBeGreaterThan(0)
    })
  })
})
```

## Considerações Futuras

### Opção 1: Mostrar como "Esgotado"
Em vez de ocultar, mostrar com badge:
```tsx
{product.stockQuantity === 0 && (
  <div className="badge-esgotado">Esgotado</div>
)}
```

### Opção 2: Permitir "Avisar Quando Chegar"
Clientes podem se inscrever para notificação quando produto voltar ao estoque.

### Opção 3: Estoque Reservado
Considerar produtos no carrinho como "estoque reservado temporário" por X minutos.

---

## Resumo Executivo

✅ **Implementado com sucesso em todas as listagens de produtos**
🛡️ **Protege clientes e empresas de situações frustrantes**
📊 **Mantém integridade do sistema de estoque**
🚀 **Pronto para produção**
