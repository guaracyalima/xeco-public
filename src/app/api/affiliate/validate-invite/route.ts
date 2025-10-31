import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      )
    }

    // Busca o convite pelo token
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

    // Retorna os dados do convite
    return NextResponse.json({
      storeId: inviteData.storeId,
      storeName: inviteData.storeName,
      storeOwnerName: inviteData.storeOwnerName,
      commissionRate: inviteData.commissionRate,
      message: inviteData.message,
      expiresAt: expiresAt?.toISOString(),
      recipientName: inviteData.recipientName,
      recipientEmail: inviteData.email
    })

  } catch (error) {
    console.error('Erro ao validar convite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
