'use client'

import { useDeepLinks } from '@/hooks/useDeepLinks'

/**
 * Componente que registra o listener de Deep Links
 * Usado para capturar callbacks de pagamento e outras URLs
 */
export function DeepLinkHandler() {
  useDeepLinks()
  return null
}
