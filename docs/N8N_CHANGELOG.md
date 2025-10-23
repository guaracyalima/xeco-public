# Changelog - Integração n8n Payment

## [1.0.0] - 2025-10-20

### ✨ Novos Recursos

#### Integração Completa com n8n Webhook
- Implementado serviço de checkout integrado com webhook n8n
- Estrutura de requisição seguindo especificações do Asaas
- Suporte a múltiplos métodos de pagamento (PIX, Cartão de Crédito)
- Sistema de splits de pagamento (plataforma + afiliado + loja)

#### Conversão Automática de Imagens
- Todas as imagens dos produtos são automaticamente convertidas para base64
- Tratamento de erros para imagens inválidas ou inacessíveis
- Imagem placeholder em caso de falha

#### Configuração Parametrizável
- URLs configuráveis via variável de ambiente
- Detecção automática de ambiente (development/production)
- Callbacks de checkout dinâmicos baseados no domínio

#### Tratamento Robusto de Erros
- Captura e formatação de erros do n8n
- Mensagens user-friendly
- Retry sem perder dados do formulário
- Validação de respostas inesperadas

### 📝 Arquivos Criados

#### Configurações
- `src/lib/config.ts` - Configurações globais da aplicação
- `src/lib/n8n-config.ts` - Configurações específicas do n8n
- `.env.example` - Adicionada variável `NEXT_PUBLIC_N8N_URL`

#### Serviços
- `src/services/checkoutService-new.ts` - Serviço principal de checkout
  - `createPaymentCheckout()` - Cria pagamento via n8n
  - `formatPaymentErrors()` - Formata erros para exibição

#### Testes
- `src/tests/n8n-payment.test.ts` - Suite de testes para integração
  - Teste de conversão de imagens
  - Teste de cálculo de splits
  - Teste de criação de pagamento
  - Teste com/sem afiliado

#### Documentação
- `docs/N8N_PAYMENT_INTEGRATION.md` - Documentação completa
- `docs/N8N_INTEGRATION_SUMMARY.md` - Resumo executivo
- `docs/N8N_TESTING_GUIDE.md` - Guia de testes

### 🔧 Arquivos Modificados

#### Serviços
- `src/services/checkoutService.ts`
  - Refatorado para usar novo serviço
  - Mantém compatibilidade com código existente
  - Adaptador entre Order e CartItem

#### Contextos
- `src/contexts/CartContext.tsx`
  - Agora passa dados de endereço completo
  - Estrutura preparada para novo formato

### 📦 Dependências

#### Adicionadas
- `uuid@^10.0.0` - Geração de IDs únicos
- `@types/uuid@^10.0.0` - Tipos TypeScript para uuid

### 🔐 Segurança

- Validação de CPF no formato correto (apenas números)
- Validação de CEP (apenas números)
- Validação de telefone (apenas números)
- Sanitização de dados antes de enviar

### 🎯 Features Implementadas

#### ✅ Requisição ao n8n
```typescript
{
  billingTypes: ["CREDIT_CARD", "PIX"],
  chargeTypes: ["DETACHED", "INSTALLMENT"],
  minutesToExpire: 15,
  externalReference: "uuid",
  callback: { successUrl, cancelUrl, expiredUrl },
  items: [{ imageBase64, ... }],
  customerData: { ... },
  installment: { maxInstallmentCount: 1 },
  splits: [{ walletId, percentageValue }],
  companyId: "...",
  companyOrder: "...",
  userId: "...",
  productList: [{ productId, quantity }]
}
```

#### ✅ Resposta de Sucesso
```typescript
{
  id: "checkout-id",
  link: "payment-url",
  status: "ACTIVE",
  ...
}
```

#### ✅ Resposta de Erro
```typescript
{
  errors: [
    { code: "ERROR_CODE", description: "..." }
  ]
}
```

### 🚀 Melhorias de Performance

