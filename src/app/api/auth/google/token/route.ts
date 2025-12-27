import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri: customRedirectUri } = await request.json()

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    // Configuração do Google OAuth
    const clientId = process.env.GOOGLE_CLIENT_ID || '300882600959-0mftq5khqlo6c8c1rgvam48u2llchtrh.apps.googleusercontent.com'
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    // Usar redirectUri enviado pelo client ou o default
    const redirectUri = customRedirectUri || `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/google/callback`
    
    console.log('🔑 Token exchange - Redirect URI:', redirectUri)

    if (!clientSecret) {
      console.error('❌ GOOGLE_CLIENT_SECRET not configured')
      return NextResponse.json(
        { success: false, error: 'Server configuration error: missing client secret' },
        { status: 500 }
      )
    }

    // Trocar código por token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange error:', tokenData)
      return NextResponse.json(
        { success: false, error: tokenData.error_description || 'Failed to exchange token' },
        { status: 400 }
      )
    }

    // Buscar informações do usuário
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to get user info' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      idToken: tokenData.id_token,
      accessToken: tokenData.access_token,
      userData
    })

  } catch (error: any) {
    console.error('❌ Google token API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}