# Sistema de Alertas de Conta Digital (Asaas) - Documentação Completa

## 📋 Visão Geral

Este documento contém toda a implementação do **Sistema de Alertas Preventivos** para contas digitais com problemas no Asaas. O sistema foi desenvolvido para detectar automaticamente empresas com pendências e exibir alertas imediatos ao usuário.

## 🎯 Funcionalidades

- **Detecção Automática**: Identifica empresas com erros de conta digital
- **Alertas Preventivos**: SweetAlert2 com interface elegante
- **Modal de Correção**: Interface para corrigir dados problemáticos
- **Testes Automatizados**: Validação com Playwright
- **Mobile-First**: Design responsivo

## 🛠️ Stack Tecnológica

- **Frontend**: React/Next.js com TypeScript
- **Alertas**: SweetAlert2
- **Testes**: Playwright
- **Estado**: React Hooks (useState, useEffect)
- **Validação**: Verificação automática de status

## 📦 Dependências Necessárias

```bash
npm install sweetalert2
npm install -D @playwright/test
```

## 🏗️ Estrutura de Arquivos

```
src/
├── components/
│   └── company/
│       ├── AccountErrorAlert.tsx      # Componente de alerta
│       └── AccountErrorFixModal.tsx   # Modal de correção
├── services/
│   └── accountErrorService.ts         # Serviço de erros
├── hooks/
│   └── useAccountErrors.ts            # Hook personalizado
├── types/
│   └── account-errors.ts              # Definições TypeScript
└── app/
    └── company/
        └── page.tsx                   # Página principal

tests/
├── company-alerts.spec.ts             # Testes Playwright
└── debug.spec.ts                      # Testes de debug
```

## 🔧 Implementação

### 1. Tipos TypeScript

```typescript
// src/types/account-errors.ts
export interface AccountError {
  errorCode: string
  fieldName: string
  fieldLabel: string
  description: string
  errorType: 'DUPLICATE_DATA' | 'INVALID_DATA' | 'MISSING_DATA' | 'EXTERNAL_CONFLICT'
  isFieldCorrect: boolean
  currentValue: string
  suggestedValue: string
}

export interface Company {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  hasAccountErrors: boolean
  accountStatus: 'ACTIVE' | 'ERROR' | 'PENDING'
  createdAt: string
}
```

### 2. Serviço de Conta Digital

```typescript
// src/services/accountErrorService.ts
import { AccountError, Company } from '@/types/account-errors'

// Dados mockados para demonstração
const MOCK_COMPANIES: Company[] = [
  {
    id: 'company-with-cnpj-error',
    name: "Templo de quimbanda nordestina",
    cnpj: "55163977075",
    email: "cangaceiroconcurso@gmail.com", 
    phone: "(61) 98338-2778",
    hasAccountErrors: true,
    accountStatus: 'ERROR',
    createdAt: "17/10/2025"
  },
  {
    id: 'company-with-external-conflict',
    name: "Restaurante Sabor & Arte",
    cnpj: "12345678000199",
    email: "contato@saborearte.com", 
    phone: "(21) 99999-6666",
    hasAccountErrors: true,
    accountStatus: 'ERROR',
    createdAt: "15/10/2025"
  },
  {
    id: 'company-without-errors',
    name: "Café & Cia Sem Erros",
    cnpj: "98765432000188",
    email: "contato@cafeecia.com", 
    phone: "(41) 99999-8888",
    hasAccountErrors: false,
    accountStatus: 'ACTIVE',
    createdAt: "10/10/2025"
  }
]

export class AccountErrorService {
  
  // Buscar empresas disponíveis
  static async getCompanies(): Promise<Company[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    return MOCK_COMPANIES
  }

  // Verificar se empresa tem erros
  static async checkCompanyErrors(companyId: string): Promise<AccountError[]> {
    const company = MOCK_COMPANIES.find(c => c.id === companyId)
    
    if (!company || !company.hasAccountErrors) {
      return []
    }

    // Mock de erros específicos por empresa
    const errorMocks: Record<string, AccountError[]> = {
      'company-with-cnpj-error': [
        {
          errorCode: 'ERR_CNPJ_001',
          fieldName: 'cnpj',
          fieldLabel: 'CNPJ',
          description: 'CPF/CNPJ já cadastrado no Asaas0 - Erro na Integração de Vendas',
          errorType: 'DUPLICATE_DATA',
          isFieldCorrect: false,
          currentValue: company.cnpj,
          suggestedValue: ''
        }
      ],
      'company-with-external-conflict': [
        {
          errorCode: 'ERR_PROFILE_001',
          fieldName: 'businessProfile',
          fieldLabel: 'Perfil da Empresa',
          description: 'Perfil incompleto - Informações obrigatórias em falta',
          errorType: 'MISSING_DATA',
          isFieldCorrect: false,
          currentValue: '',
          suggestedValue: 'Complete: Sobre a empresa, Cidade, Endereço'
        }
      ]
    }

    return errorMocks[companyId] || []
  }

  // Simular correção de erro
  static async fixAccountError(companyId: string, errorCode: string, newValue: string): Promise<boolean> {
    console.log(`🔧 Corrigindo erro ${errorCode} para empresa ${companyId} com valor: ${newValue}`)
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simular sucesso/falha
    return Math.random() > 0.2 // 80% de sucesso
  }
}
```

