import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json()
    
    console.log('🔧 Consertando order:', orderId, 'com userId:', userId)
    
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      userId: userId,
      updatedAt: new Date().toISOString()
    })
    
    console.log('✅ Order consertada!')
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
