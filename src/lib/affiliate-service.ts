import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  updateDoc, 
  addDoc,
  setDoc,
  Timestamp 
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { AffiliateInvitation, Affiliated, AffiliateConfirmRequest, AffiliateConfirmResponse, User } from '@/types'

// Generate unique affiliate code
const generateAffiliateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate temporary password - now using fixed password
const generateTemporaryPassword = (): string => {
  return 'Mudar123#'
}

// Check if user exists by email
const checkUserExists = async (email: string): Promise<{ exists: boolean; userId?: string }> => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', email))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      return { exists: true, userId: userDoc.id }
    }
    
    return { exists: false }
  } catch (error) {
    console.error('Error checking user existence:', error)
    return { exists: false }
  }
}

// Create new user in Firestore with password change requirement
const createUserInFirestore = async (userId: string, userData: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, {
      ...userData,
      requiresPasswordChange: true, // Force password change on first login
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error creating user in Firestore:', error)
    throw error
  }
}

// Get invitation by token and email
export const getInvitationByTokenAndEmail = async (
  inviteToken: string, 
  email: string
): Promise<AffiliateInvitation | null> => {
  try {
    const invitationsRef = collection(db, 'affiliate_invitations')
    const q = query(
      invitationsRef, 
      where('inviteToken', '==', inviteToken),
      where('email', '==', email)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    
    return {
      id: doc.id,
      email: data.email,
      emailSentId: data.emailSentId,
      expiresAt: data.expiresAt,
      inviteToken: data.inviteToken,
      inviteUrl: data.inviteUrl,
      message: data.message,
      recipientName: data.recipientName,
      resentCount: data.resentCount,
      status: data.status,
      storeId: data.storeId,
      storeName: data.storeName,
      storeOwnerName: data.storeOwnerName,
      createdAt: data.createdAt?.toDate()
    } as AffiliateInvitation
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return null
  }
}

// Check if user is already an affiliate of the store
const checkExistingAffiliate = async (email: string, storeId: string): Promise<boolean> => {
  try {
    const affiliatesRef = collection(db, 'affiliated')
    const q = query(
      affiliatesRef,
      where('email', '==', email),
      where('company_relationed', '==', storeId)
    )
    const querySnapshot = await getDocs(q)
    
    return !querySnapshot.empty
  } catch (error) {
    console.error('Error checking existing affiliate:', error)
    return false
  }
}

// Main function to confirm affiliate invitation
export const confirmAffiliateInvitation = async (
  request: AffiliateConfirmRequest
): Promise<AffiliateConfirmResponse> => {
  try {
    const { inviteToken, email } = request
    
    // 1. Validate invitation
    const invitation = await getInvitationByTokenAndEmail(inviteToken, email)
    
    if (!invitation) {
      return {
        success: false,
        message: 'Token ou email inválido. Verifique os dados e tente novamente.'
      }
    }
    
    // 2. Check invitation status
    if (invitation.status !== 'PENDING') {
      return {
        success: false,
        message: 'Este convite já foi utilizado ou expirou.'
      }
    }
    
    // 3. Check expiration
    const expirationDate = new Date(invitation.expiresAt)
    if (expirationDate < new Date()) {
      // Mark as expired
      const invitationRef = doc(db, 'affiliate_invitations', invitation.id)
      await updateDoc(invitationRef, {
        status: 'EXPIRED',
        updatedAt: Timestamp.now()
      })
      
      return {
        success: false,
        message: 'Este convite expirou. Solicite um novo convite.'
      }
    }
    
    // 4. Check if user is already an affiliate of this store
    const isExistingAffiliate = await checkExistingAffiliate(email, invitation.storeId)
    if (isExistingAffiliate) {
      return {
        success: false,
        message: 'Este email já está cadastrado como afiliado desta empresa.'
      }
    }
    
    // 5. Check if user exists
    const userCheck = await checkUserExists(email)
    let userId = userCheck.userId
    let isNewUser = false
    let temporaryPassword: string | undefined
    
    // 6. Create user if doesn't exist
    if (!userCheck.exists) {
      try {
        temporaryPassword = generateTemporaryPassword()
        const userCredential = await createUserWithEmailAndPassword(auth, email, temporaryPassword)
        userId = userCredential.user.uid
        isNewUser = true
        
        // Create user document in Firestore
        await createUserInFirestore(userId, {
          id: userId,
          email: email,
          name: email.split('@')[0], // Use email prefix as temporary name
        })
        
        // Send password reset email for better UX
        await sendPasswordResetEmail(auth, email)
        
      } catch (authError: any) {
        console.error('Error creating user:', authError)
        return {
          success: false,
          message: 'Erro ao criar usuário. Tente novamente.'
        }
      }
    }
    
    if (!userId) {
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      }
    }
    
    // 7. Store name is already in invitation
    const storeName = invitation.storeName
    
    // 8. Generate unique affiliate code
    let affiliateCode = generateAffiliateCode()
    
    // Ensure code is unique
    let codeExists = true
    let attempts = 0
    while (codeExists && attempts < 10) {
      const affiliatesRef = collection(db, 'affiliated')
      const codeQuery = query(affiliatesRef, where('invite_code', '==', affiliateCode))
      const codeSnapshot = await getDocs(codeQuery)
      
      if (codeSnapshot.empty) {
        codeExists = false
      } else {
        affiliateCode = generateAffiliateCode()
        attempts++
      }
    }
    
    // 9. Create affiliate record
    const affiliateData: Omit<Affiliated, 'id'> = {
      user: userId,
      walletId: '', // To be filled later when integrated with payment system
      invite_code: affiliateCode,
      active: 'SIM',
      company_relationed: invitation.storeId,
      email: email,
      whatsapp: '', // To be filled by user later
      name: email.split('@')[0], // Temporary name
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const affiliatesRef = collection(db, 'affiliated')
    const affiliateDoc = await addDoc(affiliatesRef, {
      ...affiliateData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    // 10. Mark invitation as accepted
    const invitationRef = doc(db, 'affiliate_invitations', invitation.id)
    await updateDoc(invitationRef, {
      status: 'ACCEPTED',
      acceptedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    return {
      success: true,
      message: `Parabéns! Você agora é um afiliado da ${storeName}.`,
      data: {
        affiliateId: affiliateDoc.id,
        storeName: storeName,
        inviteCode: affiliateCode,
        isNewUser,
        requiresPasswordChange: isNewUser
      }
    }
    
  } catch (error) {
    console.error('Error confirming affiliate invitation:', error)
    return {
      success: false,
      message: 'Erro interno do servidor. Tente novamente.'
    }
  }
}