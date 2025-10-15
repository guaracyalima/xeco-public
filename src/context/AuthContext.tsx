'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        // Aqui você pode buscar dados adicionais do usuário no Firestore
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