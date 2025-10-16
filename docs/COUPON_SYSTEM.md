# Sistema de Cupons de Desconto - Xeco

## 🎯 Visão Geral

Sistema completo de cupons de desconto integrado ao carrinho de compras, suportando:
- **Cupons da empresa** (desconto direto)
- **Cupons de afiliado** (desconto + split de pagamento)

## 🛠️ Funcionalidades Implementadas

### ✅ **Validação de Cupons**
- Verificação de código válido
- Status ativo/inativo
- Data de expiração
- Limite de uso
- Valor mínimo do carrinho
- Empresa correspondente aos produtos

### ✅ **Tipos de Cupom**
1. **COMPANY** - Cupom da empresa
   - Desconto percentual ou valor fixo
   - Aplicado diretamente no total
   
2. **AFFILIATE** - Cupom de afiliado
   - Desconto percentual ou valor fixo  
   - Valida se afiliado está ativo
   - Prepara dados para split de pagamento

### ✅ **Interface do Usuário**
- Campo de entrada no resumo do carrinho
- Aplicação em tempo real
- Alertas de validação
- Exibição de desconto aplicado
- Informações do afiliado (quando aplicável)
- Remoção de cupom aplicado

## 📊 **Estrutura de Dados**

### Collection `coupons`
```typescript
{
  id: string
  code: string                    // Ex: "SAVE10", "AFILIADO15"
  type: 'COMPANY' | 'AFFILIATE'   // Tipo do cupom
  companyId: string               // ID da empresa
  affiliateId?: string            // ID do afiliado (só se AFFILIATE)
  discountType: 'PERCENTAGE' | 'FIXED'
  discountPercentage?: number     // Ex: 10 para 10%
  discountValue?: number          // Valor fixo em R$
  active: boolean                 // Ativo/inativo
  expiresAt?: Date               // Data de expiração
  usageLimit?: number            // Limite de usos
  usedCount: number              // Contador de usos
  minimumAmount?: number         // Valor mínimo do carrinho
  createdAt: Date
  updatedAt: Date
}
```

### Dados Relacionados
- **Collection `affiliated`** - Validação de afiliados ativos
- **CartContext** - Integração com carrinho existente

## 🎨 **Componentes Criados**

### `CouponField`
**Localização**: `/src/components/cart/CouponField.tsx`

**Props**:
- `companyId: string` - ID da empresa dos produtos
- `cartTotal: number` - Total do carrinho
- `onCouponApplied: (discount: CartDiscount | null) => void` - Callback
- `currentDiscount?: CartDiscount | null` - Desconto atual

**Estados**:
- Campo de entrada de cupom
- Loading durante validação
- Exibição de cupom aplicado
- Informações do afiliado

### `CartSummary` (Modificado)
**Localização**: `/src/components/cart/CartSummary.tsx`

**Adições**:
- Integração com `CouponField`
- Exibição de subtotal e desconto
- Total final com desconto aplicado
- Estado do desconto aplicado

## 🔧 **Serviços**

### `coupon-service.ts`
**Localização**: `/src/lib/coupon-service.ts`

**Funções principais**:
- `validateCoupon()` - Validação completa do cupom
- `validateAffiliate()` - Validação de afiliado ativo
- `calculateDiscount()` - Cálculo do valor de desconto
- `applyCoupon()` - Incrementa contador de uso
- `formatCartDiscount()` - Formatação para o carrinho

### Fluxo de Validação
1. **Busca cupom** por código
2. **Valida status** (ativo, expirado, limite de uso)
3. **Verifica empresa** correspondente
4. **Valida valor mínimo** do carrinho
5. **Se afiliado**: valida se está ativo na empresa
6. **Calcula desconto** baseado no tipo
7. **Retorna resultado** formatado

## 🧪 **Como Testar**

### 1. **Criar Dados de Teste**
```bash
# Acesse as páginas de teste:
http://localhost:3000/test-coupons        # Criar cupons
http://localhost:3000/test-affiliate-data # Criar afiliados
```

