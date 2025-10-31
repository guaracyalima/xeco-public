# ExternalReference - Tracking de Comissões de Afiliado

## 📋 Visão Geral

O campo `externalReference` no checkout da Asaas foi modificado para incluir metadados sobre comissões de afiliados quando aplicável. Isso permite rastrear e registrar vendas de afiliados através do webhook.

## 🔍 Estrutura dos Dados

### Quando NÃO há afiliado:
```json
"externalReference": "order-1730304000000"
```
Formato simples com apenas o ID do pedido.

### Quando HÁ afiliado (cupom de afiliado aplicado):
```json
"externalReference": "{\"type\":\"AFFILIATE_COMMISSION\",\"affiliateId\":\"abc123\",\"companyId\":\"xyz789\",\"couponCode\":\"AFIL10\",\"orderId\":\"order-123\",\"commissionRate\":10,\"commissionValue\":15.50}"
```

Que quando parseado vira:
```javascript
{
  type: "AFFILIATE_COMMISSION",
  affiliateId: "abc123",
  companyId: "xyz789",
  couponCode: "AFIL10",
  orderId: "order-123",
  commissionRate: 10,
  commissionValue: 15.50
}
```

## 🔧 Implementação no Webhook

### Exemplo de código para processar no N8N ou webhook:

```javascript
// Recebe o payload do webhook Asaas
const webhookData = $input.all()[0].json

// Extrai externalReference
const externalRef = webhookData.externalReference

// Verifica se é uma venda de afiliado
let affiliateData = null
try {
  const parsed = JSON.parse(externalRef)
  if (parsed.type === 'AFFILIATE_COMMISSION') {
    affiliateData = parsed
  }
} catch (e) {
  // Não é JSON, é apenas um orderId simples
  console.log('Venda direta (sem afiliado)')
}

// Se houver dados de afiliado, registra a venda
if (affiliateData) {
  // Registra na collection affiliate_sales
  await firestore.collection('affiliate_sales').add({
    affiliateId: affiliateData.affiliateId,
    companyId: affiliateData.companyId,
    orderId: affiliateData.orderId,
    couponCode: affiliateData.couponCode,
    commissionRate: affiliateData.commissionRate,
    commissionValue: affiliateData.commissionValue,
    orderValue: webhookData.value, // Valor total da venda
    status: webhookData.status, // PENDING, CONFIRMED, etc
    asaasPaymentId: webhookData.id,
    createdAt: new Date(),
    confirmedAt: webhookData.status === 'CONFIRMED' ? new Date() : null
  })
  
  console.log(`✅ Comissão de afiliado registrada: R$ ${affiliateData.commissionValue}`)
}
```

## 📊 Collection: affiliate_sales

### Estrutura esperada no Firestore:

```typescript
interface AffiliateSale {
  id: string // Auto-gerado pelo Firestore
  affiliateId: string // ID do afiliado
  companyId: string // ID da empresa
  orderId: string // ID do pedido original
  couponCode: string // Código do cupom usado
  commissionRate: number // Taxa de comissão (%)
  commissionValue: number // Valor da comissão em R$
  orderValue: number // Valor total do pedido
  status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED'
  asaasPaymentId: string // ID do pagamento na Asaas
  createdAt: Timestamp // Data de criação
  confirmedAt?: Timestamp // Data de confirmação do pagamento
  paidAt?: Timestamp // Data de pagamento da comissão ao afiliado
}
```

## 🎯 Fluxo Completo

1. **Cliente aplica cupom de afiliado** no checkout
2. **Sistema valida** cupom e identifica afiliado
3. **Checkout monta payload** com externalReference contendo dados do afiliado
4. **Asaas cria cobrança** e armazena o externalReference
5. **Webhook dispara** quando pagamento muda de status
6. **N8N/Webhook processa**:
   - Parse do externalReference
   - Se tipo === AFFILIATE_COMMISSION → registra em affiliate_sales
   - Se não → apenas atualiza order normalmente
7. **Dashboard do afiliado** mostra vendas em tempo real

## ⚠️ Pontos Importantes

