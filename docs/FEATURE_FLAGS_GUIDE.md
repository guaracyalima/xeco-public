# 🚩 Feature Flags - Guia de Uso

## O que é?

Sistema para ligar/desligar logs de debug em **produção** sem precisar fazer redeploy.

## Por que usar?

- ✅ **Debug em produção**: Ativa logs quando tem um bug específico
- ✅ **Sem poluição**: Logs ficam desligados normalmente
- ✅ **Controle granular**: Liga só o módulo que precisa (checkout, affiliate, etc)
- ✅ **Sem redeploy**: Muda via env var ou query param

## Como usar

### 1. No código (envolver logs existentes)

**ANTES:**
```typescript
console.log('🛒 Processando checkout', data)
```

**DEPOIS (Opção 1 - Simples):**
```typescript
import { flags } from '@/lib/feature-flags'

if (flags.DEBUG_CHECKOUT) {
  console.log('🛒 Processando checkout', data)
}
```

**DEPOIS (Opção 2 - Helper):**
```typescript
import { debugLog } from '@/lib/feature-flags'

debugLog('checkout', 'Processando checkout', data)
```

### 2. Ativar em produção

#### Via Variável de Ambiente (permanente até mudar)

```bash
# Railway / Vercel / etc
NEXT_PUBLIC_DEBUG_CHECKOUT=true
NEXT_PUBLIC_DEBUG_AFFILIATE=true
NEXT_PUBLIC_DEBUG_WEBHOOK=true
```

#### Via Query Param (temporário, só pra você)

```
# Liga TODOS os debugs
https://xeco.com.br?debug=all

# Liga só debug de checkout
https://xeco.com.br?debug=checkout

# Liga só debug de afiliados
https://xeco.com.br?debug=affiliate
```

**IMPORTANTE:** Query params só funcionam no browser (client-side). Para APIs server-side, use env vars.

## Flags Disponíveis

### 🐛 Debug Logs
- `DEBUG_CHECKOUT` - Fluxo de checkout completo
- `DEBUG_AFFILIATE` - Sistema de afiliados e comissões
- `DEBUG_WEBHOOK` - Chamadas N8N e webhooks externos
- `DEBUG_FIREBASE` - Operações Firestore (get, set, update)
- `DEBUG_AUTH` - Login, logout, autenticação
- `DEBUG_PAYMENT` - Processamento de pagamentos Asaas

### 🔍 Features Experimentais
- `ENABLE_ALGOLIA_SEARCH` - Busca com Algolia (se implementar)
- `ENABLE_PERFORMANCE_MONITORING` - Tracking detalhado de performance
- `ENABLE_ERROR_DETAILS` - Mostra stack trace pro usuário (só dev por padrão)

### 🎨 UI Features
- `SHOW_DEV_TOOLS` - Painel de ferramentas de desenvolvedor na UI

## Padrão de Uso por Módulo

### Checkout API (`/api/checkout/create-payment`)

```typescript
import { flags, debugLog } from '@/lib/feature-flags'

// Logs de debug do fluxo
debugLog('checkout', 'Validando request', { orderId, companyId })
debugLog('checkout', 'Splits calculados', { splits })

// Ou usando if direto
if (flags.DEBUG_CHECKOUT) {
  console.log('📋 Request completo:', JSON.stringify(body, null, 2))
}

// Logs de webhook
debugLog('webhook', 'Chamando N8N', { webhookUrl, payload })
```

### Affiliate Service

```typescript
import { debugLog } from '@/lib/feature-flags'

debugLog('affiliate', 'Buscando vendas do afiliado', { affiliateId })
debugLog('affiliate', 'Comissão calculada', { amount, rate })
```

### Firebase Operations

```typescript
import { debugLog } from '@/lib/feature-flags'

debugLog('firebase', 'Salvando order', { orderId, data })
debugLog('firebase', 'Query executada', { collection, filters })
```

## Exemplo Completo

**Arquivo:** `/src/app/api/checkout/create-payment/route.ts`

```typescript
import { flags, debugLog } from '@/lib/feature-flags'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Debug do payload (só mostra se flag ativa)
    debugLog('checkout', 'Request recebido', {
      companyId: body.companyId,
      itemsCount: body.items?.length,
      totalAmount: body.totalAmount
    })
    
    // Validação
    const validation = await validateCheckoutRequest(body)
    
    if (flags.DEBUG_CHECKOUT) {
      console.log('✅ Validação OK:', validation.data)
    }
    
    // Chamada webhook
    debugLog('webhook', 'Chamando N8N', { webhookUrl: N8N_WEBHOOK_URL })
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    
    debugLog('webhook', 'Resposta recebida', {
      status: response.status,
      ok: response.ok
    })
    
    // Logs de erro SEMPRE aparecem (não precisam de flag)
    if (!response.ok) {
      console.error('❌ Erro no webhook:', response.statusText)
    }
    
  } catch (error) {
    // Erros SEMPRE logam (sem flag)
    console.error('❌ Erro no checkout:', error)
  }
}
```

## Debugging em Produção - Passo a Passo

### Cenário: Bug no checkout em produção

1. **Ativar flag temporariamente:**
   - Acesse: `https://xeco.com.br?debug=checkout`
   - Faça o checkout que está com problema
   - Veja os logs no console do browser