### 2. **Testar no Carrinho**
```bash
# Adicione produtos ao carrinho
http://localhost:3000/carrinho

# Use os cupons de teste:
SAVE10      # 10% de desconto (empresa)
FIXED20     # R$ 20 de desconto (empresa)
AFILIADO15  # 15% de desconto (afiliado)
EXPIRED     # Cupom expirado (erro)
INACTIVE    # Cupom inativo (erro)
```

### 3. **Cenários de Teste**

#### ✅ **Cupom Válido**
- Código correto + empresa correta = Desconto aplicado

#### ❌ **Cupom Inválido**
- Código inexistente = "Cupom não encontrado"
- Cupom inativo = "Cupom não está mais válido"
- Cupom expirado = "Cupom expirou"
- Limite atingido = "Cupom atingiu limite de uso"
- Empresa diferente = "Cupom não válido para produtos"
- Valor mínimo = "Valor mínimo não atingido"

#### 🔍 **Cupom de Afiliado**
- Afiliado ativo = Desconto + dados do afiliado
- Afiliado inativo = "Afiliado não está mais ativo"

## 💰 **Integração com Pagamento**

### Dados Preparados para Checkout
```typescript
interface CartDiscount {
  coupon: Coupon           // Dados do cupom
  affiliate?: Affiliated   // Dados do afiliado (se aplicável)
  discountAmount: number   // Valor do desconto
  originalTotal: number    // Total original
  finalTotal: number       // Total final
}
```

### Split de Pagamento
Quando há afiliado no cupom:
- **Empresa**: Recebe valor após desconto
- **Afiliado**: Recebe comissão sobre a venda
- **Plataforma**: Recebe taxa padrão

## 📱 **UX/UI Features**

### ✅ **Campo de Cupom**
- Input com formatação automática (maiúscula)
- Botão de aplicar com estados de loading
- Enter para aplicar rapidamente
- Placeholder explicativo

### ✅ **Feedback Visual**
- Alertas nativos para sucesso/erro
- Ícones diferenciados por tipo
- Cores para diferentes estados
- Informações completas do desconto

### ✅ **Cupom Aplicado**
- Card destacado com informações
- Botão para remover cupom
- Detalhes do afiliado (quando aplicável)
- Valor economizado em destaque

### ✅ **Resumo do Carrinho**
- Subtotal original
- Linha de desconto destacada
- Total final atualizado
- Mensagem de economia

## 🔮 **Próximos Passos**

### Para implementar futuramente:
1. **Dashboard de Cupons**: Interface para empresas criarem cupons
2. **Analytics de Cupons**: Relatórios de uso e conversão
3. **Cupons Automáticos**: Aplicação automática por critérios
4. **Cupons Pessoais**: Cupons únicos por cliente
5. **Integração com Email**: Envio de cupons por email
6. **Limite por Cliente**: Controle de uso por usuário
7. **Cupons Sazonais**: Ativação automática por datas
8. **API de Cupons**: Endpoints para integração externa

## 🚨 **Pontos de Atenção**

### **Segurança**
- Validação no servidor sempre
- Limite de tentativas por IP
- Logs de uso suspeito
- Códigos únicos e seguros

### **Performance**
- Cache de cupons válidos
- Índices no Firestore otimizados
- Validação assíncrona

### **Negócio**
- Controle de margem de desconto
- Relatórios de impacto financeiro
- Alertas de uso anômalo
- Backup de dados de cupons

## 📊 **Estrutura Final de Arquivos**

```
src/
├── types/index.ts                     # Types de cupons
├── lib/coupon-service.ts              # Serviço principal
├── components/cart/
│   ├── CouponField.tsx               # Campo de cupom
│   └── CartSummary.tsx               # Resumo modificado
├── scripts/
│   └── create-test-coupons.ts        # Dados de teste
└── app/
    └── test-coupons/page.tsx         # Página de teste
```

Sistema completo e funcional! 🎯