### 3. Hook Personalizado

```typescript
// src/hooks/useAccountErrors.ts
import { useState, useEffect } from 'react'
import { AccountError } from '@/types/account-errors'
import { AccountErrorService } from '@/services/accountErrorService'

export function useAccountErrors(companyId: string | null) {
  const [errors, setErrors] = useState<AccountError[]>([])
  const [loading, setLoading] = useState(false)
  const [hasErrors, setHasErrors] = useState(false)

  useEffect(() => {
    if (!companyId) {
      setErrors([])
      setHasErrors(false)
      return
    }

    setLoading(true)
    
    AccountErrorService.checkCompanyErrors(companyId)
      .then(errorList => {
        setErrors(errorList)
        setHasErrors(errorList.length > 0)
      })
      .catch(error => {
        console.error('Erro ao verificar erros da empresa:', error)
        setErrors([])
        setHasErrors(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [companyId])

  const refreshErrors = () => {
    if (companyId) {
      setLoading(true)
      AccountErrorService.checkCompanyErrors(companyId)
        .then(setErrors)
        .finally(() => setLoading(false))
    }
  }

  return {
    errors,
    loading,
    hasErrors,
    refreshErrors
  }
}
```

### 4. Componente de Alerta

```typescript
// src/components/company/AccountErrorAlert.tsx
'use client'

import { useEffect } from 'react'
import { Company } from '@/types/account-errors'

interface AccountErrorAlertProps {
  company: Company
  onFixRequest: () => void
}

export function AccountErrorAlert({ company, onFixRequest }: AccountErrorAlertProps) {
  
  useEffect(() => {
    if (company.hasAccountErrors) {
      // Delay para mostrar após seleção
      const timer = setTimeout(() => {
        showAccountErrorAlert()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [company])

  const showAccountErrorAlert = () => {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: '⚠️ Conta Digital com Pendências',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px; color: #666; font-size: 14px;">
              A empresa <strong>${company.name}</strong> possui pendências no cadastro do Asaas 
              que <strong>precisam ser resolvidas agora mesmo</strong>.
            </p>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 10px 0;">
              <p style="margin: 0; color: #991b1b; font-size: 13px; font-weight: 500;">
                <strong>🚨 Erro de Integração:</strong> CPF/CNPJ já cadastrado no Asaas0
              </p>
            </div>

            <div style="margin-top: 15px;">
              <p style="margin: 5px 0; color: #666; font-size: 13px;">
                <strong>Sem a correção, você não poderá:</strong>
              </p>
              <ul style="margin: 8px 0; padding-left: 20px; color: #666; font-size: 12px;">
                <li>Receber pagamentos pela plataforma</li>
                <li>Processar novos pedidos</li>
                <li>Acessar relatórios financeiros</li>
              </ul>
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: false,
        confirmButtonText: '🔧 Corrigir Dados Agora',
        confirmButtonColor: '#ef4444',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.isConfirmed) {
          onFixRequest()
        }
      })
    })
  }

  return null // Componente não renderiza UI diretamente
}
```

