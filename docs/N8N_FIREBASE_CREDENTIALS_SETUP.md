# ✅ SETUP CREDENCIAIS N8N - FIRESTORE NODES

## Antes de Importar o Workflow

O workflow agora usa os **nodos nativos Firestore do N8N** em vez de HTTP direto.

Você precisa configurar UMA credencial que será usada por todos os nodos Firestore.

---

## PASSO 1: Adicionar Credencial Firebase no N8N

### 1.1 - Abrir N8N Credentials
```
Settings → Credentials → New Credential
```

### 1.2 - Selecionar Tipo: Firebase
```
Search: "Firebase"
Type: Firebase (Google Cloud Firestore)
```

### 1.3 - Preencher Firebase Service Account

**Você precisa de um arquivo de service account do Firebase:**

1. Abra [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto (xeco-public)
3. Vá em: Project Settings → Service Accounts → Generate New Private Key
4. Será baixado um arquivo JSON

**No N8N, copie o conteúdo COMPLETO do JSON:**

```json
{
  "type": "service_account",
  "project_id": "xeco-public",
  "private_key_id": "xxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@xeco-public.iam.gserviceaccount.com",
  "client_id": "xxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "xxx"
}
```

### 1.4 - Salvar Credencial
```
Name: firebase (ou qualquer nome)
Save
```

---

## PASSO 2: Importar Workflow

### 2.1 - Importar JSON
```
Dashboard → File → Import from file
Selecionar: N8N_WORKFLOW_COMPLETO.json
```

### 2.2 - N8N vai perguntar sobre credenciais
```
Selecionar: firebase (a que você acabou de criar)
Aplicar em todos os nodos Firestore
```

---

## PASSO 3: Configurar Secrets

Os secrets CONTINUAM igual:

```
Settings → Secrets → New Secret
```

Adicionar 2 secrets obrigatórios:

| Secret | Valor | Exemplo |
|--------|-------|---------|
| ASAAS_API_KEY | Sua chave do Asaas | api_prod_xxx |
| CHECKOUT_SIGNATURE_SECRET | Igual ao frontend | seu-secret-muito-seguro |

---

## PASSO 4: Verificar Nodos Firestore

Após importar, verificar se cada nodo Firestore tem:

```
Node → Credentials → firebase (selecionado)
```

Nodos para verificar:
- ✅ FASE 2: Query Order
- ✅ FASE 2: Query Company
- ✅ FASE 3: Query Product
- ✅ FASE 5: Update Firestore

---

## PASSO 5: Testar Conexão

### 5.1 - Test Node
```
Em qualquer nodo Firestore:
Click no ícone ◉ (Test)
Se aparecer ✅ e um documento, ta funcionando!
```

### 5.2 - Deploy
```
Deploy → Ativar
```

---

## O QUE MUDOU DO HTTP PARA FIRESTORE NODE

### ❌ ANTES (HTTP direto)
```javascript
// Chamada HTTP manual
GET https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/orders/{orderId}
Authorization: Bearer {token}

// Resposta com fields complexos
{
  "fields": {
    "customerId": {"stringValue": "user-123"},
    "company": {"stringValue": "company-456"}
  }
}

// Parse manual
const customerId = response.fields.customerId.stringValue
```

### ✅ AGORA (Firestore Node)
```javascript
// Nodo Firestore faz tudo
operation: "get",
collection: "orders",
documentId: "{orderId}"

// Resposta direta
{
  "customerId": "user-123",
  "company": "company-456"
}

// Uso direto
const customerId = response.customerId
```

---

## BENEFÍCIOS

✅ **Mais simples** - Sem parsing de fields complexos
✅ **Mais seguro** - Gerencia credenciais automaticamente
✅ **Mais confiável** - Retry automático
✅ **Mais rápido** - Cache de conexões
✅ **Menos código** - Nodos fazem o trabalho pesado

---

## TROUBLESHOOTING

### Erro: "Failed to get document"
```
Verificar:
1. Firebase credentials corretas?
2. Firestore database ativa?
3. Security rules permitem leitura?
4. Document ID existe no Firestore?
```

### Erro: "Permission denied"
```
Solução:
1. Ir em Firebase Console
2. Firestore → Rules
3. Permitir leitura/escrita para teste:
```
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // TESTE APENAS
    }
  }
}
```

### Erro: "Collection not found"
```
Verificar nome exato:
- Orders: "orders" (minúsculo)
- Companies: "companies"
- Products: "products"
```

---

## PRÓXIMOS PASSOS

1. ✅ Configure credencial Firebase
2. ✅ Importe workflow
3. ✅ Teste conexão de um nodo
4. ✅ Deploy
5. ✅ Teste checkout completo

**PRONTO! Tudo conectado direto ao Firestore! 🔥**