- Conversão de imagens em paralelo usando `Promise.all()`
- Caching de dados do usuário
- Validação antecipada para evitar requisições desnecessárias

### 📊 Logs e Debug

Adicionados logs detalhados em cada etapa:
- 🚀 Início do processo
- 📦 Processamento de itens
- 💰 Cálculo de splits
- 📤 Envio para n8n
- 📥 Resposta recebida
- ✅ Sucesso / ❌ Erro

### 🎨 UX Improvements

- Modal permanece aberto em caso de erro
- Mensagens de erro claras e acionáveis
- Loading states apropriados
- Dados do formulário preservados em caso de erro

### 🔄 Compatibilidade

- ✅ Código existente continua funcionando
- ✅ Não quebra fluxos atuais
- ✅ Migração transparente

### 📋 Pontos Críticos Implementados

1. ✅ **Conversão de imagens para base64** - Sempre converte
2. ✅ **URLs parametrizáveis** - Fácil mudança de domínio
3. ✅ **companyId do produto** - Usa `product.companyOwner`
4. ✅ **userId** - ID do usuário logado
5. ✅ **Tratamento de erros** - Captura e formata
6. ✅ **Resposta de sucesso** - Extrai link de pagamento
7. ✅ **Domínio configurável** - Localhost para dev, xeco.com.br para prod

### 🧪 Testes

#### Testes Manuais Disponíveis
- Conversão de imagens
- Cálculo de splits
- Estrutura de requisição
- Criação de pagamento sem afiliado
- Criação de pagamento com afiliado

#### Como Executar
```javascript
// No console do navegador
await window.n8nTests.runAllTests()
```

### 📚 Documentação

#### Arquivos de Documentação
1. **N8N_PAYMENT_INTEGRATION.md**
   - Visão geral completa
   - Estrutura de dados
   - Fluxo de checkout
   - Troubleshooting

2. **N8N_INTEGRATION_SUMMARY.md**
   - Resumo executivo
   - Lista de alterações
   - Como usar

3. **N8N_TESTING_GUIDE.md**
   - Guia de testes
   - Checklist
   - Debugging
   - Troubleshooting

### 🔮 Próximos Passos

#### Backlog
- [ ] Webhook de confirmação de pagamento
- [ ] Limpar carrinho após confirmação
- [ ] Notificações por email/SMS
- [ ] Testes end-to-end automatizados
- [ ] Monitoramento e analytics
- [ ] Retry automático em caso de falha temporária

### 🐛 Bug Fixes

Nenhum bug fixado (nova feature)

### 🔧 Configuração Necessária

#### Variável de Ambiente
Adicionar ao `.env.local`:
```bash
NEXT_PUBLIC_N8N_URL=https://primary-production-9acc.up.railway.app
```

Para desenvolvimento:
```bash
NEXT_PUBLIC_N8N_URL=http://localhost:5678
```

### ⚠️ Breaking Changes

Nenhuma breaking change (completamente retrocompatível)

### 📝 Notas de Migração

Não é necessária migração. O sistema é retrocompatível.

### 👥 Contribuidores

- Implementação inicial da integração n8n

### 📄 Licença

Privado - Xeco Platform

---

## Como Usar Este Changelog

### Para Desenvolvedores
1. Leia a seção "Arquivos Criados"
2. Revise "Arquivos Modificados"
3. Instale novas dependências: `npm install`
4. Configure variável de ambiente
5. Execute testes

### Para QA
1. Leia o "Guia de Testes" em `docs/N8N_TESTING_GUIDE.md`
2. Execute checklist de testes
3. Valide cenários de erro
4. Teste integração end-to-end

### Para DevOps
1. Adicione variável `NEXT_PUBLIC_N8N_URL` no ambiente de produção
2. Verifique conectividade com n8n
3. Configure monitoring nos endpoints
4. Valide logs

---

**Versão**: 1.0.0  
**Data**: 20/10/2025  
**Status**: ✅ Completo e Testável
