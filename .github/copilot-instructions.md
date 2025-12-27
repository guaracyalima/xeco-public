# Xeco Public - AI Coding Agent Instructions

This is a **Next.js 15 mobile-first React application** with Firebase backend for the public area of the Xeco marketplace system.

## 🏗️ Architecture Overview

### Core Stack
- **Next.js 15** with App Router (`src/app/`) - SSR/SSG hybrid
- **Firebase** (Firestore + Auth + Storage) - Backend services  
- **Capacitor** - Cross-platform mobile deployment (iOS/Android)
- **n8n + Asaas** - Payment processing pipeline
- **Tailwind CSS v4** - Mobile-first styling with Coral design system

### Key Service Boundaries
```
Frontend (Next.js) → API Routes → n8n Webhook → Asaas API
                  ↘ Firebase (direct) → Firestore Collections
```

## 🔑 Critical Integration Patterns

### 1. Payment Flow Architecture
The checkout system uses a **validation-heavy** pattern where:
- `src/app/api/checkout/create-payment/route.ts` validates EVERYTHING before payment
- All images are converted to base64 via `services/base64-converter.ts` (CRITICAL for Asaas)
- Split calculations are done in `services/splitCalculationService.ts` (8% platform fee)
- Orders saved to Firestore with `PENDING` status before payment

**Never skip validations** - the n8n webhook expects pre-validated data.

### 2. Context Provider Hierarchy
The app uses **nested providers** in `layout.tsx`:
```tsx
AuthProvider → LocationProvider → AnalyticsProvider → FavoritesProvider 
  → LikedCompanyProvider → LikedProductProvider → CartProvider
```
Each provider handles **real-time Firestore subscriptions**. Use these contexts, don't create new Firebase listeners.

### 3. Firestore Collections Architecture
```
/users/{uid} - User profiles
/companies/{id} - Business listings  
/LikedCompany/{id} - Global favorites (not user subcollections)
/LikedProduct/{id} - Global favorites (not user subcollections)
/orders/{id} - Payment orders with PENDING/PAID/CANCELLED status
```

**Important**: Use global collections for analytics, not user subcollections.

## 🛠️ Development Workflow

### Essential Commands
```bash
npm run dev              # Development server (port 3000)
npm run test:e2e        # Full Playwright test suite
npm run test:smoke      # Quick validation tests
npm run cap:sync        # Capacitor mobile build prep
```

### Environment Setup
The app requires these environment variables:
- `NEXT_PUBLIC_FIREBASE_*` - Firebase config (all public)
- `NEXT_PUBLIC_N8N_URL` - Payment webhook endpoint
- `CHECKOUT_SIGNATURE_SECRET` - HMAC validation for webhooks

### Mobile Development Notes
- Always test with `npm run test:e2e:mobile` for mobile Chrome simulation
- Capacitor config points to Railway production URL for live testing
- PWA features are implemented - check `components/pwa/` for install prompts
- **Payment flows**: Use `useCapacitorPlatform()` hook to detect platform and `Browser.open()` for external URLs in mobile apps
- **Google Auth**: Use `GoogleAuthService.signInWithGoogle()` which automatically detects platform and uses native auth in mobile

## 🎨 Design System Conventions