### Limitações da Asaas:
- **externalReference só está no checkout**, não nos splits individuais
- Por isso usamos JSON no externalReference para transportar os dados
- Splits continuam sendo array simples de `{walletId, percentageValue}`

### Quando registrar a venda:
- **PENDING**: Registra com status pending
- **CONFIRMED**: Atualiza para confirmed, seta confirmedAt
- **RECEIVED**: Atualiza para received (dinheiro efetivamente recebido)
- **REFUNDED**: Marca como refunded, comissão não deve ser paga

### Segurança:
- Sempre validar que `affiliateId` existe no Firestore
- Verificar se `companyId` corresponde ao esperado
- Validar valores (commissionValue nunca pode ser > orderValue)
- Usar transaction do Firestore para evitar duplicatas

## 🧪 Teste

### Payload de exemplo para testar:

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_123456789",
    "value": 155.00,
    "status": "CONFIRMED",
    "externalReference": "{\"type\":\"AFFILIATE_COMMISSION\",\"affiliateId\":\"aff_abc\",\"companyId\":\"comp_xyz\",\"couponCode\":\"TESTE10\",\"orderId\":\"order_123\",\"commissionRate\":10,\"commissionValue\":15.50}"
  }
}
```

### Validação esperada:
```javascript
✅ Parse do JSON bem-sucedido
✅ type === "AFFILIATE_COMMISSION"
✅ affiliateId existe no Firestore
✅ companyId válido
✅ commissionValue (15.50) === orderValue (155.00) * commissionRate (10%) ✓
✅ Registro criado em affiliate_sales
```

## 📝 Logs Recomendados

No webhook, adicione logs para debug:

```javascript
console.log('🎯 Processando webhook Asaas')
console.log('📦 Payment ID:', webhookData.id)
console.log('💰 Valor:', webhookData.value)
console.log('📋 ExternalReference:', webhookData.externalReference)

if (affiliateData) {
  console.log('👥 VENDA DE AFILIADO DETECTADA!')
  console.log('  → Afiliado:', affiliateData.affiliateId)
  console.log('  → Cupom:', affiliateData.couponCode)
  console.log('  → Comissão:', `R$ ${affiliateData.commissionValue}`)
}
```

## 🔄 Migração de Dados Antigos

Vendas feitas ANTES desta implementação não terão externalReference com JSON. Para migrar:

```javascript
// Script de migração (rodar uma vez)
const orders = await firestore.collection('orders')
  .where('couponCode', '!=', null)
  .get()

for (const order of orders.docs) {
  const data = order.data()
  
  // Busca o cupom
  const coupon = await firestore.collection('coupons')
    .where('code', '==', data.couponCode)
    .get()
  
  if (!coupon.empty && coupon.docs[0].data().affiliateId) {
    // Cria registro retroativo em affiliate_sales
    await firestore.collection('affiliate_sales').add({
      affiliateId: coupon.docs[0].data().affiliateId,
      companyId: data.companyId,
      orderId: order.id,
      couponCode: data.couponCode,
      commissionRate: coupon.docs[0].data().discountPercentage || 10,
      commissionValue: data.totalAmount * 0.1, // Aproximado
      orderValue: data.totalAmount,
      status: data.status,
      asaasPaymentId: data.asaasPaymentId || '',
      createdAt: data.createdAt,
      confirmedAt: data.status === 'CONFIRMED' ? data.createdAt : null,
      migrated: true // Flag para identificar dados migrados
    })
  }
}
```

## 🚀 Próximos Passos

1. ✅ Implementar parse do externalReference no webhook N8N
2. ✅ Criar collection affiliate_sales no Firestore
3. ✅ Atualizar dashboard do afiliado para mostrar vendas em tempo real
4. ⏳ Implementar sistema de pagamento de comissões
5. ⏳ Relatórios de performance por afiliado
6. ⏳ Notificações para afiliados quando houver venda

---

**Data de implementação:** 30/10/2025  
**Versão:** 1.0  
**Autor:** Sistema Xeco - Gestão de Afiliados
