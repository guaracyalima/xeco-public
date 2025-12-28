/**
 * Configurações globais da aplicação
 */

// Detecta se está em desenvolvimento ou produção
const isDevelopment = process.env.NODE_ENV === 'development'

// Base URL da aplicação
export const APP_BASE_URL = isDevelopment 
  ? 'https://xeco.com.br' 
  : 'https://xuxum.com.br'

// URLs de callback para o checkout
export const CHECKOUT_CALLBACKS = {
  success: `${APP_BASE_URL}/checkout/success`,
  cancel: `${APP_BASE_URL}/checkout/cancel`,
  expired: `${APP_BASE_URL}/checkout/expired`
} as const

// Configurações gerais
export const APP_CONFIG = {
  name: 'Xuxum',
  domain: isDevelopment ? 'localhost' : 'xuxum.com.br',
  isDevelopment
} as const
