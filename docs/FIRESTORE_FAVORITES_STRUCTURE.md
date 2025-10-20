# 📊 Estrutura de Dados - Empresas Favoritadas no Firestore

## Resumo Executivo
As **empresas favoritadas** são armazenadas em uma **subcollection aninhada** dentro do documento do usuário no Firestore, com a seguinte estrutura:

```
users/{userId}/favoriteCompanies/{companyId}
```

---

## 1️⃣ Localização Exata no Firestore

### Hierarquia de Collections

```
Firestore Database
├── users (collection raiz)
│   └── {userId} (documento do usuário)
│       ├── favoriteCompanies (subcollection)
│       │   ├── {companyId1} (documento)
│       │   │   ├── name: string
│       │   │   ├── addedAt: timestamp
│       │   │   └── [outros campos opcionais]
│       │   └── {companyId2} (documento)
│       │       ├── name: string
│       │       ├── addedAt: timestamp
│       │       └── [outros campos opcionais]
│       └── followedCompanies (subcollection - DIFERENTE)
│           ├── {companyId1} (documento)
│           └── ...
```

---

## 2️⃣ Estrutura de Dados (Fields)

### Documento Individual de Empresa Favoritada

```json
{
  "name": "Tabacaria Do Joao",
  "addedAt": 2025-10-15T14:30:00.000Z,
  // Opcionais (podem ser armazenados):
  "id": "companyId123",
  "logo": "https://...",
  "category": "Tabacos",
  "city": "Salvador",
  "state": "BA"
}
```

### Campos Principais

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | `string` | ✅ Sim | Nome da empresa |
| `addedAt` | `Timestamp` | ✅ Sim | Data/hora quando foi favoritada |
| `id` | `string` | ❌ Não | ID da empresa (geralmente é a chave do documento) |

---

## 3️⃣ Código que Acessa Esta Estrutura

### 📱 No FavoritesContext.tsx

```typescript
// Linha 74: Referência à collection
const favoritesRef = collection(db, 'users', user.id, 'favoriteCompanies')

// Linha 76-78: Real-time listener (onSnapshot)
const unsubscribe = onSnapshot(favoritesRef, (snapshot) => {
  const favorites = snapshot.docs.map(doc => ({
    id: doc.id,                                    // ID do documento
    name: doc.data().name,                         // Campo 'name'
    addedAt: doc.data().addedAt?.toDate() || new Date()  // Campo 'addedAt'
  }))
})

// Linha 99-105: Adicionar empresa
const favoriteRef = doc(db, 'users', user.id, 'favoriteCompanies', companyId)
await setDoc(favoriteRef, {
  name: companyName,
  addedAt: new Date()
})

// Linha 110-115: Remover empresa
const favoriteRef = doc(db, 'users', user.id, 'favoriteCompanies', companyId)
await deleteDoc(favoriteRef)
```

### 🔗 No followed-companies-service.ts

```typescript
// Linha 9: Referência à collection de seguindo
const collectionRef = collection(db, 'users', userId, 'followedCompanies')

// Diferença: usa 'followedCompanies' não 'favoriteCompanies'
```

---

## 4️⃣ Diferença Entre Duas Subcollections

### ❤️ favoriteCompanies vs 🔗 followedCompanies

```
┌─────────────────────────────────────────────────────────────────┐
│                        users/{userId}                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❤️ favoriteCompanies                                           │
│    └─ Empresas que o usuário MARCOU COMO FAVORITAS            │
│    └─ Usado na aba: "Produtos de Interesse" (atualmente)       │
│    └─ Função: Marcar empresas para voltar depois               │
│                                                                 │
│  🔗 followedCompanies                                           │
│    └─ Empresas que o usuário SEGUE/SUBSCREVE                  │
│    └─ Usado na aba: "Empresas que Sigo"                        │
│    └─ Função: Acompanhar atualizações de empresas              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ Exemplo Prático No Firestore Console

Se você entrar no Firebase Console, navegaria assim:

```
🔥 Firestore Database
  └─ users (collection)
      └─ "user123" (documento)
          ├─ uid: "user123"
          ├─ display_name: "João Silva"
          ├─ email: "joao@email.com"
          ├─ [outros campos de perfil]
          │
          └─ favoriteCompanies (subcollection)
              ├─ "company456" (documento)
              │   ├─ name: "Tabacaria Do Joao"
              │   └─ addedAt: October 15, 2025 at 2:30:00 PM
              │
              └─ "company789" (documento)
                  ├─ name: "Templo de quimbanda nordestina"
                  └─ addedAt: October 14, 2025 at 10:15:00 AM