### Color Usage
Use **Coral system** defined in `tailwind.config.ts`:
- Primary: `bg-coral-500` (#ff5a5f)
- Hover: `bg-coral-600` 
- Gradients: `bg-gradient-to-r from-coral-500 to-coral-600`

**Never hardcode colors** - change `tailwind.config.ts` to update entire app theme.

### Component Patterns
Components follow this structure:
```
src/components/
├── layout/     # Header, Footer, Layout wrappers
├── ui/         # Button, Card, Input primitives  
├── pwa/        # PWA install prompts
└── analytics/  # Consent banners, tracking
```

## 📚 Documentation Strategy

This project has **extensive documentation** in `/docs/` organized by feature:
- `N8N_*` files - Payment integration guides
- `CHECKOUT_*` files - Order processing docs  
- `AFFILIATE_*` files - Affiliate system docs
- `E2E_TESTING_GUIDE.md` - Comprehensive test scenarios

**Always check `/docs/` before implementing new features** - likely already documented with examples.

## 🧪 Testing Approach

### E2E Testing Philosophy
Playwright tests follow **user journey patterns**:
- `tests/checkout-n8n-integration.e2e.spec.ts` - Full payment flow
- `tests/authentication.e2e.spec.ts` - Firebase Auth flows
- `tests/favorites-analytics.e2e.spec.ts` - Real-time subscription tests

Tests run on **multiple viewports** (mobile-chrome, desktop-chromium) - ensure mobile compatibility.

### Test Data Strategy
Use `docs/TEST_DATA.md` for consistent test data. Tests should be **idempotent** and clean up after themselves.

## ⚠️ Common Gotchas

1. **Image handling**: Always convert to base64 for Asaas API - use `base64-converter.ts`
2. **Firebase rules**: Collections are global, not user-scoped - don't assume user isolation
3. **Mobile navigation**: Bottom tab bar is conditional - check `useIsMobile()` hook patterns
4. **PWA caching**: Service worker may cache old versions - test in incognito for fresh state
5. **Mobile payments**: Use `Browser.open()` for external URLs in Capacitor - check `useCapacitorPlatform()` hook

## 🚨 CONFIGURAÇÕES PROTEGIDAS - NÃO ALTERAR!

### Google Auth Mobile (CRÍTICO!)

As seguintes configurações são **OBRIGATÓRIAS** para o login Google funcionar no mobile. **NUNCA remova ou altere**:

#### 1. `capacitor.config.ts` - Plugin FirebaseAuthentication
```typescript
plugins: {
  // ... outras configs
  FirebaseAuthentication: {
    skipNativeAuth: false,        // ❌ NUNCA mudar para true
    providers: ['google.com'],    // ❌ NUNCA remover
  },
}
```

#### 2. `android/variables.gradle` - Google Auth Enabled
```gradle
rgcfaIncludeGoogle = true         // ❌ NUNCA mudar para false ou remover
```

#### 3. `android/app/google-services.json` - Client IDs
- O `client_id` com `client_type: 1` DEVE ser um ID real do Google Console
- **NUNCA invente ou altere** esses IDs - sempre baixe do Firebase Console

#### 4. `src/services/googleAuthService.ts` - Lógica de Plataforma
```typescript
// ❌ NUNCA use signInWithPopup/signInWithRedirect diretamente no mobile
// ✅ SEMPRE use a detecção de plataforma existente
if (platform === 'web') { signInWithPopup } 
else { FirebaseAuthentication.signInWithGoogle() }
```

**📖 Documentação completa**: `docs/GOOGLE_AUTH_MOBILE_FIX.md`

**Se o login Google parar de funcionar no mobile, SEMPRE verifique esses 4 pontos PRIMEIRO!**

## 🔧 Service Layer Patterns

Services in `src/services/` follow **async/await error handling**:
```typescript
export async function createPaymentCheckout(data: CheckoutData): Promise<ApiResponse<CheckoutResponse>> {
  try {
    // Validate input
    // Process data  
    // Call external API
    return { success: true, data: result }
  } catch (error) {
    console.error('Service error:', error)
    return { success: false, error: error.message }
  }
}
```

Always return `ApiResponse<T>` pattern for consistent error handling across the app.

## UI Healing System

### Step 1
Take a screenshot of each screen in question using the Playwright MCP

### Step 2  
Reference the directory `/docs/` and find the files `DESIGN_SYSTEM_XECO.md` and relevant design briefings

Based on those files, grade the outputs of Step 1 objectively against that standard, and give your response on a scale of 1 to 10

### Step 3
For any screens or components that have a score less than 8 out of 10, make changes, and then repeat from Step 1.

NÃO FAÇA COMMITS NO GIT ATÉ QUE EU TE ORDENE!