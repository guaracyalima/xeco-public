'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface AsaasAccountFormProps {
  cpfCnpj: string
  email: string
  onSubmit: (data: AsaasAccountData) => Promise<void>
  onCancel: () => void
}

export interface AsaasAccountData {
  name: string
  email: string
  cpfCnpj: string
  birthDate?: string // Obrigatório só para CPF
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION' // Obrigatório só para CNPJ
  phone?: string
  mobilePhone: string
  site?: string
  incomeValue?: number
  address: string
  addressNumber: string
  complement?: string
  province: string
  postalCode: string
}

// Máscaras de formatação
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`
}

const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 14)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`
}

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
}

const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8)
  if (numbers.length <= 5) return numbers
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
}

// Validação de Email melhorada
const validateEmail = (email: string): boolean => {
  if (!email) return false
  
  // Regex mais rigoroso para email
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) return false
  
  // Não pode ter .. ou .- ou -. 
  if (email.includes('..') || email.includes('.-') || email.includes('-.')) return false
  
  // Não pode começar ou terminar com . ou -
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return false
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false
  if (localPart.startsWith('-') || localPart.endsWith('-')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (domain.startsWith('-') || domain.endsWith('-')) return false
  
  return true
}

// Validação de CPF
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')
  if (cleanCPF.length !== 11) return false
  
  // Números sequenciais iguais (000.000.000-00, 111.111.111-11, etc)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Sequências conhecidas inválidas
  const invalidSequences = [
    '01234567890', '12345678901', '23456789012',
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ]
  if (invalidSequences.includes(cleanCPF)) return false

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false

  return true
}

// Validação de CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  if (cleanCNPJ.length !== 14) return false
  
  // Números sequenciais iguais (00.000.000/0000-00, etc)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // Sequências conhecidas inválidas
  const invalidSequences = [
    '00000000000000', '11111111111111', '22222222222222', '33333333333333',
    '44444444444444', '55555555555555', '66666666666666', '77777777777777',
    '88888888888888', '99999999999999'
  ]
  if (invalidSequences.includes(cleanCNPJ)) return false

  let length = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, length)
  const digits = cleanCNPJ.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  length = length + 1
  numbers = cleanCNPJ.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

const isCPF = (doc: string) => {
  if (!doc) return false
  return doc.replace(/\D/g, '').length === 11
}

const isCNPJ = (doc: string) => {
  if (!doc) return false
  return doc.replace(/\D/g, '').length === 14
}

