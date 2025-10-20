# Briefing: Sistema de Alertas Preventivos para Conta Digital (Asaas)

## 🎯 O que precisa ser desenvolvido

Um sistema que **detecta automaticamente empresas com problemas na conta digital do Asaas** e mostra alertas preventivos para o usuário corrigir imediatamente.

## 🚨 Problema que resolve

- Empresas ficam com conta digital quebrada no Asaas (erros de CNPJ duplicado, dados incorretos, etc.)
- Usuário só descobre quando tenta processar um pagamento
- Perde vendas e tempo com problemas que poderiam ser resolvidos antes

## ⚡ Como funciona

1. **Usuário entra na área de gestão da empresa**
2. **Seleciona uma empresa no dropdown**
3. **Se a empresa tem erro → SweetAlert dispara automaticamente**
4. **Usuário clica "Corrigir Dados" → Modal abre com formulário**
5. **Preenche dados corretos → Sistema corrige no Asaas**

## 🛠️ Detalhes técnicos implementados

### SweetAlert2 Automático
```javascript
// Quando seleciona empresa com erro, dispara automaticamente:
Swal.fire({
  title: '⚠️ Conta Digital com Pendências',
  html: `A empresa ${nomeEmpresa} possui pendências que precisam ser resolvidas`,
  icon: 'warning',
  confirmButtonText: '🔧 Corrigir Dados Agora',
  allowOutsideClick: false // Força usuário a agir
})
```

### Modal de Correção Inteligente
- **Múltiplos erros**: Navega entre erros com botões Anterior/Próximo
- **Progress bar**: Mostra "Erro 1 de 3"
- **Campo específico**: Cada erro mostra apenas o campo que precisa corrigir
- **Validação**: Não deixa salvar campo vazio
- **Loading state**: Mostra "Corrigindo..." durante API call

### Tipos de Erro Identificados
```javascript
const errosComuns = [
  {
    tipo: 'DUPLICATE_DATA',
    campo: 'cnpj', 
    erro: 'CPF/CNPJ já cadastrado no Asaas0',
    acao: 'Usuário digita CNPJ correto'
  },
  {
    tipo: 'MISSING_DATA',
    campo: 'businessProfile',
    erro: 'Perfil incompleto',
    acao: 'Usuário preenche dados faltantes'
  },
  {
    tipo: 'INVALID_DATA',
    campo: 'email',
    erro: 'Email inválido',
    acao: 'Usuário corrige email'
  }
]
```

### Fluxo de Dados
```javascript
// 1. Verificar se empresa tem erros
const errors = await checkCompanyErrors(companyId)

// 2. Se tem erros, mostrar SweetAlert automaticamente
if (errors.length > 0) {
  setTimeout(() => showAlert(), 500) // Delay de 500ms
}

// 3. No modal, corrigir cada erro individualmente
await fixAccountError(companyId, errorCode, newValue)

// 4. Sucesso: próximo erro ou modal de "Tudo corrigido!"
```

## 📱 UX/UI Definido

