/**
 * Script para TESTAR sistema de convites de afiliados
 * 
 * USO:
 * npm run test:affiliate
 * 
 * O que faz:
 * 1. Cria um convite de teste no Firestore
 * 2. Gera um token único
 * 3. Mostra a URL para testar
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as crypto from 'crypto'

// Inicializa Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

const db = getFirestore()

// Gera token único
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

async function createTestInvite() {
  console.log('\n🧪 CRIANDO CONVITE DE TESTE...\n')

  const token = generateToken()
  const testEmail = 'teste@afiliado.com'
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 dias

  // Busca uma empresa qualquer do Firestore
  const companiesSnapshot = await db.collection('companies').limit(1).get()
  
  if (companiesSnapshot.empty) {
    console.error('❌ Nenhuma empresa encontrada no Firestore!')
    console.log('   Crie uma empresa primeiro ou use o ID de uma empresa existente')
    return
  }

  const company = companiesSnapshot.docs[0]
  const companyData = company.data()

  // Cria o convite
  const inviteData = {
    inviteToken: token,
    email: testEmail,
    recipientName: 'Afiliado Teste',
    storeId: company.id,
    storeName: companyData.name || 'Loja Teste',
    storeOwnerName: companyData.ownerName || 'Dono Teste',
    commissionRate: 10,
    message: 'Convite de teste criado automaticamente',
    status: 'PENDING',
    createdAt: Timestamp.now(),
    expiresAt: expiresAt,
    inviteUrl: `http://localhost:3000/affiliate/accept?token=${token}`,
    resentCount: 0
  }

  const docRef = await db.collection('affiliate_invitations').add(inviteData)

  console.log('✅ Convite criado com sucesso!\n')
  console.log('📋 DADOS DO CONVITE:')
  console.log('   ID:', docRef.id)
  console.log('   Token:', token)
  console.log('   Email:', testEmail)
  console.log('   Empresa:', companyData.name)
  console.log('   Comissão:', '10%')
  console.log('   Expira em:', expiresAt.toDate().toLocaleDateString('pt-BR'))
  console.log('\n🔗 URL PARA TESTAR:')
  console.log(`   http://localhost:3000/affiliate/accept?token=${token}`)
  console.log('\n📧 Use este email para aceitar:')
  console.log(`   ${testEmail}`)
  console.log('\n🎯 COMO TESTAR:')
  console.log('   1. Abra a URL acima no navegador')
  console.log('   2. Digite o email: teste@afiliado.com')
  console.log('   3. Clique em "Aceitar Convite"')
  console.log('   4. Sistema vai criar conta com senha: Mudar123#')
  console.log('\n💡 ALTERNATIVA - Testar digitando token manualmente:')
  console.log('   1. Acesse: http://localhost:3000/affiliate/accept')
  console.log('   2. Digite o token:', token)
  console.log('   3. Digite o email: teste@afiliado.com')
  console.log('   4. Clique em "Aceitar Convite"\n')
}

async function listPendingInvites() {
  console.log('\n📋 CONVITES PENDENTES:\n')
  
  const invites = await db.collection('affiliate_invitations')
    .where('status', '==', 'PENDING')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get()

  if (invites.empty) {
    console.log('   Nenhum convite pendente encontrado')
    return
  }

  invites.forEach((doc, index) => {
    const data = doc.data()
    console.log(`\n${index + 1}. ${data.recipientName || 'Sem nome'}`)
    console.log(`   Token: ${data.inviteToken}`)
    console.log(`   Email: ${data.email}`)
    console.log(`   Loja: ${data.storeName}`)
    console.log(`   URL: ${data.inviteUrl}`)
  })
  console.log('')
}

async function cleanupTestInvites() {
  console.log('\n🧹 LIMPANDO CONVITES DE TESTE...\n')
  
  const testInvites = await db.collection('affiliate_invitations')
    .where('email', '==', 'teste@afiliado.com')
    .get()

  if (testInvites.empty) {
    console.log('   Nenhum convite de teste encontrado')
    return
  }

  const batch = db.batch()
  testInvites.forEach(doc => {
    batch.delete(doc.ref)
  })
  await batch.commit()

  console.log(`✅ ${testInvites.size} convite(s) de teste removido(s)\n`)
}

// Menu principal
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'create':
      await createTestInvite()
      break
    case 'list':
      await listPendingInvites()
      break
    case 'clean':
      await cleanupTestInvites()
      break
    default:
      console.log('\n🧪 SCRIPT DE TESTE - CONVITES DE AFILIADOS\n')
      console.log('Comandos disponíveis:')
      console.log('  npm run test:affiliate create  - Cria convite de teste')
      console.log('  npm run test:affiliate list    - Lista convites pendentes')
      console.log('  npm run test:affiliate clean   - Remove convites de teste')
      console.log('')
      await createTestInvite()
  }

  process.exit(0)
}

main().catch(console.error)
