import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { determineAffiliateWallet, saveAffiliateAsaasAccount, createAsaasAccount } from '@/services/walletService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userId } = body

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Token e userId são obrigatórios' },
        { status: 400 }
      )
    }

    // 1. Busca e valida o convite
    const invitesRef = collection(db, 'affiliate_invitations')
    const q = query(invitesRef, where('inviteToken', '==', token))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    const inviteDoc = querySnapshot.docs[0]
    const inviteData = inviteDoc.data()

    // Verifica se o convite está expirado
    const expiresAt = inviteData.expiresAt?.toDate()
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Convite expirado' },
        { status: 400 }
      )
    }

    // Verifica se o convite já foi aceito
    if (inviteData.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Convite já foi utilizado' },
        { status: 400 }
      )
    }

    // 2. Busca dados do usuário
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const userData = userSnap.data()
    
    if (!userData.document_number) {
      return NextResponse.json(
        { error: 'Usuário não possui CPF/CNPJ cadastrado. Por favor, complete seu perfil antes de aceitar o convite.' },
        { status: 400 }
      )
    }

    // 3. Determina ou cria a wallet do afiliado
    let walletInfo
    try {
      walletInfo = await determineAffiliateWallet(userId, userData.document_number)
    } catch (error: any) {
      // Se não existe conta, precisa criar
      if (error.message === 'REQUIRES_ASAAS_ACCOUNT_CREATION') {
        // Validações de dados necessários
        if (!userData.fullName || !userData.email) {
          return NextResponse.json(
            { error: 'Dados incompletos. Por favor, complete seu perfil (nome completo e email) antes de aceitar o convite.' },
            { status: 400 }
          )
        }

        // Cria nova conta Asaas
        const asaasAccount = await createAsaasAccount({
          name: userData.fullName,
          email: userData.email,
          cpfCnpj: userData.document_number,
          phone: userData.phone || userData.document_number, // Fallback para o documento se não houver telefone
          mobilePhone: userData.phone || undefined
        })

        // Salva os dados da conta
        await saveAffiliateAsaasAccount(userId, {
          walletId: asaasAccount.walletId,
          accountId: asaasAccount.accountId,
          cpfCnpj: userData.document_number
        })

        walletInfo = {
          walletId: asaasAccount.walletId,
          walletSource: 'personal' as const
        }
      } else {
        throw error
      }
    }

    // 4. Verifica se já existe afiliação ativa para este usuário e empresa
    const affiliatedRef = collection(db, 'affiliated')
    const existingAffiliateQuery = query(
      affiliatedRef,
      where('user', '==', userId),
      where('company_relationed', '==', inviteData.storeId),
      where('active', '==', true)
    )
    const existingAffiliateSnap = await getDocs(existingAffiliateQuery)

    if (!existingAffiliateSnap.empty) {
      return NextResponse.json(
        { error: 'Você já é afiliado desta empresa' },
        { status: 400 }
      )
    }

    // 5. Cria o registro de afiliado
    const affiliatedData = {
      user: userId,
      company_relationed: inviteData.storeId,
      walletId: walletInfo.walletId,
      walletSource: walletInfo.walletSource,
      ...(walletInfo.ownCompanyId && { ownCompanyId: walletInfo.ownCompanyId }),
      commissionRate: inviteData.commissionRate,
      active: true,
      email: userData.email,
      name: userData.fullName,
      whatsapp: userData.phone || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    const affiliatedDocRef = await addDoc(affiliatedRef, affiliatedData)

    // 6. Atualiza o status do convite
    await updateDoc(doc(db, 'affiliate_invitations', inviteDoc.id), {
      status: 'ACCEPTED',
      acceptedAt: Timestamp.now(),
      acceptedBy: userId,
      affiliatedId: affiliatedDocRef.id
    })

    // 7. Retorna sucesso com informações da wallet
    return NextResponse.json({
      success: true,
      affiliateId: affiliatedDocRef.id,
      walletSource: walletInfo.walletSource,
      companyName: walletInfo.companyName || null,
      message: walletInfo.walletSource === 'company' 
        ? `Suas comissões serão depositadas na conta da sua franquia "${walletInfo.companyName}"`
        : 'Suas comissões serão depositadas na sua conta pessoal Asaas'
    })

  } catch (error) {
    console.error('Erro ao aceitar convite:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
