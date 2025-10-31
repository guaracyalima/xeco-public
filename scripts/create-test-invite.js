/**
 * Script simples para criar convite de teste
 * 
 * USO:
 * node scripts/create-test-invite.js
 */

const admin = require('firebase-admin')
const crypto = require('crypto')

// Carrega variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

// Inicializa Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

const db = admin.firestore()

// Gera token único
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function createTestInvite() {
  console.log('\n🧪 CRIANDO CONVITE DE TESTE...\n')

  const token = generateToken()
  const testEmail = 'teste@afiliado.com'
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

  // Busca uma empresa qualquer
  const companiesSnapshot = await db.collection('companies').limit(1).get()
  
  if (companiesSnapshot.empty) {
    console.error('❌ ERRO: Nenhuma empresa encontrada no Firestore!')
    console.log('\n💡 Solução:')
    console.log('   1. Crie uma empresa primeiro no sistema')
    console.log('   2. Ou edite este script e coloque um ID de empresa existente\n')
    process.exit(1)
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
    message: 'Convite de teste - gerado automaticamente pelo script',
    status: 'PENDING',
    createdAt: admin.firestore.Timestamp.now(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    inviteUrl: `http://localhost:3000/affiliate/accept?token=${token}`,
    resentCount: 0
  }

  const docRef = await db.collection('affiliate_invitations').add(inviteData)

  console.log('✅ CONVITE CRIADO COM SUCESSO!\n')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📋 DADOS DO CONVITE:')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`   ID Firestore: ${docRef.id}`)
  console.log(`   Token:        ${token}`)
  console.log(`   Email:        ${testEmail}`)
  console.log(`   Empresa:      ${companyData.name}`)
  console.log(`   Comissão:     10%`)
  console.log(`   Expira em:    ${expiresAt.toLocaleDateString('pt-BR')}`)
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('🔗 OPÇÃO 1: URL COM TOKEN PRÉ-PREENCHIDO')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`   ${inviteData.inviteUrl}`)
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('🔗 OPÇÃO 2: DIGITAR TOKEN MANUALMENTE')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   URL: http://localhost:3000/affiliate/accept')
  console.log(`   Token: ${token}`)
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('📧 EMAIL PARA USAR:')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`   ${testEmail}`)
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('🎯 PASSO A PASSO PARA TESTAR:')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   1. Abra uma das URLs acima no navegador')
  console.log('   2. Digite o email: teste@afiliado.com')
  console.log('   3. Clique em "Aceitar Convite"')
  console.log('   4. Sistema criará conta com senha: Mudar123#')
  console.log('   5. Você será redirecionado para fazer login')
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('🔍 VERIFICAR NO FIREBASE:')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   Collection: affiliate_invitations')
  console.log(`   Document ID: ${docRef.id}`)
  console.log('═══════════════════════════════════════════════════════════════\n')
}

async function listInvites() {
  console.log('\n📋 ÚLTIMOS CONVITES CRIADOS:\n')
  console.log('═══════════════════════════════════════════════════════════════')
  
  const invites = await db.collection('affiliate_invitations')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get()

  if (invites.empty) {
    console.log('   ❌ Nenhum convite encontrado')
    console.log('═══════════════════════════════════════════════════════════════\n')
    return
  }

  invites.forEach((doc, index) => {
    const data = doc.data()
    const status = data.status === 'PENDING' ? '⏳ PENDENTE' : 
                   data.status === 'ACCEPTED' ? '✅ ACEITO' : 
                   data.status === 'EXPIRED' ? '⌛ EXPIRADO' : 
                   data.status
    
    console.log(`\n${index + 1}. ${data.recipientName || 'Sem nome'} - ${status}`)
    console.log(`   Email:  ${data.email}`)
    console.log(`   Loja:   ${data.storeName}`)
    console.log(`   Token:  ${data.inviteToken}`)
    if (data.status === 'PENDING') {
      console.log(`   URL:    ${data.inviteUrl}`)
    }
  })
  console.log('\n═══════════════════════════════════════════════════════════════\n')
}

async function cleanupTests() {
  console.log('\n🧹 LIMPANDO CONVITES DE TESTE...\n')
  
  const testInvites = await db.collection('affiliate_invitations')
    .where('email', '==', 'teste@afiliado.com')
    .get()

  if (testInvites.empty) {
    console.log('   ℹ️  Nenhum convite de teste encontrado\n')
    return
  }

  const batch = db.batch()
  testInvites.forEach(doc => {
    batch.delete(doc.ref)
  })
  await batch.commit()

  console.log(`✅ ${testInvites.size} convite(s) de teste removido(s)\n`)
}

// Menu
async function main() {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'list':
        await listInvites()
        break
      case 'clean':
        await cleanupTests()
        break
      case 'create':
      default:
        await createTestInvite()
    }
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.log('\n💡 Certifique-se que:')
    console.log('   - O arquivo .env.local existe e está configurado')
    console.log('   - As credenciais do Firebase estão corretas')
    console.log('   - Você tem permissão para acessar o Firestore\n')
  }

  process.exit(0)
}

main()
