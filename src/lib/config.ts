/**
 * Configurações globais da aplicação
 */

// Detecta se está em desenvolvimento ou produção
const isDevelopment = process.env.NODE_ENV === 'development'

// Base URL da aplicação
export const APP_BASE_URL = isDevelopment 
  ? 'https://xuxum.com.br' 
  : 'https://xuxum.com.br'

// Custom URL Scheme para callbacks no mobile (abre o app diretamente)
export const APP_CUSTOM_SCHEME = 'xuxum'

// URLs de callback para o checkout (versão web)
export const CHECKOUT_CALLBACKS = {
  success: `${APP_BASE_URL}/checkout/success`,
  cancel: `${APP_BASE_URL}/checkout/cancel`,
  expired: `${APP_BASE_URL}/checkout/expired`
} as const

// URLs de callback para o checkout (versão mobile - Custom URL Scheme)
export const CHECKOUT_CALLBACKS_MOBILE = {
  success: `${APP_CUSTOM_SCHEME}://checkout/success`,
  cancel: `${APP_CUSTOM_SCHEME}://checkout/cancel`,
  expired: `${APP_CUSTOM_SCHEME}://checkout/expired`
} as const

// Configurações gerais
export const APP_CONFIG = {
  name: 'Xuxum',
  domain: isDevelopment ? 'localhost' : 'xuxum.com.br',
  isDevelopment
} as const