export default function AsaasAccountForm({ cpfCnpj, email, onSubmit, onCancel }: AsaasAccountFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Validações específicas de campo
  const [documentError, setDocumentError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [checkingDocument, setCheckingDocument] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  
  // Se cpfCnpj vier vazio, determina dinamicamente baseado no que o usuário digitar
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ' | null>(
    cpfCnpj ? (isCPF(cpfCnpj) ? 'CPF' : 'CNPJ') : null
  )
  
  const [formData, setFormData] = useState<AsaasAccountData>({
    name: '',
    email: '', // Começa vazio - usuário preenche
    cpfCnpj: cpfCnpj,
    birthDate: undefined,
    companyType: undefined,
    phone: '',
    mobilePhone: '',
    site: '',
    incomeValue: 1000, // Valor padrão
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    postalCode: ''
  })

  // Verifica se documento já existe no Firestore
  const checkDocumentExists = async (document: string): Promise<boolean> => {
    if (!document) return false
    
    const cleanDoc = document.replace(/\D/g, '')
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) return false
    
    try {
      setCheckingDocument(true)
      
      // Verifica em users
      const usersRef = collection(db, 'users')
      const usersQuery = query(usersRef, where('document_number', '==', cleanDoc))
      const usersSnapshot = await getDocs(usersQuery)
      
      if (!usersSnapshot.empty) {
        return true
      }
      
      // Verifica em affiliated
      const affiliatedRef = collection(db, 'affiliated')
      const affiliatedQuery = query(affiliatedRef, where('cpfCnpj', '==', cleanDoc))
      const affiliatedSnapshot = await getDocs(affiliatedQuery)
      
      return !affiliatedSnapshot.empty
      
    } catch (error) {
      console.error('Erro ao verificar documento:', error)
      return false
    } finally {
      setCheckingDocument(false)
    }
  }

  // Verifica se email já existe no Firestore
  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    if (!emailToCheck) return false
    
    try {
      setCheckingEmail(true)
      
      // Verifica em users
      const usersRef = collection(db, 'users')
      const usersQuery = query(usersRef, where('email', '==', emailToCheck.toLowerCase()))
      const usersSnapshot = await getDocs(usersQuery)
      
      if (!usersSnapshot.empty) {
        return true
      }
      
      // Verifica em affiliated
      const affiliatedRef = collection(db, 'affiliated')
      const affiliatedQuery = query(affiliatedRef, where('email', '==', emailToCheck.toLowerCase()))
      const affiliatedSnapshot = await getDocs(affiliatedQuery)
      
      return !affiliatedSnapshot.empty
      
    } catch (error) {
      console.error('Erro ao verificar email:', error)
      return false
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleChange = (field: keyof AsaasAccountData, value: string) => {
    let formattedValue = value
    
    // Aplica máscaras conforme o campo
    if (field === 'cpfCnpj') {
      // Aceita somente números
      const numbers = value.replace(/\D/g, '')
      
      // Limpa erro anterior ao digitar
      setDocumentError('')
      
      // Determina tipo e aplica máscara
      if (numbers.length <= 11) {
        formattedValue = formatCPF(value)
        if (numbers.length === 11) {
          setDocumentType('CPF')
        } else {
          setDocumentType(null)
        }
      } else {
        formattedValue = formatCNPJ(value)
        if (numbers.length === 14) {
          setDocumentType('CNPJ')
        } else {
          setDocumentType(null)
        }
      }
    }
    
    // Máscara para telefones
    if (field === 'mobilePhone' || field === 'phone') {
      formattedValue = formatPhone(value)
    }
    
    // Máscara para CEP
    if (field === 'postalCode') {
      formattedValue = formatCEP(value)
    }
    
    // Se mudar email, limpa erro
    if (field === 'email') {
      setEmailError('')
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    setError('')
  }

  // Valida CPF/CNPJ ao sair do campo (onBlur)
  const handleDocumentBlur = async () => {
    const cleanDoc = formData.cpfCnpj.replace(/\D/g, '')
    
    if (!cleanDoc) {
      setDocumentError('')
      return
    }
    
    // Valida formato
    if (cleanDoc.length === 11) {
      if (!validateCPF(formData.cpfCnpj)) {
        setDocumentError('CPF inválido')
        setFormData(prev => ({ ...prev, cpfCnpj: '' }))
        return
      }
    } else if (cleanDoc.length === 14) {
      if (!validateCNPJ(formData.cpfCnpj)) {
        setDocumentError('CNPJ inválido')
        setFormData(prev => ({ ...prev, cpfCnpj: '' }))
        return
      }
    } else {
      setDocumentError('Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos')
      return
    }
    
    // Verifica se já existe
    const exists = await checkDocumentExists(formData.cpfCnpj)
    if (exists) {
      setDocumentError('Este CPF/CNPJ já está sendo utilizado')
      setFormData(prev => ({ ...prev, cpfCnpj: '' }))
    }
  }

  // Valida email ao sair do campo (onBlur)
  const handleEmailBlur = async () => {
    const emailToCheck = formData.email
    
    if (!emailToCheck) {
      setEmailError('')
      return
    }
    
    // Valida formato com regex melhorado
    if (!validateEmail(emailToCheck)) {
      setEmailError('Email inválido. Use o formato: exemplo@dominio.com')
      setFormData(prev => ({ ...prev, email: '' }))
      return
    }
    
    // Verifica se já existe
    const exists = await checkEmailExists(emailToCheck)
    if (exists) {
      setEmailError('Este email já está sendo utilizado')
      setFormData(prev => ({ ...prev, email: '' }))
    }
  }

  const validateForm = (): string | null => {
    if (!formData.cpfCnpj.trim()) return 'CPF ou CNPJ é obrigatório'
    if (!formData.name.trim()) return 'Nome é obrigatório'
    if (!formData.email.trim()) return 'Email é obrigatório'
    if (!formData.mobilePhone.trim()) return 'Celular é obrigatório'
    if (!formData.address.trim()) return 'Endereço é obrigatório'
    if (!formData.addressNumber.trim()) return 'Número é obrigatório'
    if (!formData.province.trim()) return 'Bairro é obrigatório'
    if (!formData.postalCode.trim()) return 'CEP é obrigatório'
    
    const cleanDoc = formData.cpfCnpj.replace(/\D/g, '')
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      return 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
    }
    
    if (isCPF(formData.cpfCnpj) && !formData.birthDate) {
      return 'Data de nascimento é obrigatória para CPF'
    }
    
    if (isCNPJ(formData.cpfCnpj) && !formData.companyType) {
      return 'Tipo de empresa é obrigatório para CNPJ'
    }
    
    return null
  }

  // Verifica se o formulário está válido para habilitar o botão
  const isFormValid = (): boolean => {
    // Não pode ter erros de validação
    if (documentError || emailError) return false
    
    // Não pode estar verificando
    if (checkingDocument || checkingEmail) return false
    
    // Campos obrigatórios preenchidos
    if (!formData.cpfCnpj.trim()) return false
    if (!formData.name.trim()) return false
    if (!formData.email.trim()) return false
    if (!formData.mobilePhone.trim()) return false
    if (!formData.address.trim()) return false
    if (!formData.addressNumber.trim()) return false
    if (!formData.province.trim()) return false
    if (!formData.postalCode.trim()) return false
    
    // Validações condicionais
    if (isCPF(formData.cpfCnpj) && !formData.birthDate) return false
    if (isCNPJ(formData.cpfCnpj) && !formData.companyType) return false
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await onSubmit(formData)
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta Asaas')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        Criar Conta de Pagamento
      </h2>
      
      <p className="text-sm text-gray-600 mb-6">
        Para receber suas comissões, precisamos criar uma conta de pagamento para você.
        Preencha os dados abaixo:
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CPF/CNPJ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {documentType || 'CPF/CNPJ'} *
          </label>
          <input
            type="text"
            value={formData.cpfCnpj}
            onChange={(e) => handleChange('cpfCnpj', e.target.value)}
            onBlur={handleDocumentBlur}
            readOnly={!!cpfCnpj} // Readonly só se vier preenchido
            className={`w-full px-4 py-2 border rounded-lg ${
              documentError 
                ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                : cpfCnpj 
                  ? 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed' 
                  : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
            }`}
            placeholder={
              cpfCnpj 
                ? '' 
                : documentType === 'CPF' 
                  ? '000.000.000-00' 
                  : documentType === 'CNPJ'
                    ? '00.000.000/0000-00'
                    : 'Digite CPF ou CNPJ'
            }
            disabled={checkingDocument}
          />
          {checkingDocument && (
            <p className="text-xs text-blue-600 mt-1">🔄 Verificando documento...</p>
          )}
          {documentError && (
            <p className="text-xs text-red-600 mt-1">❌ {documentError}</p>
          )}
          {!cpfCnpj && !documentError && !checkingDocument && (
            <p className="text-xs text-gray-500 mt-1">
              {documentType 
                ? `Formato: ${documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}`
                : 'Digite apenas números - máscara será aplicada automaticamente'
              }
            </p>
          )}
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo {isCNPJ(formData.cpfCnpj) && '/ Razão Social'} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={isCPF(formData.cpfCnpj) ? "João da Silva" : "Empresa LTDA"}
          />
        </div>

        {/* Email Principal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-2 border rounded-lg ${
              emailError 
                ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
            }`}
            placeholder="seu@email.com"
            disabled={checkingEmail}
          />
          {checkingEmail && (
            <p className="text-xs text-blue-600 mt-1">🔄 Verificando email...</p>
          )}
          {emailError && (
            <p className="text-xs text-red-600 mt-1">❌ {emailError}</p>
          )}
        </div>

        {/* Data de Nascimento (só para CPF) */}
        {isCPF(formData.cpfCnpj) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Nascimento *
            </label>
            <input
              type="date"
              value={formData.birthDate || ''}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}

        {/* Tipo de Empresa (só para CNPJ) */}
        {isCNPJ(formData.cpfCnpj) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Empresa *
            </label>
            <select
              value={formData.companyType || ''}
              onChange={(e) => handleChange('companyType', e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Selecione...</option>
              <option value="MEI">MEI - Microempreendedor Individual</option>
              <option value="LIMITED">LTDA - Sociedade Limitada</option>
              <option value="INDIVIDUAL">Empresário Individual</option>
              <option value="ASSOCIATION">Associação</option>
            </select>
          </div>
        )}

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Celular/WhatsApp *
          </label>
          <input
            type="tel"
            value={formData.mobilePhone}
            onChange={(e) => handleChange('mobilePhone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="(11) 99999-9999"
          />
          <p className="text-xs text-gray-500 mt-1">
            Formato: (00) 00000-0000
          </p>
        </div>

        {/* Endereço */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-medium text-gray-900">Endereço</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP *
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="00000-000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: 00000-000
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rua *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Rua Fernando Orlandi"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="text"
                value={formData.addressNumber}
                onChange={(e) => handleChange('addressNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="544"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro *
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Jardim Pedra Branca"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento (opcional)
              </label>
              <input
                type="text"
                value={formData.complement || ''}
                onChange={(e) => handleChange('complement', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Apto 101"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="flex-1 px-6 py-3 bg-primary rounded-lg hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Criando...' : 'Criar Conta'}
          </button>
        </div>
        
        {/* Info sobre validação */}
        {!isFormValid() && !loading && (
          <p className="text-xs text-center text-gray-500">
            ℹ️ Preencha todos os campos obrigatórios para continuar
          </p>
        )}
      </form>
    </div>
  )
}
