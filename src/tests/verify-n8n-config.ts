/**
 * Script de verificação rápida das variáveis de ambiente
 * Execute no console do navegador
 */

console.log('🔍 Verificando configurações do n8n...\n')

// Importa as configurações
import { N8N_ENDPOINTS } from '@/lib/n8n-config'

console.log('📋 Endpoint configurado:')
console.log('  createPayment:', N8N_ENDPOINTS.createPayment)

console.log('\n✅ Se o endpoint termina com /webhook-test/create-payment, está correto!')

// Verifica variáveis de ambiente no cliente
console.log('\n🌍 Variáveis de ambiente (cliente):')
console.log('  NEXT_PUBLIC_N8N_WEBHOOK_URL:', process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL)
console.log('  NEXT_PUBLIC_N8N_URL:', process.env.NEXT_PUBLIC_N8N_URL)

export { N8N_ENDPOINTS }
