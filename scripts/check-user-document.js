const admin = require('firebase-admin');

// Inicializa Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'xeco-334f5',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
}

const db = admin.firestore();

async function checkUserDocument(email) {
  try {
    console.log(`\n🔍 Buscando usuário com email: ${email}\n`);
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      console.log('❌ Usuário não encontrado\n');
      return;
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ Usuário encontrado!\n');
    console.log('📄 Dados:');
    console.log('- ID:', userDoc.id);
    console.log('- Nome:', userData.fullName || userData.displayName || 'Não informado');
    console.log('- Email:', userData.email);
    console.log('- CPF/CNPJ:', userData.document_number || '❌ NÃO CADASTRADO');
    console.log('- Telefone:', userData.phone || 'Não informado');
    console.log('- Data de criação:', userData.createdAt?.toDate() || 'Não informado');
    console.log('\n');
    
    if (!userData.document_number) {
      console.log('⚠️  ATENÇÃO: Usuário SEM CPF/CNPJ cadastrado!');
      console.log('⚠️  O formulário de criação de conta Asaas VAI APARECER.\n');
    } else {
      console.log('✅ Usuário tem CPF/CNPJ cadastrado.');
      console.log('✅ Sistema tentará criar conta automaticamente.\n');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Pega email da linha de comando ou usa o padrão
const email = process.argv[2] || 'guaracyaraujo@gmail.com';
checkUserDocument(email);
