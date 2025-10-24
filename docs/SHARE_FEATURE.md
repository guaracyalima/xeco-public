# 📤 Sistema de Compartilhamento Estilo Shopee

## ✅ Implementação Completa

Sistema de compartilhamento de produtos e empresas igual ao da Shopee, gerando imagem com informações + texto + link.

---

## 🎯 Funcionalidades

### Para Produtos
Compartilha:
- ✅ Foto do produto
- ✅ Nome do produto
- ✅ Preço (R$ XX,XX)
- ✅ Breve descrição
- ✅ Nome da empresa vendedora
- ✅ Link direto para o produto

### Para Empresas
Compartilha:
- ✅ Logo da empresa
- ✅ Nome da empresa
- ✅ Descrição (about)
- ✅ Localização (Cidade, Estado)
- ✅ Link direto para empresa
- ✅ **SEM preço** (como solicitado)

---

## 🖼️ Como Funciona

### 1. Geração de Imagem

O sistema cria uma imagem 600x800px com:

**Layout:**
```
┌────────────────────┐
│                    │
│   FOTO/LOGO        │
│   (600x600)        │
│                    │
├────────────────────┤
│ Nome do Produto    │
│ R$ 99,90          │
│ Descrição breve... │
│ Vendido por: Loja  │
│                    │
│         Xeco       │
└────────────────────┘
```

### 2. Compartilhamento via Web Share API

Ao clicar no botão de compartilhar:
1. Gera imagem canvas com as informações
2. Converte para arquivo JPEG
3. Monta texto com nome, preço, descrição
4. Abre seletor nativo de compartilhamento
5. Usuário escolhe onde compartilhar (WhatsApp, Telegram, etc.)

### 3. Fallback

Se Web Share API não estiver disponível:
- Copia link para clipboard
- Mostra alerta de confirmação

---

## 💻 Como Usar no Código

### Compartilhar Produto

```tsx
import { ShareProductButton } from '@/components/product/ShareProductButton'

// Variante: Apenas ícone
<ShareProductButton 
  product={product} 
  companyName="Nome da Loja"
  variant="icon"
/>

// Variante: Botão completo
<ShareProductButton 
  product={product} 
  companyName="Nome da Loja"
  variant="button"
/>

// Variante: FAB (botão flutuante)
<ShareProductButton 
  product={product} 
  companyName="Nome da Loja"
  variant="fab"
/>
```

### Compartilhar Empresa

```tsx
import { ShareCompanyButton } from '@/components/company/ShareCompanyButton'

// Variante: Apenas ícone
<ShareCompanyButton 
  company={company}
  variant="icon"
/>

// Variante: Botão completo
<ShareCompanyButton 
  company={company}
  variant="button"
/>

// Variante: FAB (botão flutuante)
<ShareCompanyButton 
  company={company}
  variant="fab"
/>
```

### Usar Diretamente o Serviço

```tsx
import { shareProduct, shareCompany } from '@/lib/share-service'

// Compartilhar produto
const success = await shareProduct(product, 'Nome da Loja')

// Compartilhar empresa
const success = await shareCompany(company)
```

---

## 🎨 Variantes de Botão

### Icon (Apenas Ícone)
- Círculo pequeno com ícone de compartilhar
- Ideal para cards de produto/empresa
- Hover: fundo cinza claro

### Button (Botão Completo)
- Botão com ícone + texto "Compartilhar"
- Borda cinza, fundo branco
- Ideal para páginas de detalhes

### FAB (Floating Action Button)
- Botão flutuante coral no canto inferior direito
- Sempre visível ao rolar a página
- Ideal para páginas de produto/empresa

---

## 📱 Onde Adicionar

### Página de Produto (`/produto/[id]`)

```tsx
import { ShareProductButton } from '@/components/product/ShareProductButton'

// No header ou toolbar
<ShareProductButton 
  product={product}
  companyName={company?.name}
  variant="button"
/>

// OU como FAB
<ShareProductButton 
  product={product}
  companyName={company?.name}
  variant="fab"
/>
```

### Página de Empresa (`/company/[id]`)

```tsx
import { ShareCompanyButton } from '@/components/company/ShareCompanyButton'

// No header
<ShareCompanyButton 
  company={company}
  variant="button"
/>

// OU como FAB
<ShareCompanyButton 
  company={company}
  variant="fab"
/>
```

### Cards de Produto (Home, Busca, etc.)

```tsx
import { ShareProductButton } from '@/components/product/ShareProductButton'

// No canto do card
<ShareProductButton 
  product={product}
  variant="icon"
  className="absolute top-2 right-2"
/>
```

### Cards de Empresa

```tsx
import { ShareCompanyButton } from '@/components/company/ShareCompanyButton'

// No header do card
<ShareCompanyButton 
  company={company}
  variant="icon"
/>
```

---

## 🎨 Personalização

### Customizar Cores

Edite `/src/lib/share-service.ts`:

```typescript
// Mudar cor do preço
ctx.fillStyle = '#FB6F72' // Coral (atual)
ctx.fillStyle = '#10B981' // Verde
ctx.fillStyle = '#EF4444' // Vermelho

// Mudar cor do texto
ctx.fillStyle = '#1F2937' // Cinza escuro (atual)
ctx.fillStyle = '#000000' // Preto
```

### Customizar Layout

