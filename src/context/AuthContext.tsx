'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as FirebaseUser, onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { User, UserProfile } from '@/types'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Handler para capturar resultado de redirect (Google Auth em WebView)
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log('✅ Redirect login capturado:', result.user.email)
        }
      } catch (error) {
        console.error('❌ Erro ao processar redirect:', error)
      }
    }
    
    handleRedirect()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        // Buscar dados completos do usuário no Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          
          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data()
            setUserProfile(firestoreData as UserProfile)
          } else {
            // Se o documento não existe, criar um perfil padrão
            console.warn('Documento do usuário não encontrado, criando perfil padrão...')
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
              phone_number: '',
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              city: '',
              state: '',
              cep: '',
              document_number: '',
              photo_url: '',
              entrepreneur: 'NAO',
              affiliated: 'NAO',
              completed_profile: 'NAO',
              enabled: true,
              haveanaccount: 'SIM',
              role: ['user'],
              created_time: new Date().toISOString(),
            }
            
            // Salvar o perfil padrão
            await setDoc(userDocRef, defaultProfile)
            setUserProfile(defaultProfile)
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error)
          // Criar perfil padrão em caso de erro
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid)
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
              phone_number: '',
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              city: '',
              state: '',
              cep: '',
              document_number: '',
              photo_url: '',
              entrepreneur: 'NAO',
              affiliated: 'NAO',
              completed_profile: 'NAO',
              enabled: true,
              haveanaccount: 'SIM',
              role: ['user'],
              created_time: new Date().toISOString(),
            }
            await setDoc(userDocRef, defaultProfile)
            setUserProfile(defaultProfile)
          } catch (createError) {
            console.error('Erro ao criar perfil padrão:', createError)
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
              phone_number: '',
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              city: '',
              state: '',
              cep: '',
              document_number: '',
              photo_url: '',
              entrepreneur: 'NAO',
              affiliated: 'NAO',
              completed_profile: 'NAO',
              enabled: true,
              haveanaccount: 'SIM',
              role: ['user'],
              created_time: new Date().toISOString(),
            }
            setUserProfile(defaultProfile)
          }
        }

        const userData: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setUser(userData)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signOut = async () => {
    await auth.signOut()
  }

  const value = {
    user,
    userProfile,
    firebaseUser,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}