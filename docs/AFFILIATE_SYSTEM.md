# Sistema de Afiliados - Confirmação de Convite

## 📋 Visão Geral

Este sistema permite que usuários confirmem convites para se tornarem afiliados de empresas na plataforma Xeco.

## 🚀 Funcionalidades

### ✅ Implementado

- **Página de Confirmação**: `/affiliate/confirm`
- **Validação de Token e Email**: Verifica se o convite existe e está válido
- **Verificação de Status**: Confirma se o convite ainda está pendente
- **Controle de Expiração**: Verifica se o convite ainda está dentro do prazo
- **Prevenção de Duplicatas**: Evita que o mesmo email vire afiliado da mesma empresa 2x
- **Criação Automática de Usuário**: Cria conta Firebase Auth se o usuário não existir
- **Geração de Código de Afiliado**: Código único de 8 caracteres
- **Email de Reset de Senha**: Enviado automaticamente para novos usuários
- **Interface Responsiva**: Mobile-first design

## 🗄️ Estrutura do Banco (Firestore Collections)

### `affiliate_invitations`
```typescript
{
  id: string
  inviteToken: string        // Token único do convite
  email: string             // Email do futuro afiliado
  companyId: string         // ID da empresa
  companyName?: string      // Nome da empresa (opcional)
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  createdAt: Date          // Data de criação
  expiresAt: Date          // Data de expiração
  createdBy: string        // ID do usuário que criou o convite
}
```

### `affiliated`
```typescript
{
  id: string
  user: string              // ID do usuário no Firebase Auth
  walletId: string          // ID da carteira (futuro)
  invite_code: string       // Código único do afiliado (8 chars)
  active: 'SIM' | 'NAO'     // Status ativo/inativo
  company_relationed: string // ID da empresa
  email: string             // Email do afiliado
  whatsapp: string          // WhatsApp (preenchido depois)
  name: string              // Nome do afiliado
  createdAt: Date          // Data de criação
  updatedAt: Date          // Data de atualização
}
```

## 🔗 URLs e Parâmetros

### Página de Confirmação
```
/affiliate/confirm?token=ABC123XYZ&email=usuario@exemplo.com
```

**Parâmetros opcionais:**
- `token`: Pre-preenche o campo do token
- `email`: Pre-preenche o campo do email

## 🎯 Fluxo de Uso

1. **Usuário recebe convite** (email, SMS, etc.) com token e link
2. **Acessa página de confirmação** com token e email
3. **Sistema valida**:
   - ✅ Token e email existem na base
   - ✅ Status do convite é "pending"
   - ✅ Convite não expirou
   - ✅ Email não é afiliado desta empresa ainda
4. **Se usuário não existe**:
   - ✅ Cria conta no Firebase Auth
   - ✅ Gera senha temporária
   - ✅ Envia email de reset de senha
5. **Cria registro de afiliado**:
   - ✅ Gera código único de afiliado
   - ✅ Salva na collection `affiliated`
   - ✅ Marca convite como "accepted"
6. **Exibe tela de sucesso** com:
   - Nome da empresa
   - Código de afiliado
   - Senha temporária (se usuário novo)
   - Botão para fazer login

## 🛡️ Validações Implementadas

### Validação de Entrada
- ✅ Token e email obrigatórios
- ✅ Formato de email válido
- ✅ Sanitização de dados

### Validação de Negócio
- ✅ Token + email devem existir juntos na base
- ✅ Status deve ser "pending"
- ✅ Data de expiração válida
- ✅ Email não pode ser afiliado 2x da mesma empresa
- ✅ Código de afiliado deve ser único

### Validação de Sistema
- ✅ Tratamento de erros de Firebase
- ✅ Fallback para falhas de criação de usuário
- ✅ Retry para geração de código único

## 🔧 Componentes

### `AffiliateConfirmForm`
**Localização**: `/src/components/affiliate/AffiliateConfirmForm.tsx`

**Props**:
- `initialToken?: string` - Token inicial
- `initialEmail?: string` - Email inicial

**Estados**:
- Formulário de entrada
- Loading durante processamento
- Tela de sucesso/erro
- Controle de visibilidade de senha

### `AffiliateConfirmPage`
**Localização**: `/src/app/affiliate/confirm/page.tsx`

- Página principal
- Integração com `useSearchParams`
- Layout com Header/Footer
- Suspense para carregamento

## 📚 Serviços

### `affiliate-service.ts`
**Localização**: `/src/lib/affiliate-service.ts`

**Funções principais**:
- `getInvitationByTokenAndEmail()` - Busca convite
- `confirmAffiliateInvitation()` - Processo principal
- `checkUserExists()` - Verifica se usuário existe
- `createUserInFirestore()` - Cria documento do usuário
- `checkExistingAffiliate()` - Verifica duplicatas

## 🎨 UX/UI Features

### ✅ Implementado
- **Design Mobile-First**: Responsivo em todos os tamanhos
- **Estados de Loading**: Indicadores visuais durante processamento
- **Feedback Visual**: Ícones e cores para sucesso/erro
- **Cópia Fácil**: Botões para copiar código e senha
- **Visibility Toggle**: Mostrar/ocultar senha temporária
- **Navegação Intuitiva**: Botões para próximos passos
- **Validação em Tempo Real**: Limpa erros quando usuário digita

### Tela de Sucesso
- ✅ Informações do afiliado
- ✅ Código para compartilhar
- ✅ Senha temporária (se novo usuário)
- ✅ Botões de ação (Login, Início)

## 🔮 Próximos Passos

### Para implementar futuramente:
1. **Dashboard do Afiliado**: Painel com estatísticas e links
2. **Sistema de Comissões**: Integração com pagamentos
3. **Analytics**: Tracking de cliques e conversões
4. **Notificações**: Email/SMS para convites
5. **Gestão de Convites**: Interface para empresas gerenciarem convites
6. **API de Webhooks**: Notificar sistemas externos

## 🧪 Como Testar

### Teste Manual
1. Acesse `/affiliate/confirm`
2. Digite um token e email fictícios
3. Verifique as validações de erro
4. Crie dados reais no Firestore para testar sucesso

### Dados de Teste (Firestore)
```javascript
// Collection: affiliate_invitations
{
  inviteToken: "TEST123",
  email: "teste@exemplo.com",
  companyId: "empresa123",
  companyName: "Empresa Teste",
  status: "pending",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
  createdBy: "admin123"
}
```

## 📧 Email Templates (Futuro)

### Template de Convite
```
Você foi convidado para ser afiliado da [EMPRESA]!

Use o código: [TOKEN]
Link direto: https://xeco.com.br/affiliate/confirm?token=[TOKEN]&email=[EMAIL]
```

### Template de Boas-vindas
```
Parabéns! Você agora é afiliado da [EMPRESA]
Seu código: [CODIGO_AFILIADO]
Senha temporária: [SENHA]
```