```

---

## 6️⃣ Como é Usado Na Aplicação

### Flow Atual

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuário abre página de PERFIL (/perfil)                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Componente ProfileTabs renderiza 3 abas:                     │
│    - 🏢 Empresas que Sigo (FollowingCompaniesTab)              │
│    - ❤️ Produtos de Interesse (InterestedProductsTab)          │
│    - 🤝 Minha Afiliação (MyAffiliationTab)                     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌────────────────────┐  ┌──────────────────────────┐
│ FollowingCompanies │  │ InterestedProductsTab    │
│     Tab            │  │                          │
├────────────────────┤  ├──────────────────────────┤
│ Chama:             │  │ Chama:                   │
│getFollowedCompanies│  │useFavoritesContext()     │
│                    │  │                          │
│ De:                │  │ De:                      │
│followedCompanies   │  │favoriteCompanies         │
│(collection vazia)  │  │(tem 2 empresas)          │
└────────────────────┘  └──────────────────────────┘
```

---

## 7️⃣ Operações CRUD Suportadas

### CREATE (Adicionar aos Favoritos)
```typescript
await setDoc(
  doc(db, 'users', userId, 'favoriteCompanies', companyId),
  {
    name: 'Empresa Xyz',
    addedAt: new Date()
  }
)
// Resultado: Novo documento criado em users/{userId}/favoriteCompanies/{companyId}
```

### READ (Buscar Favoritos)
```typescript
const snapshot = await getDocs(
  collection(db, 'users', userId, 'favoriteCompanies')
)
// Resultado: Array com todos os documentos da subcollection
```

### UPDATE (Alterar um Favorito)
```typescript
await updateDoc(
  doc(db, 'users', userId, 'favoriteCompanies', companyId),
  { name: 'Novo Nome' }
)
// Resultado: Campo atualizado no documento
```

### DELETE (Remover dos Favoritos)
```typescript
await deleteDoc(
  doc(db, 'users', userId, 'favoriteCompanies', companyId)
)
// Resultado: Documento removido da subcollection
```

---

## 8️⃣ Real-Time Sync com onSnapshot

O código atual usa `onSnapshot` para **sincronização em tempo real**:

```typescript
const unsubscribe = onSnapshot(favoritesRef, (snapshot) => {
  // Esse callback é disparado TODA VEZ que favoriteCompanies muda
  const favorites = snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    addedAt: doc.data().addedAt?.toDate() || new Date()
  }))
  
  dispatch({ type: 'SET_FAVORITES', payload: favorites })
})
```

**Benefício:** Se você adiciona um favorito em outra aba, a página do perfil atualiza AUTOMATICAMENTE sem precisar recarregar.

---

## 9️⃣ Regras de Segurança Firestore (Recomendado)

```javascript
match /users/{userId}/favoriteCompanies/{document=**} {
  // Usuário só pode ver seus próprios favoritos
  allow read: if request.auth.uid == userId;
  
  // Usuário só pode criar/deletar seus próprios favoritos
  allow create, delete: if request.auth.uid == userId;
  
  // Não permitir updates diretos
  allow update: if false;
}
```

---

## 🔟 Resumo Visual

```
┌──────────────────────────────────────────────────────────┐
│          EMPRESAS FAVORITADAS DO USUÁRIO                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📍 Localização: users/{userId}/favoriteCompanies       │
│                                                          │
│  📊 Estrutura:                                           │
│     ├─ ID do Documento: ID da empresa                   │
│     ├─ Field "name": Nome da empresa                    │
│     └─ Field "addedAt": Quando foi favoritada           │
│                                                          │
│  🔄 Sincronização: Real-time (onSnapshot)               │
│                                                          │
│  🎯 Usado em: InterestedProductsTab (aba do perfil)     │
│                                                          │
│  🚀 FavoritesContext gerencia: Add/Remove/Sync          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## ⚠️ Problema Identificado

**Por que empresas aparecem em "Produtos de Interesse" e não em "Empresas que Sigo"?**

```
favoriteCompanies   ← Tem dados (2 empresas)
    ↓
InterestedProductsTab mostra ✅

followedCompanies   ← Está vazio
    ↓
FollowingCompaniesTab mostra vazio ❌
```

**Solução:** O usuário precisa **SEGUIR** empresas, não apenas **FAVORITAR** elas.

Ou, alternativamente: renomear as abas/collections para deixar claro qual é a função de cada uma.

---

## 📌 Próximas Ações

1. ✅ **Esclarecer intent das duas subcollections:**
   - `favoriteCompanies`: Para salvar empresas que quer revisitar?
   - `followedCompanies`: Para acompanhar atualizações?

2. ✅ **Implementar botão para SEGUIR empresa** na página de detalhes

3. ✅ **Testar adicionando empresas** a `followedCompanies` para ver "Empresas que Sigo" populada

4. ✅ **Considerar: Uma subcollection é suficiente?** Talvez unificar em apenas uma?
