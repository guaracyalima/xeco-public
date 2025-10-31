# 🔄 Novo Fluxo de Criação de Conta Asaas - ORDEM CORRIGIDA

## ❌ Problema Anterior

**Ordem Errada:**
1. Criar conta Asaas → retorna walletId
2. Tentar criar afiliado com walletId
3. n8n tenta atualizar afiliado que **AINDA NÃO EXISTE** ❌

**Resultado:** Falha no node "Update Affiliate Success" porque `affiliateId` não existe.

---

## ✅ Solução Implementada

**Ordem Correta:**
1. **Criar afiliado SEM walletId** (fica vazio temporariamente)
2. **Criar conta Asaas** → retorna walletId
3. **Atualizar afiliado existente** com walletId ✅

---

## 📋 Fluxo Detalhado

### Frontend (AffiliateAcceptForm.tsx)

```typescript
handleAsaasAccountSubmit(accountData) {
  // PASSO 1: Criar afiliado SEM walletId
  const affiliateResponse = await confirmAffiliateInvitation({
    token: '...',
    email: '...',
    walletId: '' // ← VAZIO por enquanto
  })
  
  // Extrai affiliateId da resposta
  const affiliateId = affiliateResponse.data.affiliateId
  
  // PASSO 2: Criar conta Asaas + atualizar afiliado
  const asaasResponse = await fetch('/api/affiliate/create-asaas-account', {
    body: JSON.stringify({
      ...accountData,
      affiliateId // ← Passa o ID do afiliado já criado
    })
  })
  
  // PASSO 3: Sucesso!
  // Afiliado existe com walletId preenchido
}
```

### Backend (n8n workflow)

**Mudança no workflow:**

O node "Update Affiliate Success" agora usa o `affiliateId` que vem na requisição:

```json
{
  "parameters": {
    "docId": "={{ $json.affiliateId }}"
  }
}
```

**Antes:** Tentava buscar afiliado por email/CPF que ainda não existia ❌  
**Agora:** Usa o ID do afiliado que JÁ FOI CRIADO ✅

---

## 🔧 Mudanças Implementadas

### 1. AffiliateAcceptForm.tsx
- ✅ Inverte ordem: cria afiliado PRIMEIRO
- ✅ Passa `affiliateId` para n8n
- ✅ Melhor tratamento de erros

### 2. n8n-config.ts
- ✅ Adiciona `affiliateId` obrigatório em `N8NAsaasAccountRequest`

### 3. n8n workflow (a fazer manualmente)
- ⚠️ Atualizar node "Update Affiliate Success"
- ⚠️ Usar `={{ $json.affiliateId }}` ao invés de buscar

---

## 🎯 Benefícios

1. **Garante afiliado existe** antes de criar conta Asaas
2. **Não perde dados** se Asaas falhar (afiliado já está criado)
3. **Permite correção posterior** pelo perfil do afiliado
4. **Atomicidade:** Afiliado sempre existe, wallet pode ser preenchido depois

---

## 🚨 Cenários de Erro

### Cenário 1: Falha ao criar afiliado
- **Resultado:** Nada é criado
- **Ação:** Usuário tenta novamente

### Cenário 2: Afiliado criado, Asaas falha
- **Resultado:** Afiliado existe sem walletId
- **Ação:** Usuário pode corrigir pelo perfil (funcionalidade futura)
- **Log:** "⚠️ Afiliado criado mas conta Asaas falhou"

### Cenário 3: Tudo sucesso
- **Resultado:** Afiliado com walletId preenchido ✅
- **Ação:** Usuário pode receber comissões imediatamente

---

## 📝 TODO: Atualizar n8n Workflow

```json
// Node: "Update Affiliate Success"
{
  "name": "✅ Update Affiliate Success",
  "type": "n8n-nodes-base.firestore",
  "parameters": {
    "operation": "update",
    "collection": "affiliated",
    "docId": "={{ $json.affiliateId }}", // ← USAR ESTE VALOR
    "dataPropertyName": "data"
  }
}
```

**Remover:** Nodes de busca do afiliado  
**Adicionar:** Validação de `affiliateId` no início do workflow

---

## ✅ Checklist de Deploy

- [x] Frontend: Ordem invertida (afiliado primeiro)
- [x] Frontend: Passa affiliateId para n8n
- [x] Types: affiliateId obrigatório
- [ ] n8n: Atualizar workflow para usar affiliateId
- [ ] n8n: Testar fluxo completo
- [ ] Deploy: Subir mudanças para produção
