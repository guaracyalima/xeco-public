# 🌐 Sistema de URLs Personalizadas para Empresas

Este sistema permite que empresas sem site próprio tenham uma URL personalizada no domínio XECO para aumentar sua presença online.

## 📋 Funcionalidades

### ✨ Principais Recursos
- **URLs Personalizadas**: Formato `xeco.com.br/cidade-uf/slug-da-empresa`
- **Geração Automática**: Slugs únicos baseados no nome da empresa
- **Normalização**: Remove acentos e caracteres especiais
- **Unicidade**: Garante que não existam URLs duplicadas
- **Interface Integrada**: Gerenciamento direto na página de empresas

### 🎯 Benefícios para Empresas
- **Presença Online**: Site institucional automático
- **SEO Otimizado**: URLs amigáveis para buscadores
- **Mobile First**: Design responsivo para todos dispositivos
- **Carregamento Rápido**: Performance otimizada
- **Sem Custos**: Totalmente gratuito para afiliados

## 🏗️ Arquitetura Técnica

### 📁 Estrutura de Arquivos
```
src/
├── lib/
│   └── company-url-service.ts     # Serviço principal de URLs
├── app/
│   ├── company/
│   │   └── page.tsx              # Interface de gerenciamento
│   └── test-url/
│       └── page.tsx              # Página de testes
└── scripts/
    └── generate-existing-urls.mjs # Script para empresas existentes
```

### 🔧 Componentes Principais

#### CompanyUrlService
Classe principal que gerencia todas as operações de URL:

```typescript
class CompanyUrlService {
  // Métodos estáticos
  static generateSlug(name: string): string
  static generateUniqueSlug(name: string, city: string, state: string): Promise<string>
  static createCompanyUrl(companyId: string, name: string, city: string, state: string): Promise<CompanyUrl>
  static getCompanyUrl(companyId: string): Promise<CompanyUrl | null>
  static updateCompanyUrl(companyId: string, updates: Partial<CompanyUrl>): Promise<void>
  static deleteCompanyUrl(companyId: string): Promise<void>
  static generateUrlsForExistingCompanies(): Promise<BatchResult>
}
```

#### Interface CompanyUrl
```typescript
interface CompanyUrl {
  companyId: string;
  slug: string;
  city: string;
  state: string;
  fullUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Como Usar

### 1. Para Nova Empresa
Ao cadastrar uma empresa com nome, cidade e estado, a URL é gerada automaticamente.

### 2. Para Empresa Existente
Na página de gerenciamento da empresa:
1. Clique em "Gerar Site" na seção "Site Personalizado XECO"
2. A URL será criada instantaneamente
3. Use os botões para copiar ou visitar o site

### 3. Para Lote de Empresas Existentes
Execute o script:
```bash
node scripts/generate-existing-urls.mjs
```

## 📊 Formato das URLs

### Padrão
`xeco.com.br/[cidade]-[uf]/[slug-da-empresa]`

### Exemplos
- **Padaria São José** (São Paulo, SP)  
  → `xeco.com.br/sao-paulo-sp/padaria-sao-jose`

- **Açougue do João & Irmãos** (Rio de Janeiro, RJ)  
  → `xeco.com.br/rio-de-janeiro-rj/acougue-do-joao-irmaos`

- **Farmácia Central & Cia. Ltda.** (Belo Horizonte, MG)  
  → `xeco.com.br/belo-horizonte-mg/farmacia-central-cia-ltda`

## 🔧 Configuração

### Variáveis de Ambiente
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# URL Base (configurável)
NEXT_PUBLIC_BASE_URL=xeco.com.br
```

### Estrutura Firebase
Coleção: `company_urls`
```json
{
  "companyId": "string",
  "slug": "string",
  "city": "string", 
  "state": "string",
  "fullUrl": "string",
  "isActive": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 🧪 Testes

### Página de Testes
Acesse `/test-url` para:
- Testar geração de slugs
- Validar criação no Firebase
- Ver resultados em tempo real

### Testes Automatizados
```bash
# Teste básico de slugs
node test-company-url.mjs

# Teste completo com Firebase (via browser)
http://localhost:3000/test-url
```

## 🎨 Interface do Usuário

### Seção na Página de Empresa
- **Card destacado** com bordas primárias
- **Estado da URL** (existe/não existe)
- **Botões de ação** (gerar, copiar, visitar)
- **Indicadores visuais** (SEO, responsivo, rápido)
- **Loading states** durante operações

### Estados Visuais
- ✅ **URL Criada**: Input com URL + botões de ação
- ⚠️ **Sem URL**: Alert informativo + botão de geração
- 🔄 **Carregando**: Spinners durante operações

## 🔍 Algoritmo de Geração de Slug

1. **Normalização**: Remove acentos (São → Sao)
2. **Limpeza**: Remove caracteres especiais (&, ., Cia., Ltda.)
3. **Formatação**: Converte para lowercase e substitui espaços por hífens
4. **Unicidade**: Adiciona sufixo numérico se necessário

### Exemplos de Transformação
```
"Padaria São José & Cia. Ltda." 
→ "padaria sao jose cia ltda"
→ "padaria-sao-jose-cia-ltda"

"Açougue do João"
→ "acougue do joao" 
→ "acougue-do-joao"
```

## 🚨 Tratamento de Erros

### Validações
- ✅ Nome da empresa obrigatório
- ✅ Cidade e estado obrigatórios
- ✅ Verificação de duplicatas
- ✅ Caracteres válidos para URL

### Mensagens de Erro
- **Dados insuficientes**: "Nome, cidade e estado são obrigatórios"
- **Slug duplicado**: Incremento automático (-2, -3, etc.)
- **Erro Firebase**: Mensagem específica do erro

## 📈 Monitoramento

### Estatísticas Disponíveis
- Total de URLs criadas
- URLs ativas vs inativas
- Distribuição por cidade/estado
- Empresas sem URL

### Logs
Todas as operações são logadas para auditoria e debugging.

## 🔮 Futuras Melhorias

### Planejadas
- [ ] **Analytics**: Rastreamento de visitas
- [ ] **Customização**: Temas personalizados por empresa
- [ ] **SEO Avançado**: Meta tags dinâmicas
- [ ] **Integração Social**: Compartilhamento automático
- [ ] **QR Code**: Geração automática para URLs

### Roadmap
1. **V1.0**: Sistema básico de URLs ✅
2. **V1.1**: Analytics e relatórios
3. **V1.2**: Customização visual
4. **V2.0**: Features avançadas de marketing

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte os logs de erro
2. Teste na página `/test-url`
3. Verifique a configuração do Firebase
4. Execute script de diagnóstico

---

**Desenvolvido para XECO - Sistema de Gestão de Afiliados**  
*Criando presença online para empresas parceiras* 🚀