No mesmo arquivo, ajuste as coordenadas:

```typescript
// Tamanho da imagem
canvas.width = 600  // Largura
canvas.height = 800 // Altura

// Tamanho da foto do produto
const imgSize = 600 // Quadrado 600x600

// Padding interno
const padding = 24 // Espaçamento nas bordas
```

### Customizar Fonte

```typescript
// Título
ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'

// Preço
ctx.font = 'bold 32px system-ui, -apple-system, sans-serif'

// Descrição
ctx.font = '16px system-ui, -apple-system, sans-serif'
```

---

## 📊 Analytics

O sistema já registra eventos no Google Analytics:

```javascript
// Produto compartilhado
gtag('event', 'share', {
  content_type: 'product',
  item_id: product.id,
  method: 'web_share_api'
})

// Empresa compartilhada
gtag('event', 'share', {
  content_type: 'company',
  item_id: company.id,
  method: 'web_share_api'
})
```

---

## 🧪 Como Testar

### No Desktop

1. Abrir página de produto ou empresa
2. Clicar no botão de compartilhar
3. **Chrome/Edge**: Abre diálogo nativo
4. Escolher app para compartilhar
5. Verificar que imagem + texto + link foram enviados

### No Mobile (Android/iOS)

1. Abrir página no navegador mobile
2. Clicar no botão de compartilhar
3. Abre seletor de apps (WhatsApp, Telegram, etc.)
4. Escolher WhatsApp
5. Verificar:
   - ✅ Imagem aparece
   - ✅ Texto formatado
   - ✅ Link clicável

### Exemplo no WhatsApp

```
[IMAGEM DO PRODUTO]

Camisa Polo Branca

💰 R$ 49,90

Camisa polo masculina 100% algodão, 
tamanho P, M, G...

Vendido por: Loja da Maria

Veja no Xeco: https://xeco.com/produto/123
```

---

## 🐛 Troubleshooting

### Imagem não aparece no compartilhamento

**Causa**: CORS bloqueando carregamento da imagem

**Solução**: 
```typescript
// Em share-service.ts, na função loadImage
img.crossOrigin = 'anonymous'
```

### Web Share API não funciona

**Causa**: Apenas funciona em HTTPS ou localhost

**Solução**: 
- Testar em localhost (funciona)
- Em produção, usar HTTPS

### Compartilhamento não abre no iOS

**Causa**: Safari tem restrições

**Solução**:
- Verificar se está em contexto seguro (HTTPS)
- Verificar se ação foi iniciada por clique do usuário

### Imagem fica em branco

**Causa**: URL da imagem inválida ou timeout

**Solução**:
```typescript
// Já implementado: fallback para imagem padrão
img.onerror = () => {
  fallbackImg.src = '/default-product-image.png'
}
```

---

## 📝 Exemplo Completo

### Página de Produto

```tsx
'use client'

import { ShareProductButton } from '@/components/product/ShareProductButton'
import { Product, Company } from '@/types'

interface ProductPageProps {
  product: Product
  company: Company
}

export default function ProductPage({ product, company }: ProductPageProps) {
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        
        {/* Botão de compartilhar */}
        <ShareProductButton 
          product={product}
          companyName={company.name}
          variant="button"
        />
      </div>
      
      {/* Conteúdo do produto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagem */}
        <div>
          <img 
            src={product.imagesUrl[0]} 
            alt={product.name}
            className="w-full rounded-lg"
          />
        </div>
        
        {/* Informações */}
        <div>
          <p className="text-3xl font-bold text-coral-600 mb-4">
            R$ {product.salePrice.toFixed(2).replace('.', ',')}
          </p>
          
          <p className="text-gray-600 mb-6">
            {product.description}
          </p>
          
          <button className="w-full bg-coral-600 text-white py-3 rounded-lg">
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
      
      {/* FAB alternativo (escolha button OU fab, não ambos) */}
      {/* <ShareProductButton 
        product={product}
        companyName={company.name}
        variant="fab"
      /> */}
    </div>
  )
}
```

---

## ✅ Checklist de Implementação

- [x] Serviço de compartilhamento (`share-service.ts`)
- [x] Geração de imagem canvas
- [x] Componente ShareProductButton
- [x] Componente ShareCompanyButton
- [x] Suporte Web Share API
- [x] Fallback para clipboard
- [x] Analytics integrado
- [x] 3 variantes de botão (icon, button, fab)
- [x] Tratamento de erros
- [x] CORS configurado
- [ ] Adicionar botões nas páginas de produto
- [ ] Adicionar botões nas páginas de empresa
- [ ] Adicionar nos cards de produto (opcional)
- [ ] Testar em dispositivos reais
- [ ] Testar compartilhamento no WhatsApp
- [ ] Testar compartilhamento no Telegram

---

## 🚀 Próximos Passos

1. **Adicionar botões nas páginas**
   - Página de detalhes do produto
   - Página de detalhes da empresa
   - Cards de produto (home, busca)

2. **Testar em produção**
   - WhatsApp
   - Telegram
   - Facebook
   - Twitter

3. **Melhorias Futuras**
   - Deep linking (abrir app instalado)
   - QR Code para compartilhar
   - Copiar imagem direto
   - Templates customizados por categoria

---

**Data**: 23/10/2025  
**Status**: ✅ Implementação completa  
**Próximo**: Adicionar botões nas páginas
