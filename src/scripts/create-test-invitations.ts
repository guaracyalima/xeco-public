import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Script para criar dados de teste para o sistema de afiliados
export async function createTestAffiliateInvitation() {
  try {
    const testInvitation = {
      email: "teste@exemplo.com",
      emailSentId: "pending",
      expiresAt: "2025-12-31T23:59:59-03:00", // Válido até final do ano
      inviteToken: "6cc4640169041b23b145cd34fe9c194df44f99d5af488268d77217b01f9f431b",
      inviteUrl: "http://localhost:3000/affiliate/accept?token=6cc4640169041b23b145cd34fe9c194df44f99d5af488268d77217b01f9f431b",
      message: "Bem-vindo ao nosso programa de afiliados! Você foi selecionado para fazer parte do nosso time.",
      recipientName: "Usuário Teste",
      resentCount: 0,
      status: "PENDING",
      storeId: "store-123",
      storeName: "Marina Biquínis",
      storeOwnerName: "Admin"
    }

    const docRef = await addDoc(collection(db, 'affiliate_invitations'), testInvitation)
    console.log('✅ Convite de teste criado com ID:', docRef.id)
    console.log('🔗 URL de teste:', testInvitation.inviteUrl)
    console.log('📧 Email de teste:', testInvitation.email)
    
    return {
      success: true,
      invitationId: docRef.id,
      testUrl: testInvitation.inviteUrl,
      testEmail: testInvitation.email
    }
  } catch (error) {
    console.error('❌ Erro ao criar convite de teste:', error)
    return {
      success: false,
      error: error
    }
  }
}

// Função para criar múltiplos convites de teste com diferentes cenários
export async function createMultipleTestInvitations() {
  const invitations = [
    {
      email: "valido@teste.com",
      emailSentId: "pending", 
      expiresAt: "2025-12-31T23:59:59-03:00",
      inviteToken: "token_valido_123456789abcdef",
      inviteUrl: "http://localhost:3000/affiliate/accept?token=token_valido_123456789abcdef",
      message: "Convite válido para teste",
      recipientName: "Teste Válido",
      resentCount: 0,
      status: "PENDING",
      storeId: "store-123", 
      storeName: "Loja Teste",
      storeOwnerName: "Admin"
    },
    {
      email: "expirado@teste.com",
      emailSentId: "pending",
      expiresAt: "2020-01-01T00:00:00-03:00", // Expirado
      inviteToken: "token_expirado_123456789abcdef",
      inviteUrl: "http://localhost:3000/affiliate/accept?token=token_expirado_123456789abcdef",
      message: "Convite expirado para teste",
      recipientName: "Teste Expirado",
      resentCount: 0,
      status: "PENDING",
      storeId: "store-123",
      storeName: "Loja Teste", 
      storeOwnerName: "Admin"
    },
    {
      email: "aceito@teste.com",
      emailSentId: "sent_123",
      expiresAt: "2025-12-31T23:59:59-03:00",
      inviteToken: "token_aceito_123456789abcdef", 
      inviteUrl: "http://localhost:3000/affiliate/accept?token=token_aceito_123456789abcdef",
      message: "Convite já aceito para teste",
      recipientName: "Teste Aceito",
      resentCount: 0,
      status: "ACCEPTED", // Já aceito
      storeId: "store-123",
      storeName: "Loja Teste",
      storeOwnerName: "Admin"
    }
  ]

  try {
    const results = []
    for (const invitation of invitations) {
      const docRef = await addDoc(collection(db, 'affiliate_invitations'), invitation)
      results.push({
        id: docRef.id,
        email: invitation.email,
        token: invitation.inviteToken,
        status: invitation.status,
        url: invitation.inviteUrl
      })
    }
    
    console.log('✅ Convites de teste criados:', results)
    return { success: true, invitations: results }
  } catch (error) {
    console.error('❌ Erro ao criar convites de teste:', error)
    return { success: false, error }
  }
}