### 5. Modal de Correção

```typescript
// src/components/company/AccountErrorFixModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { AccountError } from '@/types/account-errors'
import { AccountErrorService } from '@/services/accountErrorService'

interface AccountErrorFixModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  errors: AccountError[]
}

export function AccountErrorFixModal({ isOpen, onClose, companyId, errors }: AccountErrorFixModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0)

  useEffect(() => {
    if (isOpen && errors.length > 0) {
      // Inicializar form com valores atuais
      const initialData: Record<string, string> = {}
      errors.forEach(error => {
        initialData[error.fieldName] = error.currentValue
      })
      setFormData(initialData)
      setCurrentErrorIndex(0)
    }
  }, [isOpen, errors])

  const currentError = errors[currentErrorIndex]
  const hasNextError = currentErrorIndex < errors.length - 1
  const hasPrevError = currentErrorIndex > 0

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleFixError = async () => {
    if (!currentError) return

    setLoading(true)
    
    try {
      const newValue = formData[currentError.fieldName] || ''
      const success = await AccountErrorService.fixAccountError(companyId, currentError.errorCode, newValue)
      
      if (success) {
        // Sucesso - prosseguir para próximo erro ou fechar
        if (hasNextError) {
          setCurrentErrorIndex(prev => prev + 1)
        } else {
          // Todos os erros corrigidos
          import('sweetalert2').then((Swal) => {
            Swal.default.fire({
              title: '✅ Conta Corrigida!',
              text: 'Todos os problemas foram resolvidos. Sua conta digital está funcionando normalmente.',
              icon: 'success',
              confirmButtonText: 'Ótimo!',
              confirmButtonColor: '#10b981'
            }).then(() => {
              onClose()
            })
          })
        }
      } else {
        // Erro na correção
        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            title: '❌ Erro na Correção',
            text: 'Não foi possível corrigir este problema. Tente novamente ou entre em contato com o suporte.',
            icon: 'error',
            confirmButtonText: 'Tentar Novamente',
            confirmButtonColor: '#ef4444'
          })
        })
      }
    } catch (error) {
      console.error('Erro ao corrigir:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateError = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && hasPrevError) {
      setCurrentErrorIndex(prev => prev - 1)
    } else if (direction === 'next' && hasNextError) {
      setCurrentErrorIndex(prev => prev + 1)
    }
  }

  if (!isOpen || !currentError) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            🔧 Corrigir Dados da Conta Digital
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Erro {currentErrorIndex + 1} de {errors.length}</span>
            <div className="flex gap-2">
              {errors.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentErrorIndex ? 'bg-blue-600' : 
                    index < currentErrorIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Info */}
          <div className="mb-6">
            <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-400 rounded">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">{currentError.description}</h3>
                <p className="text-sm text-red-600 mt-1">
                  Campo: <strong>{currentError.fieldLabel}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentError.fieldLabel}
              </label>
              
              {currentError.errorType === 'MISSING_DATA' ? (
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder={currentError.suggestedValue || `Digite o(a) ${currentError.fieldLabel.toLowerCase()}`}
                  value={formData[currentError.fieldName] || ''}
                  onChange={(e) => handleInputChange(currentError.fieldName, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={currentError.suggestedValue || `Digite o(a) ${currentError.fieldLabel.toLowerCase()} correto(a)`}
                  value={formData[currentError.fieldName] || ''}
                  onChange={(e) => handleInputChange(currentError.fieldName, e.target.value)}
                />
              )}
              
              {currentError.currentValue && (
                <p className="text-sm text-gray-500 mt-1">
                  Valor atual: <span className="font-mono">{currentError.currentValue}</span>
                </p>
              )}
            </div>

            {currentError.suggestedValue && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Sugestão:</strong> {currentError.suggestedValue}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => navigateError('prev')}
              disabled={!hasPrevError}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() => navigateError('next')}
              disabled={!hasNextError}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo →
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleFixError}
              disabled={loading || !formData[currentError.fieldName]?.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Corrigir Este Erro
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 6. Página Principal (Exemplo de Uso)

```typescript
// src/app/company/page.tsx
'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { AccountErrorAlert } from '@/components/company/AccountErrorAlert'
import { AccountErrorFixModal } from '@/components/company/AccountErrorFixModal'
import { useAccountErrors } from '@/hooks/useAccountErrors'
import { Company } from '@/types/account-errors'