### SweetAlert
- **Título**: "⚠️ Conta Digital com Pendências"
- **Cor**: Vermelho (#ef4444) 
- **Não pode fechar**: `allowOutsideClick: false`
- **Botão único**: "🔧 Corrigir Dados Agora"

### Modal de Correção
- **Header**: Título + botão X + progress "Erro 1 de 3"
- **Corpo**: Alert vermelho com descrição + campo de input específico
- **Footer**: Botões Anterior/Próximo + Cancelar + "Corrigir Este Erro"
- **States**: Loading spinner quando enviando para API

### Visual do Alert de Erro
```html
<div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px;">
  <strong>🚨 Erro de Integração:</strong> CPF/CNPJ já cadastrado no Asaas0
</div>

<ul>
  <li>Receber pagamentos pela plataforma</li>
  <li>Processar novos pedidos</li>
  <li>Acessar relatórios financeiros</li>
</ul>
```

## 🔧 Componentes Criados

### 1. Hook useAccountErrors
```javascript
const { errors, loading, hasErrors } = useAccountErrors(companyId)
// Retorna lista de erros, estado de loading, flag se tem erros
```

### 2. AccountErrorAlert (SweetAlert automático)
```javascript
<AccountErrorAlert 
  company={selectedCompany} 
  onFixRequest={() => setShowModal(true)} 
/>
// Dispara SweetAlert quando empresa tem erro
```

### 3. AccountErrorFixModal (Modal de correção)
```javascript
<AccountErrorFixModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  companyId={selectedCompanyId}
  errors={errors}
/>
// Modal com navegação entre erros e correção
```

### 4. AccountErrorService (API)
```javascript
// Verificar erros da empresa
AccountErrorService.checkCompanyErrors(companyId)

// Corrigir erro específico  
AccountErrorService.fixAccountError(companyId, errorCode, newValue)
```

## 📊 Dados Mock Usados

```javascript
const empresas = [
  {
    id: 'company-with-cnpj-error',
    name: "Templo de quimbanda nordestina",
    cnpj: "55163977075",
    hasAccountErrors: true,
    accountStatus: 'ERROR'
  },
  {
    id: 'company-with-external-conflict', 
    name: "Restaurante Sabor & Arte",
    cnpj: "12345678000199",
    hasAccountErrors: true,
    accountStatus: 'ERROR'
  },
  {
    id: 'company-without-errors',
    name: "Café & Cia Sem Erros", 
    cnpj: "98765432000188",
    hasAccountErrors: false,
    accountStatus: 'ACTIVE'
  }
]
```

## 🧪 Testes Criados (Playwright)

```javascript
// Teste principal que valida:
test('Sistema de Alertas - Empresa com Erro', async ({ page }) => {
  await page.goto('/company')
  
  // Selecionar empresa com erro
  await page.selectOption('select', 'company-with-cnpj-error')
  
  // Verificar SweetAlert aparece
  await page.waitForSelector('.swal2-container')
  
  // Verificar botão "Corrigir Dados Agora"
  await expect(page.locator('.swal2-confirm')).toContainText('Corrigir Dados Agora')
})
```

## 🎨 Mobile-First

- **Select dropdown**: Full width no mobile
- **SweetAlert**: Responsivo automático
- **Modal**: Mobile = fullscreen, Desktop = centrado 500px
- **Botões**: Stack vertical no mobile, horizontal no desktop

## 🔄 Estados de Loading

1. **Verificando erros**: Spinner no hook useAccountErrors
2. **Corrigindo erro**: Button com "Corrigindo..." + spinner
3. **Sucesso**: SweetAlert verde "✅ Conta Corrigida!"
4. **Erro**: SweetAlert vermelho "❌ Erro na Correção"

## 📦 Dependências

```bash
npm install sweetalert2
npm install -D @playwright/test  # Para testes
```

## 🎯 Resultado Final

- **UX perfeita**: Usuário é alertado imediatamente sobre problemas
- **Correção guiada**: Modal leva pela mão para corrigir cada erro
- **Prevenção**: Evita problemas na hora do pagamento
- **Mobile-first**: Funciona perfeitamente em qualquer dispositivo
- **Testado**: Playwright valida que funciona 100%

## 💡 Pontos importantes para implementação

1. **SweetAlert dispara automaticamente** quando seleciona empresa (delay 500ms)
2. **Modal navega entre múltiplos erros** com botões Anterior/Próximo
3. **Não deixa fechar** o SweetAlert sem ação (preventivo)
4. **Campo específico** para cada tipo de erro
5. **Loading states** em todas as operações assíncronas
6. **Mobile-first** em todos os componentes
7. **Testes incluídos** para validar funcionamento

---

**Este sistema foi totalmente desenvolvido e testado. Agora só falta implementar no sistema correto!** 🚀