2. **Ativar flag permanentemente (se precisar investigar mais):**
   - Railway: Settings → Variables → Add
   - Nome: `NEXT_PUBLIC_DEBUG_CHECKOUT`
   - Valor: `true`
   - Redeploy
   - Veja logs no Railway Logs

3. **Desativar quando resolver:**
   - Remova a env var
   - Ou mude para `false`
   - Redeploy

## Valores Padrão

| Ambiente | DEBUG_* | Features | Dev Tools |
|----------|---------|----------|-----------|
| Development | ✅ ON | ✅ ON | ✅ ON |
| Production | ❌ OFF | ❌ OFF | ❌ OFF |

## Ver Status das Flags

No console do browser (apenas em development):

```
🚩 Feature Flags Status
✅ DEBUG_CHECKOUT: true
✅ DEBUG_AFFILIATE: true
❌ ENABLE_ALGOLIA_SEARCH: false
...
```

## Adicionar Nova Flag

1. **Edite** `/src/lib/feature-flags.ts`:

```typescript
export interface FeatureFlags {
  // ... flags existentes
  
  DEBUG_MINHA_FEATURE: boolean  // ← Adicione aqui
}

const defaultFlags: FeatureFlags = {
  // ... defaults existentes
  
  DEBUG_MINHA_FEATURE: isDevelopment,  // ← E aqui
}
```

2. **Use no código:**

```typescript
import { flags } from '@/lib/feature-flags'

if (flags.DEBUG_MINHA_FEATURE) {
  console.log('Meu log')
}
```

3. **Ative em produção:**

```bash
NEXT_PUBLIC_DEBUG_MINHA_FEATURE=true
```

## Boas Práticas

### ✅ FAÇA

- Envolva logs de debug (não críticos) com flags
- Use `debugLog()` helper para código mais limpo
- Mantenha erros sempre visíveis (sem flag)
- Use módulos específicos (checkout, affiliate, etc)

### ❌ NÃO FAÇA

- Não envolva `console.error` com flags (erros sempre devem aparecer)
- Não use flags para lógica de negócio (só para logs)
- Não deixe flags de debug ativadas permanentemente em produção
- Não logue dados sensíveis mesmo com flags

## Migração Gradual

Você **NÃO** precisa migrar todos os console.log de uma vez:

```typescript
// Isso funciona (log sempre ativo)
console.log('Log antigo')

// Isso também funciona (log condicional)
if (flags.DEBUG_CHECKOUT) {
  console.log('Log novo com flag')
}

// Isso também funciona (helper)
debugLog('checkout', 'Log com helper')
```

Migre aos poucos, priorizando:
1. APIs críticas (checkout, payment)
2. Logs que poluem produção
3. Logs com dados sensíveis

## Troubleshooting

### "Flag não funciona em produção"

**Causa:** Query params não funcionam em APIs server-side.

**Solução:** Use env vars para APIs:
```bash
NEXT_PUBLIC_DEBUG_CHECKOUT=true
```

### "Painel de flags não aparece"

**Causa:** Só aparece em development.

**Solução:** Veja no Railway Logs ou use:
```typescript
import { flags } from '@/lib/feature-flags'
console.log(flags)
```

### "Flag não muda depois de mudar env var"

**Causa:** Precisa redeploy.

**Solução:** 
- Railway: Redeploy automático ao mudar env
- Vercel: Redeploy manual

## Performance

- ✅ **Zero overhead quando desligado**: `if (false)` é otimizado pelo JS engine
- ✅ **Flags são carregadas 1x no startup**: Não recalcula toda hora
- ✅ **Query params só no client**: Server não processa URL

## Exemplo Real - Antes vs Depois

### ANTES (todos os logs sempre ativos)

```typescript
console.log('🚀 API Route: Checkout')
console.log('📋 Payload:', body)
console.log('🔍 Validando...')
console.log('✅ Validado')
console.log('💾 Salvando...')
console.log('✅ Salvo')
console.log('🔗 Chamando webhook...')
console.log('✅ Sucesso')

// Resultado em produção: 8 linhas de log por checkout
// Com 100 checkouts/dia = 800 linhas de log poluindo
```

### DEPOIS (logs controlados por flag)

```typescript
debugLog('checkout', 'API Route iniciada')
debugLog('checkout', 'Payload recebido', body)
debugLog('checkout', 'Validando...')
debugLog('checkout', 'Validação OK')
debugLog('checkout', 'Salvando no Firebase...')
debugLog('checkout', 'Firebase OK')
debugLog('webhook', 'Chamando N8N...')
debugLog('webhook', 'N8N respondeu com sucesso')

// Resultado em produção: 0 linhas de log (flag desligada)
// Quando ativar flag: 8 linhas de log úteis
```

## Roadmap

Futuras melhorias:

- [ ] Painel UI para controlar flags (sem precisar Railway)
- [ ] Flags por usuário (só admin vê logs)
- [ ] Logs salvos em arquivo quando flag ativa
- [ ] Integração com Sentry (flags controlam sample rate)
- [ ] Feature flags para A/B testing

---

**Autor:** @guaracyalima  
**Última atualização:** 06/11/2025