// Dados mockados de empresas
const availableCompanies: Company[] = [
  {
    id: 'company-with-cnpj-error',
    name: "Templo de quimbanda nordestina",
    cnpj: "55163977075",
    email: "cangaceiroconcurso@gmail.com", 
    phone: "(61) 98338-2778",
    hasAccountErrors: true,
    accountStatus: 'ERROR',
    createdAt: "17/10/2025"
  },
  {
    id: 'company-with-external-conflict',
    name: "Restaurante Sabor & Arte",
    cnpj: "12345678000199",
    email: "contato@saborearte.com", 
    phone: "(21) 99999-6666",
    hasAccountErrors: true,
    accountStatus: 'ERROR',
    createdAt: "15/10/2025"
  },
  {
    id: 'company-without-errors',
    name: "Café & Cia Sem Erros",
    cnpj: "98765432000188",
    email: "contato@cafeecia.com", 
    phone: "(41) 99999-8888",
    hasAccountErrors: false,
    accountStatus: 'ACTIVE',
    createdAt: "10/10/2025"
  }
]

export default function CompanyManagementPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [showFixModal, setShowFixModal] = useState(false)
  
  const selectedCompany = availableCompanies.find(c => c.id === selectedCompanyId)
  const { errors, loading, hasErrors } = useAccountErrors(selectedCompanyId || null)

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId)
  }

  const handleOpenFixModal = () => {
    setShowFixModal(true)
  }

  const handleCloseFixModal = () => {
    setShowFixModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            Gestão de Empresas
          </h1>
          <p className="text-gray-600 mt-2">
            Selecione uma empresa para gerenciar configurações e dados da conta digital.
          </p>
        </div>

        {/* Company Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar Empresa
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedCompanyId}
            onChange={(e) => handleCompanyChange(e.target.value)}
          >
            <option value="">🏢 -- Selecione uma empresa --</option>
            {availableCompanies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name} {company.hasAccountErrors ? '⚠️ COM ERRO' : '✅ SEM ERRO'}
              </option>
            ))}
          </select>

          {/* Informação de Teste */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🧪 <strong>Teste do Sistema de Alertas</strong>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              As empresas marcadas com ⚠️ <strong>COM ERRO</strong> vão mostrar o SweetAlert automaticamente quando selecionadas.
            </p>
          </div>
        </div>

        {/* Company Details */}
        {selectedCompany && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedCompany.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <p className="text-gray-900">{selectedCompany.cnpj}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedCompany.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <p className="text-gray-900">{selectedCompany.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedCompany.accountStatus === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedCompany.accountStatus}
                </span>
              </div>
            </div>

            {hasErrors && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">
                  ⚠️ Esta empresa possui {errors.length} erro(s) na conta digital
                </p>
                <button
                  onClick={handleOpenFixModal}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Corrigir Problemas
                </button>
              </div>
            )}
          </div>
        )}

        {/* Componentes de Alerta */}
        {selectedCompany && (
          <AccountErrorAlert
            company={selectedCompany}
            onFixRequest={handleOpenFixModal}
          />
        )}

        {/* Modal de Correção */}
        <AccountErrorFixModal
          isOpen={showFixModal}
          onClose={handleCloseFixModal}
          companyId={selectedCompanyId}
          errors={errors}
        />
      </div>
    </div>
  )
}
```

## 🧪 Testes Automatizados

### Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Testes de Alerta

```typescript
// tests/company-alerts.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Sistema de Alertas - Empresa', () => {
  
  test('Seleção de Empresa com Erro', async ({ page }) => {
    console.log('🧪 Iniciando teste automatizado do sistema de alertas')
    
    // Navegar para a página
    await page.goto('/company')
    console.log('✅ Página carregada')

    // Verificar se o select existe
    const companySelect = page.locator('select')
    await expect(companySelect).toBeVisible()
    console.log('✅ Select de empresas encontrado')

    // Verificar se a opção existe no DOM
    const firstOptionWithError = page.locator('option[value="company-with-cnpj-error"]')
    await expect(firstOptionWithError).toBeAttached()
    console.log('✅ Primeira opção com erro encontrada no DOM')

    // Selecionar empresa com erro
    await companySelect.selectOption('company-with-cnpj-error')
    console.log('✅ Empresa com erro selecionada')

    // Aguardar SweetAlert aparecer
    await page.waitForSelector('.swal2-container', { timeout: 3000 })
    console.log('✅ Alerta detectado')

    // Verificar conteúdo do alerta
    const alertTitle = page.locator('.swal2-title')
    await expect(alertTitle).toContainText('Conta Digital com Pendências')

    const alertContent = page.locator('.swal2-html-container')
    await expect(alertContent).toContainText('Templo de quimbanda nordestina')

    // Verificar botão de correção
    const fixButton = page.locator('.swal2-confirm')
    await expect(fixButton).toContainText('Corrigir Dados Agora')
    
    console.log('✅ Teste concluído com sucesso')
  })

  test('Verificar Estrutura da Página', async ({ page }) => {
    await page.goto('/company')
    
    // Verificar elementos principais
    const header = page.locator('h1')
    await expect(header).toContainText('Gestão de Empresas')
    console.log('✅ Header encontrado')

    const companySelect = page.locator('select')
    await expect(companySelect).toBeVisible()
    console.log('✅ Select encontrado')

    // Verificar opções do select
    const options = await companySelect.locator('option').allTextContents()
    console.log('📋 Opções do select:', options)
    
    expect(options.some(option => option.includes('COM ERRO'))).toBeTruthy()
    console.log('✅ Empresas com erro encontradas nas opções')
  })
})
```

## 📱 Mobile-First Design

### Estrutura Responsiva

```scss
// Breakpoints Mobile-First
.container {
  // Mobile (padrão)
  padding: 1rem;
  
  // Tablet
  @media (min-width: 768px) {
    padding: 2rem;
  }
  
  // Desktop
  @media (min-width: 1024px) {
    padding: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}

.alert-modal {
  // Mobile: Fullscreen
  width: 100vw;
  height: 100vh;
  
  // Desktop: Centered
  @media (min-width: 768px) {
    width: 500px;
    height: auto;
    border-radius: 8px;
  }
}
```

## 🚀 Deploy e Configuração

### Variáveis de Ambiente

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.seudominio.com
ASAAS_API_KEY=sua_chave_api_asaas
ASAAS_WEBHOOK_URL=https://seuapp.com/webhooks/asaas
```

### Scripts de Build

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug"
  }
}
```

## 🔄 Fluxo Completo de Uso

1. **Usuário acessa página de gestão**
2. **Sistema carrega lista de empresas**
3. **Usuário seleciona empresa no dropdown**
4. **Sistema verifica automaticamente se há erros**
5. **Se há erros**: SweetAlert dispara imediatamente
6. **Usuário clica "Corrigir Dados"**
7. **Modal abre com formulário específico**
8. **Usuário preenche dados corretos**
9. **Sistema envia correção para API do Asaas**
10. **Feedback de sucesso/erro para o usuário**

## 🎯 Próximos Passos

- [ ] Integração com API real do Asaas
- [ ] Webhook para atualizações automáticas
- [ ] Notificações push para novos erros
- [ ] Dashboard de métricas de erros
- [ ] Relatório de correções realizadas

---

## 📞 Suporte

Para dúvidas sobre implementação:

1. **Documentação**: Consulte este arquivo completo
2. **Testes**: Execute `npm run test` para validar
3. **Debug**: Use `npm run test:debug` para análise detalhada
4. **Logs**: Verifique console do navegador para debug do SweetAlert

---

**Desenvolvido para o sistema correto de gestão de empresas** 🏢✨